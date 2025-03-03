//@ts-nocheck
"use client";
import React, { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  Plane,
  Car,
  Train,
  Bus,
  ChevronUp,
  ChevronDown,
  Plus,
  Camera,
  Tag,
  DollarSign,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useAuth } from "@/context/AuthContextProvider";

const CreateRouteModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stops, setStops] = useState([
    { location: "", description: "", images: [] },
  ]);
  const [routeData, setRouteData] = useState({
    title: "",
    description: "",
    difficulty: "medium",
    duration: "",
    distance: "",
    transportModes: [],
    cost: "",
    tips: "",
    season: [],
    tags: "",
    mainImage: "",
  });

  const transportOptions = [
    { id: "walk", icon: MapPin, label: "Walking" },
    { id: "car", icon: Car, label: "Driving" },
    { id: "train", icon: Train, label: "Train" },
    { id: "bus", icon: Bus, label: "Bus" },
    { id: "plane", icon: Plane, label: "Flight" },
  ];

  const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];
  const difficultyOptions = ["easy", "medium", "hard", "expert"];

  const addStop = () => {
    setStops([...stops, { location: "", description: "", images: [] }]);
  };

  const removeStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
  };

  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const route = {
        ...routeData,
        stops,
        createdBy: user.uid,
        userName: user.name,
        userImage: user.photoURL,
        createdAt: serverTimestamp(),
        likes: 0,
        saves: 0,
        tags: routeData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      await addDoc(collection(db, "routes"), route);
      onClose();
    } catch (error) {
      console.error("Error creating route:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block w-full max-w-4xl text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="border-b p-6 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-900">
                Create New Route
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {/* Progress Steps */}
            <div className="flex justify-center mt-6 space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`flex items-center cursor-pointer ${
                    currentStep >= step ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {step}
                  </div>
                  <span className="ml-2 font-medium">
                    {step === 1
                      ? "Basic Info"
                      : step === 2
                      ? "Stops"
                      : "Details"}
                  </span>
                  {step < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Main Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Image URL
                    </label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={routeData.mainImage}
                        onChange={(e) =>
                          setRouteData({
                            ...routeData,
                            mainImage: e.target.value,
                          })
                        }
                        className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter main image URL"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Route Title
                    </label>
                    <input
                      type="text"
                      value={routeData.title}
                      onChange={(e) =>
                        setRouteData({ ...routeData, title: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Give your route a catchy title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={routeData.description}
                      onChange={(e) =>
                        setRouteData({
                          ...routeData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your route..."
                    />
                  </div>

                  {/* Transport Modes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Modes
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {transportOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              const modes = routeData.transportModes.includes(
                                option.id
                              )
                                ? routeData.transportModes.filter(
                                    (mode) => mode !== option.id
                                  )
                                : [...routeData.transportModes, option.id];
                              setRouteData({
                                ...routeData,
                                transportModes: modes,
                              });
                            }}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                              routeData.transportModes.includes(option.id)
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Stops */}
                  {stops.map((stop, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Stop {index + 1}</h4>
                        {stops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <input
                          type="text"
                          value={stop.location}
                          onChange={(e) =>
                            updateStop(index, "location", e.target.value)
                          }
                          className="w-full p-2 border rounded-lg"
                          placeholder="Location name"
                        />
                        <textarea
                          value={stop.description}
                          onChange={(e) =>
                            updateStop(index, "description", e.target.value)
                          }
                          className="w-full p-2 border rounded-lg"
                          rows={3}
                          placeholder="Describe this stop..."
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addStop}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    <Plus className="w-5 h-5 mx-auto" />
                  </button>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={routeData.duration}
                          onChange={(e) =>
                            setRouteData({
                              ...routeData,
                              duration: e.target.value,
                            })
                          }
                          className="pl-10 w-full p-2 border rounded-lg"
                          placeholder="e.g., 3 days"
                        />
                      </div>
                    </div>

                    {/* Distance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance
                      </label>
                      <input
                        type="text"
                        value={routeData.distance}
                        onChange={(e) =>
                          setRouteData({
                            ...routeData,
                            distance: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., 250 km"
                      />
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <div className="flex space-x-4">
                      {difficultyOptions.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setRouteData({ ...routeData, difficulty: level })
                          }
                          className={`px-4 py-2 rounded-lg capitalize ${
                            routeData.difficulty === level
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={routeData.cost}
                        onChange={(e) =>
                          setRouteData({ ...routeData, cost: e.target.value })
                        }
                        className="pl-10 w-full p-2 border rounded-lg"
                        placeholder="Estimated cost"
                      />
                    </div>
                  </div>

                  {/* Season */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Best Seasons
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {seasonOptions.map((season) => (
                        <button
                          key={season}
                          type="button"
                          onClick={() => {
                            const seasons = routeData.season.includes(season)
                              ? routeData.season.filter((s) => s !== season)
                              : [...routeData.season, season];
                            setRouteData({ ...routeData, season: seasons });
                          }}
                          className={`px-4 py-2 rounded-lg ${
                            routeData.season.includes(season)
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {season}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={routeData.tags}
                        onChange={(e) =>
                          setRouteData({ ...routeData, tags: e.target.value })
                        }
                        className="pl-10 w-full p-2 border rounded-lg"
                        placeholder="Add tags separated by commas"
                      />
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Tips
                    </label>
                    <div className="relative">
                      <Info className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <textarea
                        value={routeData.tips}
                        onChange={(e) =>
                          setRouteData({ ...routeData, tips: e.target.value })
                        }
                        className="pl-10 w-full p-2 border rounded-lg"
                        rows={4}
                        placeholder="Share helpful tips for this route..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
              )}
              <div className="ml-auto">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Creating..." : "Create Route"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRouteModal;
