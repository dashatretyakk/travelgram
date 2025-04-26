//@ts-nocheck
"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContextProvider";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  increment,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import { createNotification } from "@/utils/notifications";

const StoryViewerModal = ({ isOpen, onClose, story, onLikeUpdate }) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Check if user has liked this story when story is loaded
  useEffect(() => {
    if (!story?.id || !user) return;

    const checkLikeStatus = async () => {
      try {
        const likeRef = doc(db, "likes", `story_${story.id}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        setIsLiked(likeDoc.exists());
        setLikeCount(story.likes || 0);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [story?.id, user]);

  // Fetch comments when story is opened
  useEffect(() => {
    if (!story?.id || !showComments) return;

    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("storyId", "==", story.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [story?.id, showComments]);

  const handleLike = async () => {
    if (!user) {
      // You might want to show a login prompt here
      alert("Please log in to like stories");
      return;
    }

    try {
      const likeRef = doc(db, "likes", `story_${story.id}_${user.uid}`);
      const storyRef = doc(db, "stories", story.id);

      if (!isLiked) {
        // Add like
        await setDoc(likeRef, {
          userId: user.uid,
          storyId: story.id,
          createdAt: new Date(),
        });

        // Increment story likes count
        await updateDoc(storyRef, {
          likes: increment(1),
        });

        const newLikeCount = likeCount + 1;
        setLikeCount(newLikeCount);

        // Notify parent component about the like update
        if (onLikeUpdate) {
          onLikeUpdate(story.id, newLikeCount);
        }

        // Create notification for the story owner
        createNotification({
          type: "like",
          contentType: "story",
          contentId: story.id,
          senderId: user.uid,
        });
      } else {
        // Remove like
        await deleteDoc(likeRef);

        // Decrement story likes count
        await updateDoc(storyRef, {
          likes: increment(-1),
        });

        const newLikeCount = Math.max(likeCount - 1, 0);
        setLikeCount(newLikeCount);

        // Notify parent component about the like update
        if (onLikeUpdate) {
          onLikeUpdate(story.id, newLikeCount);
        }
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || loading) return;

    try {
      setLoading(true);

      // Create the comment
      const commentData = {
        storyId: story.id,
        userId: user.uid,
        userName: user.name,
        userImage: user.photoURL,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      };

      // Add comment to Firestore
      await addDoc(collection(db, "comments"), commentData);

      // Update comment count in the story document
      const storyRef = doc(db, "stories", story.id);
      await updateDoc(storyRef, {
        comments: (story.comments || 0) + 1,
      });

      // Create notification for the story owner
      createNotification({
        type: "comment",
        contentType: "story",
        contentId: story.id,
        senderId: user.uid,
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < story.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-90">
      <div className="min-h-screen px-4 py-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 p-2 text-white rounded-full hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Main content */}
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Image section */}
            <div className="relative aspect-video bg-black">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={story.images[currentImageIndex]}
                alt={story.title}
                className="w-full h-full object-contain"
              />

              {/* Progress bar */}
              <div className="absolute top-4 left-4 right-4 flex gap-1">
                {story.images.map((_, index) => (
                  <div
                    key={index}
                    className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        index === currentImageIndex
                          ? "w-full"
                          : index < currentImageIndex
                          ? "w-full"
                          : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation arrows */}
              {currentImageIndex > 0 && (
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white rounded-full hover:bg-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentImageIndex < story.images.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white rounded-full hover:bg-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Content section */}
            <div className="p-6">
              {/* User info */}
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={story.userImage}
                  alt={story.userName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-medium">{story.userName}</h4>
                  {story.location && (
                    <p className="text-sm text-gray-500">{story.location}</p>
                  )}
                </div>
              </div>

              {/* Story details */}
              <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
              <p className="text-gray-600 mb-4">{story.description}</p>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {story.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Interaction buttons */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full ${
                    isLiked ? "text-red-500" : "text-gray-600"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`}
                  />
                </button>
                <span className="text-sm text-gray-600">{likeCount}</span>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="p-2 rounded-full text-gray-600"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="p-2 rounded-full text-gray-600">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              {/* Comments section */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Comments</h4>

                      {/* Comments list */}
                      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start space-x-3"
                          >
                            <img
                              src={comment.userImage}
                              alt={comment.userName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                <p className="font-medium text-sm">
                                  {comment.userName}
                                </p>
                                <p className="text-gray-700">{comment.text}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-2">
                                {formatTimestamp(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add comment */}
                      {user ? (
                        <form
                          onSubmit={handleAddComment}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                          />
                          <button
                            type="submit"
                            disabled={!newComment.trim() || loading}
                            className="p-2 text-blue-500 disabled:text-gray-400"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </form>
                      ) : (
                        <p className="text-gray-500 text-center">
                          Please log in to comment
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewerModal;
