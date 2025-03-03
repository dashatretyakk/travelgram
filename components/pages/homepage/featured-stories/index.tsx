//@ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MapPin, Filter } from "lucide-react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";
import StoryViewerModal from "@/components/modals/StoryViewerModal";

const FeaturedStories = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStories();
  }, [activeFilter]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const storiesRef = collection(db, "stories");
      let q = query(storiesRef, orderBy("createdAt", "desc"), limit(9));

      const querySnapshot = await getDocs(q);
      const fetchedStories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStories(fetchedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
      return date.toLocaleDateString();
    } else if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`;
    } else {
      return "Just now";
    }
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "trending", label: "🔥 Trending" },
    { id: "nature", label: "🌲 Nature" },
    { id: "cities", label: "🌆 Cities" },
    { id: "beaches", label: "🏖️ Beaches" },
    { id: "mountains", label: "⛰️ Mountains" },
  ];

  const StoryCard = ({ story }) => {
    const handleClick = () => {
      setSelectedStory(story);
      setIsModalOpen(true);
    };

    return (
      <div
        onClick={handleClick}
        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={story.images[0]} // Display first image as thumbnail
            alt={story.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {story.images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              +{story.images.length - 1}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={story.userImage}
              alt={story.userName}
              className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-gray-100"
            />
            <div>
              <h4 className="font-medium text-sm">{story.userName}</h4>
              {story.location && (
                <div className="flex items-center text-gray-500 text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {story.location}
                </div>
              )}
            </div>
          </div>

          {/* Story Title & Description */}
          <h3 className="font-semibold text-lg mb-2">{story.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {story.description}
          </p>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {story.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Interaction Stats */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{story.likes || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{story.comments || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {formatTimestamp(story.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Stories
            </h2>
          </div>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/3] rounded-xl mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center pt-8">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
            Load More Stories
          </button>
        </div>
      </div>

      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
      />
    </>
  );
};

export default FeaturedStories;
