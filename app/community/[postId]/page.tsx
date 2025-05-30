//@ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout";
import { db } from "@/utils/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContextProvider";
import { MessageCircle, Heart, Share2, MapPin, Send } from "lucide-react";
import { createNotification } from "@/utils/notifications";

const PostContentPage = () => {
  const params = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", params.postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching post:", error);
        setLoading(false);
      }
    };

    // Subscribe to comments
    const commentsQuery = query(
      collection(db, "posts", params.postId, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    fetchPost();

    // Check if user has liked the post
    if (user) {
      checkIfLiked();
    }

    return () => unsubscribe();
  }, [params.postId, user]);

  // Check if the current user has liked the post
  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const likesQuery = query(
        collection(db, "posts", params.postId, "likes"),
        where("userId", "==", user.uid)
      );

      const likesSnapshot = await getDocs(likesQuery);
      setIsLiked(!likesSnapshot.empty);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  // Handle liking/unliking a post
  const handleLikeToggle = async () => {
    if (!user) return;

    try {
      const likesRef = collection(db, "posts", params.postId, "likes");
      const postRef = doc(db, "posts", params.postId);

      // Query to find if the user has already liked
      const likeQuery = query(likesRef, where("userId", "==", user.uid));
      const likeSnapshot = await getDocs(likeQuery);

      if (likeSnapshot.empty) {
        // Add like
        await addDoc(likesRef, {
          userId: user.uid,
          createdAt: new Date(),
        });

        // Increment post likes count
        await updateDoc(postRef, {
          "engagement.likes": increment(1),
        });

        setIsLiked(true);
        // Update local post state
        setPost((prev) => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            likes: (prev.engagement?.likes || 0) + 1,
          },
        }));

        // Create notification for post owner
        createNotification({
          type: "like",
          contentType: "post",
          contentId: params.postId,
          senderId: user.uid,
        });
      } else {
        // Remove like
        const likeDoc = likeSnapshot.docs[0];
        await deleteDoc(doc(likesRef, likeDoc.id));

        // Decrement post likes count
        await updateDoc(postRef, {
          "engagement.likes": increment(-1),
        });

        setIsLiked(false);
        // Update local post state
        setPost((prev) => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            likes: Math.max((prev.engagement?.likes || 0) - 1, 0),
          },
        }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Handle share button click
  const handleShare = async () => {
    try {
      // Get the current URL
      const url = window.location.href;

      // Copy to clipboard
      await navigator.clipboard.writeText(url);

      // Show tooltip
      setShowShareTooltip(true);

      // Increment share count in Firestore
      const postRef = doc(db, "posts", params.postId);
      await updateDoc(postRef, {
        "engagement.shares": increment(1),
      });

      // Update local post state
      setPost((prev) => ({
        ...prev,
        engagement: {
          ...prev.engagement,
          shares: (prev.engagement?.shares || 0) + 1,
        },
      }));

      // Hide tooltip after 3 seconds
      setTimeout(() => {
        setShowShareTooltip(false);
      }, 3000);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // Handle comment submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      // Create comment object
      const comment = {
        userId: user.uid,
        userName: user.name,
        userPhoto: user.photoURL,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      };

      // Add to Firestore
      await addDoc(collection(db, "posts", params.postId, "comments"), comment);

      // Update comment count in post
      await updateDoc(doc(db, "posts", params.postId), {
        "engagement.comments": increment(1),
      });

      setNewComment("");

      // Create notification for post owner
      createNotification({
        type: "comment",
        contentType: "post",
        contentId: params.postId,
        senderId: user.uid,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "";

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

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold">Post not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Post Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={post.userImage}
                  alt={post.userName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-lg">{post.userName}</h2>
                  {post.location && (
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {post.location}
                    </div>
                  )}
                </div>
              </div>
              {post.userBadge && (
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                  {post.userBadge}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-6">{post.content}</p>

            {post.imageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt="Post content"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement */}
            <div className="flex items-center space-x-6 border-t pt-4">
              <button
                onClick={handleLikeToggle}
                disabled={!user}
                className={`flex items-center space-x-2 ${
                  user ? "hover:text-red-500" : "opacity-50 cursor-not-allowed"
                } ${isLiked ? "text-red-500" : "text-gray-600"}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{post.engagement?.likes || 0}</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </div>
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-500"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{post.engagement?.shares || 0}</span>
                </button>
                {showShareTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                    Link copied to clipboard!
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comments</h3>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex items-center space-x-3">
                  <img
                    src={user?.photoURL || "/api/placeholder/150/150"}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        user ? "Write a comment..." : "Please login to comment"
                      }
                      className="w-full pr-10 py-2 pl-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!user}
                    />
                    {user && (
                      <button
                        type="submit"
                        className="absolute right-3 top-2 text-blue-500 hover:text-blue-600"
                        disabled={!newComment.trim()}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img
                      src={comment.userImage || "/api/placeholder/150/150"}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-semibold text-sm">
                          {comment.userName}
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostContentPage;
