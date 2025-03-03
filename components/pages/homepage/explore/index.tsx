//@ts-nocheck
"use client";
import React, { useState } from "react";
import {
  Map,
  Search,
  Globe,
  Sunset,
  Coffee,
  UtensilsCrossed,
  Tent,
  Camera,
  Mountain,
  Waves,
  Building,
  Filter,
  MapPin,
  Star,
  Heart,
} from "lucide-react";

const ExplorePage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLiked, setIsLiked] = useState({});

  const categories = [
    { id: "all", label: "All Destinations", icon: Globe },
    { id: "beaches", label: "Beaches", icon: Sunset },
    { id: "cafes", label: "Cafes", icon: Coffee },
    { id: "food", label: "Restaurants", icon: UtensilsCrossed },
    { id: "camping", label: "Camping", icon: Tent },
    { id: "photo", label: "Photo Spots", icon: Camera },
    { id: "hiking", label: "Hiking", icon: Mountain },
    { id: "surfing", label: "Surfing", icon: Waves },
    { id: "cities", label: "Cities", icon: Building },
  ];

  const destinations = [
    {
      id: 1,
      name: "Santorini Sunset Point",
      location: "Oia, Greece",
      rating: 4.8,
      reviews: 1234,
      image: "/api/placeholder/800/600",
      category: "photo",
      description: "Perfect spot to capture the famous Santorini sunset",
      tags: ["sunset", "photography", "views"],
    },
    {
      id: 2,
      name: "Hidden Beach Cove",
      location: "Bali, Indonesia",
      rating: 4.9,
      reviews: 856,
      image: "/api/placeholder/800/600",
      category: "beaches",
      description: "Secluded beach paradise away from the crowds",
      tags: ["beach", "swimming", "snorkeling"],
    },
    {
      id: 3,
      name: "Mountain Trail Summit",
      location: "Swiss Alps",
      rating: 4.7,
      reviews: 2156,
      image: "/api/placeholder/800/600",
      category: "hiking",
      description: "Challenging trail with breathtaking alpine views",
      tags: ["hiking", "nature", "views"],
    },
    {
      id: 4,
      name: "Urban Photography Walk",
      location: "Tokyo, Japan",
      rating: 4.6,
      reviews: 1543,
      image: "/api/placeholder/800/600",
      category: "photo",
      description: "Discover the best photo spots in the city",
      tags: ["urban", "photography", "walking"],
    },
    {
      id: 5,
      name: "Secret Camping Spot",
      location: "Yosemite, USA",
      rating: 4.9,
      reviews: 678,
      image: "/api/placeholder/800/600",
      category: "camping",
      description: "Remote camping location with stunning valley views",
      tags: ["camping", "nature", "stargazing"],
    },
    {
      id: 6,
      name: "Historic Café",
      location: "Vienna, Austria",
      rating: 4.8,
      reviews: 3421,
      image: "/api/placeholder/800/600",
      category: "cafes",
      description: "Traditional Viennese café with rich history",
      tags: ["coffee", "culture", "architecture"],
    },
  ];

  const toggleLike = (id) => {
    setIsLiked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search destinations, experiences, or activities..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <button className="absolute right-4 top-2.5 px-3 py-1 flex items-center space-x-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap
                      ${
                        activeCategory === category.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-video">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleLike(destination.id)}
                  className={`absolute top-4 right-4 p-2 rounded-full 
                    ${
                      isLiked[destination.id]
                        ? "bg-red-500"
                        : "bg-black/30 hover:bg-black/40"
                    } backdrop-blur-sm transition-colors`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isLiked[destination.id]
                        ? "text-white fill-current"
                        : "text-white"
                    }`}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {destination.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {destination.location}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium text-gray-900">
                      {destination.rating}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({destination.reviews})
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-3">
                  {destination.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {destination.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
            Load More Places
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
