//@ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  or,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Tag,
  Filter,
  Clock,
  Compass,
  Users,
  Search,
} from "lucide-react";
import Link from "next/link";
import { performSearch, StoryData, RouteData, PostData } from "@/utils/search";
import { useModalStore } from "@/context/ModalStore";

const SearchResults = () => {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const { openStoryModal, openRouteModal } = useModalStore();

  const [results, setResults] = useState<{
    stories: StoryData[];
    routes: RouteData[];
    posts: PostData[];
    isLoading: boolean;
  }>({
    stories: [],
    routes: [],
    posts: [],
    isLoading: true,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (queryParam) {
      executeSearch(queryParam);
    } else {
      setResults({ stories: [], routes: [], posts: [], isLoading: false });
      setLoading(false);
    }
  }, [queryParam]);

  const executeSearch = async (searchTerm) => {
    setLoading(true);
    try {
      // Use the shared search utility
      const searchResults = await performSearch(searchTerm);

      setResults({
        ...searchResults,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error searching:", error);
      setResults({
        stories: [],
        routes: [],
        posts: [],
        isLoading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  const StoryCard = ({ story }) => {
    const handleClick = () => {
      openStoryModal(story);
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

  const RouteCard = ({ route }) => {
    const handleClick = () => {
      openRouteModal(route);
    };

    return (
      <div
        onClick={handleClick}
        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative aspect-video overflow-hidden">
          {route.mainImage ? (
            <img
              src={route.mainImage}
              alt={route.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <Compass className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          )}
          {route.duration && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {route.duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">{route.title}</h3>

          {route.destination && (
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              {route.destination}
            </div>
          )}

          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {route.description}
          </p>

          {/* Tags */}
          {route.tags && route.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {route.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Route Stats */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{route.likes || 0}</span>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {formatTimestamp(route.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Count total results
  const totalResults =
    results.stories.length + results.routes.length + results.posts.length;

  return (
    <div className="p-6 space-y-6">
      {/* Search Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Search Results for "{queryParam}"
        </h2>
        <p className="text-gray-600 mt-1">
          {results.isLoading ? "Searching..." : `Found ${totalResults} results`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Results ({totalResults})
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "stories"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Stories ({results.stories.length})
        </button>
        <button
          onClick={() => setActiveTab("routes")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "routes"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Routes ({results.routes.length})
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "posts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Community ({results.posts.length})
        </button>
      </div>

      {/* Loading State */}
      {results.isLoading ? (
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
        <>
          {/* No Results State */}
          {totalResults === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any stories, routes, or community posts
                matching "{queryParam}". Try a different search term or browse
                our trending content.
              </p>
            </div>
          )}

          {/* Results Grid */}
          {(activeTab === "all" || activeTab === "stories") &&
            results.stories.length > 0 && (
              <div className="mb-8">
                {activeTab === "all" && (
                  <h3 className="text-xl font-semibold mb-4">Stories</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </div>
            )}

          {(activeTab === "all" || activeTab === "routes") &&
            results.routes.length > 0 && (
              <div>
                {activeTab === "all" && (
                  <h3 className="text-xl font-semibold mb-4">Routes</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.routes.map((route) => (
                    <RouteCard key={route.id} route={route} />
                  ))}
                </div>
              </div>
            )}

          {(activeTab === "all" || activeTab === "posts") &&
            results.posts.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Community Posts</h3>
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        {post.userPhoto ? (
                          <img
                            src={post.userPhoto}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-lg text-gray-900">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Posted by {post.userName || "Anonymous"} •{" "}
                            {formatTimestamp(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500 text-sm">
                          <div className="flex items-center mr-3">
                            <Heart className="w-4 h-4 mr-1" />
                            <span>{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>{post.comments || 0}</span>
                          </div>
                        </div>

                        <Link
                          href={`/community/${post.id}`}
                          className="text-blue-600 text-sm font-medium hover:text-blue-800"
                        >
                          View Discussion
                        </Link>
                      </div>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
