//@ts-nocheck
"use client";
import React, { useState } from "react";
import {
  X,
  Link as LinkIcon,
  MapPin,
  Tag,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import { motion, AnimatePresence } from "framer-motion";

const CreateStoryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  const [storyData, setStoryData] = useState({
    title: "",
    description: "",
    location: "",
    tags: "",
    images: [],
  });

  const handleImageError = (index) => {
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  const handleImageLoad = (index) => {
    setImageErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const addImage = (url) => {
    if (!url.trim()) return;

    // Basic URL validation
    try {
      new URL(url);
      setStoryData((prev) => ({
        ...prev,
        images: [...prev.images, url],
      }));
      setNewImageUrl("");
    } catch (e) {
      setError("Please enter a valid image URL");
      return;
    }
  };

  const removeImage = (index) => {
    setStoryData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    // Update currentPreviewIndex if necessary
    if (currentPreviewIndex >= index && currentPreviewIndex > 0) {
      setCurrentPreviewIndex((prev) => prev - 1);
    }

    // Clean up error state
    setImageErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !storyData.title ||
      !storyData.description ||
      storyData.images.length === 0
    ) {
      setError("Title, description and at least one image are required");
      return;
    }

    // Check for any image errors
    if (Object.keys(imageErrors).length > 0) {
      setError("Please remove or fix invalid images before submitting");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const story = {
        ...storyData,
        userId: user.uid,
        userImage: user.photoURL,
        userName: user.name,
        username: user.username,
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        tags: storyData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
      };

      // Add story to stories collection
      const storyRef = await addDoc(collection(db, "stories"), story);

      // Update user's stories count
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        stories: increment(1),
      });

      // Reset form and close modal
      onClose();
      setStoryData({
        title: "",
        description: "",
        location: "",
        tags: "",
        images: [],
      });
      setCurrentPreviewIndex(0);
      setImageErrors({});
    } catch (err) {
      console.error("Error creating story:", err);
      setError("Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && newImageUrl) {
      e.preventDefault();
      addImage(newImageUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold text-gray-900">
              Create Story
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Story Preview Section */}
            <div className="lg:w-1/3 border-r p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Story Preview</h3>
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
                {storyData.images.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentPreviewIndex}
                        src={storyData.images[currentPreviewIndex]}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onError={() => handleImageError(currentPreviewIndex)}
                        onLoad={() => handleImageLoad(currentPreviewIndex)}
                      />
                    </AnimatePresence>

                    {/* Progress bars */}
                    <div className="absolute top-4 left-4 right-4 flex gap-1">
                      {storyData.images.map((_, index) => (
                        <div
                          key={index}
                          className="h-0.5 bg-white/30 flex-1 overflow-hidden"
                        >
                          <div
                            className={`h-full bg-white transition-all duration-300 ${
                              index === currentPreviewIndex
                                ? "w-full"
                                : index < currentPreviewIndex
                                ? "w-full"
                                : "w-0"
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Navigation buttons */}
                    {currentPreviewIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPreviewIndex((prev) => prev - 1);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white hover:bg-black/60"
                      >
                        <motion.div
                          whileHover={{ x: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ←
                        </motion.div>
                      </button>
                    )}
                    {currentPreviewIndex < storyData.images.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPreviewIndex((prev) => prev + 1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white hover:bg-black/60"
                      >
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          →
                        </motion.div>
                      </button>
                    )}

                    {/* Story info overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white p-4 bg-gradient-to-t from-black/50 to-transparent">
                      <h3 className="font-semibold text-lg">
                        {storyData.title || "Your Story Title"}
                      </h3>
                      {storyData.location && (
                        <p className="text-sm">📍 {storyData.location}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>Add images to preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                {storyData.images.map((url, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative flex-shrink-0 cursor-pointer ${
                      currentPreviewIndex === index
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() => setCurrentPreviewIndex(index)}
                  >
                    <img
                      src={url}
                      alt=""
                      className={`w-16 h-16 object-cover rounded-lg ${
                        imageErrors[index] ? "opacity-50" : ""
                      }`}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {imageErrors[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <span className="text-xs text-white">Error</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-red-500 bg-red-50 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Image URL Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Add Images*
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addImage(newImageUrl)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                      disabled={!newImageUrl.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Title*
                  </label>
                  <input
                    type="text"
                    value={storyData.title}
                    onChange={(e) =>
                      setStoryData({ ...storyData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your story title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description*
                  </label>
                  <textarea
                    value={storyData.description}
                    onChange={(e) =>
                      setStoryData({
                        ...storyData,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell your story..."
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={storyData.location}
                      onChange={(e) =>
                        setStoryData({ ...storyData, location: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add location"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={storyData.tags}
                      onChange={(e) =>
                        setStoryData({ ...storyData, tags: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add tags separated by commas"
                    />
                  </div>
                </div>

                {/* Preview of tags */}
                {storyData.tags && (
                  <div className="flex flex-wrap gap-2">
                    {storyData.tags.split(",").map(
                      (tag, index) =>
                        tag.trim() && (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                          >
                            #{tag.trim()}
                          </span>
                        )
                    )}
                  </div>
                )}

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                    disabled={
                      loading ||
                      storyData.images.length === 0 ||
                      Object.keys(imageErrors).length > 0
                    }
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Story"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
