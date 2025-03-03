//@ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin,
  Globe,
  Mail,
  Instagram,
  Twitter,
  Grid,
  BookMarked,
  Map,
  Heart,
  Settings,
  Edit3,
  Camera,
  MessageCircle,
  Clock,
  ChevronRight,
  Share2,
  Users,
  Medal,
  User,
  Bookmark,
  Edit,
  Plus,
} from "lucide-react";
import CreateStoryModal from "@/components/modals/story-modal";
import { useAuth } from "@/context/AuthContextProvider";
import { db } from "@/utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import Stories from "./stories";
import CreateRouteModal from "@/components/modals/CreateRouteModal";
import Routes from "./routes";

const Profile = () => {
  const { slug } = useParams();

  const [activeTab, setActiveTab] = useState("stories");
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Current logged-in user
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Clean up and decode the slug
        const cleanSlug = decodeURIComponent(slug).replace("@", "");
        console.log(cleanSlug);

        // Query users collection by username (since that's what you have in Firestore)
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", `@${cleanSlug}`));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const userId = querySnapshot.docs[0].id;

          // Check if current user is the profile owner
          setIsOwner(user?.uid === userId);

          setProfileData({
            ...userData,
            userId,
          });

          // Fetch stories if they exist
          if (userData.stories > 0) {
            const storiesRef = collection(db, "stories");
            const storiesQuery = query(
              storiesRef,
              where("userId", "==", userId)
            );
            const storiesSnapshot = await getDocs(storiesQuery);

            const stories = storiesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setProfileData((prev) => ({
              ...prev,
              content: {
                ...prev.content,
                stories,
              },
            }));
          }

          // Fetch saved items
          const savedRef = collection(db, "saved");
          const savedQuery = query(savedRef, where("userId", "==", userId));
          const savedSnapshot = await getDocs(savedQuery);

          const saved = savedSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setProfileData((prev) => ({
            ...prev,
            content: {
              ...prev.content,
              saved,
            },
          }));
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProfileData();
    }
  }, [slug, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profileData) {
    return <div>User not found</div>;
  }

  const quickActions = [
    ...(isOwner
      ? [
          // {
          //   label: "Edit Profile",
          //   icon: Edit,
          //   color: "bg-blue-50 text-blue-600",
          //   onClick: () => {
          //     /* Add edit functionality */
          //   },
          // },
          {
            label: "Create Story",
            icon: Plus,
            color: "bg-red-50 text-red-600",
            onClick: () => setIsCreateStoryModalOpen(true),
          },
          {
            label: "Route Creation",
            icon: Plus,
            color: "bg-purple-50 text-purple-600",
            onClick: () => setIsCreateRouteModalOpen(true),
          },
        ]
      : [
          {
            label: "Follow",
            icon: Users,
            color: "bg-blue-50 text-blue-600",
            onClick: () => {
              /* Add follow functionality */
            },
          },
        ]),
  ];
  const sections = [
    { id: "stories", label: "Stories", icon: Grid },
    // { id: "saved", label: "Saved", icon: BookMarked },
    { id: "routes", label: "Routes", icon: Map },
  ];

  const userContent = {
    saved: [
      {
        id: 1,
        title: "Hidden Beaches of Bali",
        image:
          "https://images.unsplash.com/photo-1537956965359-7573183d1f57?q=80&w=600&h=400&fit=crop",
        author: "Emma Watson",
        date: "Saved 3 days ago",
      },
      {
        id: 2,
        title: "Swiss Alps Guide",
        image:
          "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=600&h=400&fit=crop",
        author: "Mike Chen",
        date: "Saved 1 week ago",
      },
    ],
  };

  console.log(user);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <img
                  src={profileData.photoURL}
                  alt={profileData.name}
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                />
                {isOwner && (
                  <button className="absolute bottom-0 right-0 p-1 bg-blue-500 rounded-full text-white hover:bg-blue-600">
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.name}
                </h1>
                <p className="text-gray-500">{profileData.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${action.color}`}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <div className="space-y-4">
                <p className="text-gray-600">{user?.bio}</p>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{user?.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{user?.website}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {/* <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Stats</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    {profileData.stories || 0}
                  </div>
                  <div className="text-sm text-gray-500">Stories</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    {profileData.followers || 0}
                  </div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    {profileData.following || 0}
                  </div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
              </div>
            </div> */}

            {/* Badges Section */}
            {user?.badges ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Badges</h2>
                <div className="space-y-3">
                  {user?.badges.map((badge) => (
                    <div
                      key={badge}
                      className="flex items-center p-3 bg-blue-50 rounded-lg"
                    >
                      <Medal className="w-5 h-5 text-blue-500 mr-3" />
                      <span className="text-blue-700 font-medium">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              {sections !== undefined ? (
                <div className="border-b border-gray-200">
                  <div className="flex space-x-8 p-4">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveTab(section.id)}
                          className={`flex items-center space-x-2 py-2 px-1 border-b-2 ${
                            activeTab === section.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{section.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="p-6">
                {activeTab === "stories" && (
                  <Stories userId={profileData.userId} />
                )}

                {activeTab === "saved" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userContent.saved.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                      >
                        <div className="aspect-[16/9]">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1">
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>by {item.author}</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "routes" && (
                  <Routes userId={profileData.userId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
      />
      <CreateRouteModal
        isOpen={isCreateRouteModalOpen}
        onClose={() => setIsCreateRouteModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
