//@ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  ArrowRight,
  Bookmark,
  User,
  ChevronRight,
  Heart,
  DollarSign,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import RouteDetailsModal from "@/components/modals/RouteDetailsModal";
import { useAuth } from "@/context/AuthContextProvider";

const TrendingRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [sortBy]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const routesRef = collection(db, "routes");
      let q;

      switch (sortBy) {
        case "recent":
          q = query(routesRef, orderBy("createdAt", "desc"), limit(8));
          break;
        case "price":
          q = query(routesRef, orderBy("cost"), limit(8));
          break;
        case "duration":
          q = query(routesRef, orderBy("duration"), limit(8));
          break;
        default: // popular
          q = query(routesRef, orderBy("likes", "desc"), limit(8));
          break;
      }

      const querySnapshot = await getDocs(q);
      const fetchedRoutes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoutes(fetchedRoutes);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const RouteCard = ({ route }) => {
    const { user } = useAuth(); // Get current user
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(route.likes || 0);

    // Check if user has liked/saved this route on component mount
    useEffect(() => {
      if (!user) return;

      const checkUserInteractions = async () => {
        try {
          // Check likes
          const likeRef = doc(db, "likes", `${route.id}_${user.uid}`);
          const likeDoc = await getDoc(likeRef);
          setIsLiked(likeDoc.exists());

          // Check saves
          const saveRef = doc(db, "saves", `${route.id}_${user.uid}`);
          const saveDoc = await getDoc(saveRef);
          setIsSaved(saveDoc.exists());
        } catch (error) {
          console.error("Error checking interactions:", error);
        }
      };

      checkUserInteractions();
    }, [route.id, user]);

    const handleLike = async () => {
      if (!user) {
        // Handle not logged in state - maybe show login prompt
        alert("Please log in to like routes");
        return;
      }

      try {
        const likeRef = doc(db, "likes", `${route.id}_${user.uid}`);
        const routeRef = doc(db, "routes", route.id);

        if (!isLiked) {
          // Add like
          await setDoc(likeRef, {
            userId: user.uid,
            routeId: route.id,
            createdAt: serverTimestamp(),
          });

          // Increment route likes count
          await updateDoc(routeRef, {
            likes: increment(1),
          });

          setLikeCount((prev) => prev + 1);
        } else {
          // Remove like
          await deleteDoc(likeRef);

          // Decrement route likes count
          await updateDoc(routeRef, {
            likes: increment(-1),
          });

          setLikeCount((prev) => prev - 1);
        }

        setIsLiked(!isLiked);
      } catch (error) {
        console.error("Error updating like:", error);
      }
    };

    const handleSave = async () => {
      if (!user) {
        alert("Please log in to save routes");
        return;
      }

      try {
        const saveRef = doc(db, "saves", `${route.id}_${user.uid}`);
        const userRef = doc(db, "users", user.uid);

        if (!isSaved) {
          // Save route
          await setDoc(saveRef, {
            userId: user.uid,
            routeId: route.id,
            route: {
              id: route.id,
              title: route.title,
              mainImage: route.mainImage,
              duration: route.duration,
              difficulty: route.difficulty,
              cost: route.cost,
            },
            createdAt: serverTimestamp(),
          });

          // Update user's saved routes count
          await updateDoc(userRef, {
            savedRoutes: increment(1),
          });
        } else {
          // Remove save
          await deleteDoc(saveRef);

          // Update user's saved routes count
          await updateDoc(userRef, {
            savedRoutes: increment(-1),
          });
        }

        setIsSaved(!isSaved);
      } catch (error) {
        console.error("Error updating save:", error);
      }
    };
    return (
      <>
        <RouteDetailsModal
          isOpen={showRouteModal}
          onClose={() => {
            setShowRouteModal(false);
            setSelectedRoute(null);
          }}
          route={selectedRoute}
        />
        <div className="group relative rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 bg-gray-900">
            <img
              src={route.mainImage}
              alt={route.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Content Overlay */}
          <div className="relative p-6 flex flex-col h-full min-h-[400px]">
            {/* Top Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={route.userImage}
                  alt={route.userName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-white font-medium">{route.userName}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full ${
                    isLiked ? "bg-red-500" : "bg-black/30 hover:bg-black/40"
                  } backdrop-blur-sm transition-colors`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isLiked ? "text-white fill-current" : "text-white"
                    }`}
                  />
                </button>
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-full ${
                    isSaved ? "bg-blue-500" : "bg-black/30 hover:bg-black/40"
                  } backdrop-blur-sm transition-colors`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      isSaved ? "text-white fill-current" : "text-white"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Route Information */}
            <div className="mt-auto">
              <h3 className="text-2xl font-bold text-white mb-2">
                {route.title}
              </h3>

              {/* Route Stats */}
              <div className="flex items-center space-x-4 text-white/80 text-sm mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {route.duration}
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {likeCount} likes
                </div>

                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {route.cost}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs capitalize
                ${
                  route.difficulty === "easy"
                    ? "bg-green-500"
                    : route.difficulty === "medium"
                    ? "bg-yellow-500"
                    : route.difficulty === "hard"
                    ? "bg-orange-500"
                    : "bg-red-500"
                } text-white`}
                >
                  {route.difficulty}
                </span>
              </div>

              {/* Route Stops */}
              {route.stops && route.stops.length > 0 && (
                <div className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2">
                  {route.stops.map((stop, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                          <div className="w-full h-full flex items-center justify-center text-white/80">
                            <MapPin className="w-6 h-6" />
                          </div>
                        </div>
                        <span className="text-white text-xs mt-1 text-center">
                          {stop.location}
                        </span>
                      </div>
                      {index < route.stops.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-white/50 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Tags */}
              {route.tags && route.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {route.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/10 text-white rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedRoute(route);
                  setShowRouteModal(true);
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Route Details</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden bg-gray-200 animate-pulse min-h-[400px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              <div className="relative p-6 flex flex-col h-full">
                <div className="h-10 w-32 bg-gray-300 rounded-full" />
                <div className="mt-auto space-y-4">
                  <div className="h-8 w-3/4 bg-gray-300 rounded-lg" />
                  <div className="h-4 w-1/2 bg-gray-300 rounded-lg" />
                  <div className="h-20 w-full bg-gray-300 rounded-lg" />
                  <div className="h-12 w-full bg-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trending Routes</h2>
          <p className="text-gray-600 mt-1">
            Discover popular travel itineraries
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Recent</option>
            <option value="price">Price: Low to High</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
};

export default TrendingRoutes;
