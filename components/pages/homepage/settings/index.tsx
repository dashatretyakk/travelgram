//@ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  User,
  Globe,
  LogOut,
  MapPin,
  Link as LinkIcon,
  Save,
  Edit2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";

const SettingsPage = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    email: "",
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({
            ...userDoc.data(),
            email: user.email,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "users", user.uid), {
        name: userData.name,
        username: userData.username,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        updatedAt: new Date(),
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Saving..." : "Save Changes"}</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Profile Information */}
          <div className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
                placeholder="Your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
                placeholder="@username"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={userData.bio}
                onChange={(e) =>
                  setUserData({ ...userData, bio: e.target.value })
                }
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={userData.location}
                  onChange={(e) =>
                    setUserData({ ...userData, location: e.target.value })
                  }
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg disabled:bg-gray-50"
                  placeholder="Your location"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={userData.website}
                  onChange={(e) =>
                    setUserData({ ...userData, website: e.target.value })
                  }
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg disabled:bg-gray-50"
                  placeholder="https://your-website.com"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-50"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full mt-6 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
