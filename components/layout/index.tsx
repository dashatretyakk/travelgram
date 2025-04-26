"use client";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  Map,
  Users,
  Heart,
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  Bookmark,
  ExternalLink,
  Globe,
  MessageCircle,
  Share2,
  Star,
  BookmarkPlus,
  LogOut,
  SettingsIcon,
  UserCircle,
  MapPin,
  Check,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";
import { signOut } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useClickAway } from "@/hooks/useClickAway";
import { performSearch, StoryData, RouteData, PostData } from "@/utils/search";
import { useModalStore } from "@/context/ModalStore";

// Add these interfaces at the top of the file, after the imports
interface NotificationData {
  id: string;
  type: "like" | "comment";
  contentType: "story" | "post" | "route";
  contentId: string;
  contentTitle?: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  read: boolean;
  createdAt: Timestamp;
}

const Layout = ({ children }: { children: ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    stories: StoryData[];
    routes: RouteData[];
    posts: PostData[];
  }>({ stories: [], routes: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { openStoryModal, openRouteModal } = useModalStore();

  // Use click away hooks for dropdowns
  useClickAway(searchContainerRef, () => setShowSearchResults(false));
  useClickAway(notificationsRef, () => setShowNotifications(false));
  useClickAway(userMenuRef, () => setUserMenuOpen(false));

  // Check offline status
  useEffect(() => {
    function handleOnlineStatusChange() {
      setIsOffline(!navigator.onLine);
    }

    // Check initial status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline status
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  const navigationItems = [
    { id: "stories", label: "Featured Stories", icon: Home, href: "/" },
    {
      id: "trending",
      label: "Trending Routes",
      icon: Compass,
      href: "/trending",
    },
    { id: "community", label: "Community", icon: Users, href: "/community" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  const quickLinks = [
    { id: 1, title: "Travel Guides", icon: Bookmark },
    { id: 2, title: "Top Destinations", icon: Star },
    { id: 3, title: "Share Your Story", icon: Share2 },
    { id: 4, title: "Community Forum", icon: MessageCircle },
    { id: 5, title: "Travel Resources", icon: Globe },
  ];

  const trendingTopics = [
    { id: 1, title: "Summer in Europe", count: "2.4k discussions" },
    { id: 2, title: "Solo Travel Tips", count: "1.8k discussions" },
    { id: 3, title: "Budget Destinations", count: "3.2k discussions" },
    { id: 4, title: "Adventure Sports", count: "956 discussions" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications for the current user
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as NotificationData)
      );

      setNotifications(notificationsData);

      // Count unread notifications
      const unread = notificationsData.filter(
        (notification) => !notification.read
      ).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Update search handling to use the utility function
  const handleSearchChange = async (term: string) => {
    setSearchQuery(term);
    setShowSearchResults(term.length > 0);

    if (!term || term.length < 2) {
      setSearchResults({ stories: [], routes: [], posts: [] });
      setIsSearching(false);
      return;
    }

    if (isOffline) {
      // When offline, show a message instead of attempting to search
      setIsSearching(false);
      setSearchResults({
        stories: [
          {
            id: "offline",
            title: "Offline Mode",
            description: "Search is unavailable while offline",
          },
        ],
        routes: [],
        posts: [],
      });
      return;
    }

    setIsSearching(true);

    try {
      const results = await performSearch(term);
      setSearchResults(results);
    } catch (error) {
      console.error("Error in search:", error);
      setSearchResults({
        stories: [
          {
            id: "error",
            title: "Search Error",
            description: "Unable to complete search. Please try again.",
          },
        ],
        routes: [],
        posts: [],
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many requests
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearchChange(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSearchResults(false);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchItemClick = (
    type: "story" | "route" | "post",
    id: string
  ) => {
    setShowSearchResults(false);
    if (type === "story") {
      const story = searchResults.stories.find((s) => s.id === id);
      if (story) {
        openStoryModal(story);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    } else if (type === "route") {
      const route = searchResults.routes.find((r) => r.id === id);
      if (route) {
        openRouteModal(route);
      } else {
        router.push(`/route/${id}`);
      }
    } else if (type === "post") {
      router.push(`/community/${id}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await updateDoc(doc(db, "notifications", notification.id), {
          read: true,
        });
      }

      // Navigate to the appropriate content
      if (notification.contentType === "story") {
        // For stories, we'll need to open the story modal
        // This would depend on how your story viewing is implemented
        router.push(`/?storyId=${notification.contentId}`);
      } else if (notification.contentType === "post") {
        router.push(`/community/${notification.contentId}`);
      } else if (notification.contentType === "route") {
        router.push(`/route/${notification.contentId}`);
      }

      // Close notifications panel
      setShowNotifications(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter(
        (notification) => !notification.read
      );

      // Update each notification
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, "notifications", notification.id), {
          read: true,
        });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const date = timestamp.toDate();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);

    if (diffInSec < 60) return "Just now";
    if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
    if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
    if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)}d ago`;

    return date.toLocaleDateString();
  };
  console.log(searchResults);
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/" className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold">TravelApp</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="flex-grow max-w-md relative" ref={searchContainerRef}>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isOffline
                    ? "Search (offline mode)"
                    : "Search stories and routes..."
                }
                className={`w-full py-2 pl-10 pr-4 rounded-full border ${
                  isOffline ? "bg-gray-100 text-gray-500" : "bg-white"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                disabled={isOffline}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {showSearchResults && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {isOffline ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Search is unavailable in offline mode
                    </p>
                  </div>
                ) : isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-pulse flex justify-center space-x-2">
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : (
                  <div>
                    {/* Stories Section */}
                    {searchResults.stories.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 px-2 mb-1">
                          STORIES
                        </div>
                        {searchResults.stories.map((story) => (
                          <div
                            key={story.id}
                            className="py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer flex items-start gap-3"
                            onClick={() =>
                              handleSearchItemClick("story", story.id)
                            }
                          >
                            {story.images?.[0] ? (
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                <img
                                  src={story.images[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {story.title}
                              </p>
                              {story.location && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span className="truncate">
                                    {story.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Routes Section */}
                    {searchResults.routes.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500 px-2 mb-1">
                          ROUTES
                        </div>
                        {searchResults.routes.map((route) => (
                          <div
                            key={route.id}
                            className="py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer flex items-start gap-3"
                            onClick={() =>
                              handleSearchItemClick("route", route.id)
                            }
                          >
                            {route.mainImage.length > 10 ? (
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                <img
                                  src={route.mainImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-blue-50 flex items-center justify-center">
                                <Compass className="w-5 h-5 text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {route.title}
                              </p>
                              {route.stops &&
                                route.stops.length > 0 &&
                                route.stops[0].location && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate">
                                      {route.stops[0].location}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Posts Section */}
                    {searchResults.posts.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500 px-2 mb-1">
                          COMMUNITY
                        </div>
                        {searchResults.posts.map((post) => (
                          <div
                            key={post.id}
                            className="py-2 px-3 hover:bg-gray-50 rounded-md cursor-pointer flex items-start gap-3"
                            onClick={() =>
                              handleSearchItemClick("post", post.id)
                            }
                          >
                            {post.userPhoto ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={post.userPhoto}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {post.title}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                <span className="truncate">
                                  {post.userName || "Community post"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results state - update to check for posts too */}
                    {searchResults.stories.length === 0 &&
                      searchResults.routes.length === 0 &&
                      searchResults.posts.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">
                            No results found for "{searchQuery}"
                          </p>
                        </div>
                      )}

                    {/* View all results */}
                    <div className="p-2 border-t border-gray-100">
                      <button
                        className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                        onClick={handleSearch}
                      >
                        View all results
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                          !notification.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {notification.senderPhoto ? (
                              <img
                                src={notification.senderPhoto}
                                alt=""
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserCircle className="w-6 h-6 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">
                                {notification.senderName}
                              </span>{" "}
                              {notification.type === "like" ? (
                                <>liked your {notification.contentType}</>
                              ) : (
                                <>
                                  commented on your {notification.contentType}
                                </>
                              )}
                              {notification.contentTitle && (
                                <>
                                  :{" "}
                                  <span className="italic">
                                    "{notification.contentTitle}"
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-2 border border-gray-100 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-medium">
                        {user?.name?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </h3>
                      <p className="text-xs text-gray-500">{user?.username}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href={`/profile/${user?.username}`}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            w-64 border-r border-gray-200 bg-white flex-shrink-0
            ${
              mobileMenuOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"
            }
          `}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
