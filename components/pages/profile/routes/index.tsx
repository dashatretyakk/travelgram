//@ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Share2,
  Car,
  Train,
  Bus,
  Plane,
  ArrowRight,
} from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/utils/firebase";

const Routes = ({ userId }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, [userId]);

  const fetchRoutes = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const routesRef = collection(db, "routes");
      const q = query(
        routesRef,
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );

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

  const getTransportIcon = (mode) => {
    switch (mode) {
      case "car":
        return Car;
      case "train":
        return Train;
      case "bus":
        return Bus;
      case "plane":
        return Plane;
      default:
        return MapPin;
    }
  };

  const RouteCard = ({ route }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={route.mainImage}
            alt={route.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? "scale-105" : ""
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg mb-1">
              {route.title}
            </h3>
            {route.stops && route.stops.length > 0 && (
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{route.stops[0].location}</span>
                <ArrowRight className="w-4 h-4 mx-1" />
                <span>{route.stops[route.stops.length - 1].location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Quick Info */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>{route.duration}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>{route.cost}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize
              ${
                route.difficulty === "easy"
                  ? "bg-green-100 text-green-600"
                  : route.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-600"
                  : route.difficulty === "hard"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {route.difficulty}
            </div>
          </div>

          {/* Transport Modes */}
          <div className="flex gap-2 mb-4">
            {route.transportModes?.map((mode) => {
              const Icon = getTransportIcon(mode);
              return (
                <div key={mode} className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
              );
            })}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {route.description}
          </p>

          {/* Tags */}
          {route.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {route.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Season */}
          {route.season && route.season.length > 0 && (
            <div className="flex gap-2 mb-4">
              {route.season.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{route.likes || 0}</span>
              </button>
              <button className="text-gray-600 hover:text-blue-500 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {route.stops?.length || 0} stops
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg" />
            <div className="bg-white p-4 rounded-b-lg space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!routes.length) {
    return (
      <div className="text-center text-gray-500 py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No routes yet
        </h3>
        <p>Start creating your travel routes!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {routes.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
};

export default Routes;
