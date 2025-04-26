//@ts-nocheck

"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { MapPin, Heart, MessageCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [cachedData, setCachedData] = useState({
    stories: [],
    routes: [],
    loaded: false,
  });

  // Try to load any cached data when viewing offline page
  useEffect(() => {
    async function loadCachedData() {
      try {
        // Try to get stories from cache
        let stories = [];
        try {
          const storiesQuery = query(
            collection(db, "stories"),
            orderBy("createdAt", "desc"),
            limit(5)
          );
          const storiesSnapshot = await getDocs(storiesQuery);
          stories = storiesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } catch (e) {
          console.log("No cached stories available from Firebase", e);
        }

        // Try to get routes from cache
        let routes = [];
        try {
          const routesQuery = query(
            collection(db, "routes"),
            orderBy("createdAt", "desc"),
            limit(5)
          );
          const routesSnapshot = await getDocs(routesQuery);
          routes = routesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } catch (e) {
          console.log("No cached routes available from Firebase", e);
        }

        // If we couldn't get data from Firebase, try to load fallback content
        if (stories.length === 0 && routes.length === 0) {
          try {
            const response = await fetch("/fallback-content.json");
            if (response.ok) {
              const fallbackData = await response.json();
              stories = fallbackData.stories || [];
              routes = fallbackData.routes || [];
              console.log(
                "Loaded fallback content:",
                stories.length,
                "stories,",
                routes.length,
                "routes"
              );
            }
          } catch (err) {
            console.error("Could not load fallback content:", err);
          }
        }

        setCachedData({
          stories,
          routes,
          loaded: true,
        });
      } catch (error) {
        console.error("Error loading cached data:", error);

        // Final fallback - try to load the static JSON
        try {
          const response = await fetch("/fallback-content.json");
          if (response.ok) {
            const fallbackData = await response.json();
            setCachedData({
              stories: fallbackData.stories || [],
              routes: fallbackData.routes || [],
              loaded: true,
            });
          } else {
            setCachedData((prev) => ({ ...prev, loaded: true }));
          }
        } catch (err) {
          console.error("Could not load fallback content:", err);
          setCachedData((prev) => ({ ...prev, loaded: true }));
        }
      }
    }

    loadCachedData();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
              You're Offline
            </h2>
            <p className="text-gray-600 mb-6">
              You're currently browsing in offline mode. Some features and
              content may be limited.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try to Reconnect
            </button>
          </div>

          {cachedData.loaded && (
            <>
              {/* Display cached stories if available */}
              {cachedData.stories.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Available Offline Stories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cachedData.stories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-white rounded-lg shadow overflow-hidden"
                      >
                        {story.images && story.images[0] && (
                          <div className="h-40 overflow-hidden">
                            <img
                              src={story.images[0]}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-medium text-lg">{story.title}</h4>
                          {story.location && (
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{story.location}</span>
                            </div>
                          )}
                          <div className="flex items-center mt-3 text-gray-500 text-sm">
                            <div className="flex items-center mr-4">
                              <Heart className="w-4 h-4 mr-1" />
                              <span>{story.likes || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              <span>{story.comments || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display cached routes if available */}
              {cachedData.routes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Available Offline Routes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cachedData.routes.map((route) => (
                      <div
                        key={route.id}
                        className="bg-white rounded-lg shadow overflow-hidden"
                      >
                        {route.mainImage ? (
                          <div className="h-40 overflow-hidden">
                            <img
                              src={route.mainImage}
                              alt={route.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-40 bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-blue-300" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-medium text-lg">{route.title}</h4>
                          {route.difficulty && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2 capitalize">
                              {route.difficulty}
                            </span>
                          )}
                          <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                            {route.duration && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{route.duration}</span>
                              </div>
                            )}
                            {route.likes !== undefined && (
                              <div className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                <span>{route.likes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cachedData.stories.length === 0 &&
                cachedData.routes.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <p>
                      No offline content available. Please connect to the
                      internet to browse content.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
