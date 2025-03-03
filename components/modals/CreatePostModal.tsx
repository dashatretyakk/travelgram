//@ts-nocheck
"use client";
import { useState } from "react";
import { X, Image as ImageIcon, MapPin, Tag, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContextProvider";
import { db } from "@/utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [postData, setPostData] = useState({
    title: "",
    content: "",
    location: "",
    tags: "",
    imageUrl: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a post");
      return;
    }

    if (!postData.title || !postData.content) {
      setError("Title and content are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Process tags into an array
      const processedTags = postData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag !== "");

      // Create post data object
      const post = {
        ...postData,
        tags: processedTags,
        userId: user.uid,
        userName: user.name,
        userImage: user.photoURL,
        userLocation: user.location,
        userBadge: user.badge || null,
        createdAt: serverTimestamp(),
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "posts"), post);

      // Update user's post count if needed
      // You might want to add this feature later

      // Reset form and close modal
      setPostData({
        title: "",
        content: "",
        location: "",
        tags: "",
        imageUrl: "",
      });
      onClose();
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title*
              </label>
              <input
                type="text"
                value={postData.title}
                onChange={(e) =>
                  setPostData({ ...postData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's on your mind?"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content*
              </label>
              <textarea
                value={postData.content}
                onChange={(e) =>
                  setPostData({ ...postData, content: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your thoughts..."
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={postData.imageUrl}
                  onChange={(e) =>
                    setPostData({ ...postData, imageUrl: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add an image URL"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={postData.location}
                  onChange={(e) =>
                    setPostData({ ...postData, location: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add location"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (optional)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={postData.tags}
                  onChange={(e) =>
                    setPostData({ ...postData, tags: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tags separated by commas (e.g., travel, tips, advice)"
                />
              </div>
            </div>

            {/* Preview section */}
            {postData.imageUrl && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={postData.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/300";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPostData({ ...postData, imageUrl: "" })}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
                disabled={loading || !user}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                  disabled:bg-blue-300 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePostModal;
