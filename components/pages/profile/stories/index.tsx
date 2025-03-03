//@ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/utils/firebase";
import StoryViewerModal from "@/components/modals/StoryViewerModal";

const Stories = ({ userId }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const storiesRef = collection(db, "stories");
        const q = query(
          storiesRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedStories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: getRelativeTime(doc.data().createdAt?.toDate()),
        }));

        setStories(fetchedStories);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStories();
    }
  }, [userId]);

  const getRelativeTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
      return date.toLocaleDateString();
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const openStory = (story) => {
    setSelectedStory(story);
    setIsStoryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 aspect-[4/3] rounded-xl mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 hover:text-blue-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No stories yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stories.map((story) => (
          <div
            key={story.id}
            className="group relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
            onClick={() => openStory(story)}
          >
            <div className="aspect-[4/3]">
              <img
                src={story.images[0]} // Display first image as thumbnail
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {story.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  +{story.images.length - 1}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{story.title}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {story.likes > 999
                      ? `${(story.likes / 1000).toFixed(1)}K`
                      : story.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {story.comments}
                  </span>
                </div>
                <span>{story.date}</span>
              </div>
              {story.location && (
                <div className="mt-2 text-sm text-gray-500">
                  📍 {story.location}
                </div>
              )}
              {story.tags && story.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {story.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <StoryViewerModal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
      />
    </>
  );
};

export default Stories;
