"use client";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";

const Layout = ({ children }: { children: ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();

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
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/" className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold">TravelApp</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search destinations..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
            {isUserMenuOpen && (
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
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
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
              isMobileMenuOpen
                ? "fixed inset-y-0 left-0 z-50"
                : "hidden lg:block"
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
