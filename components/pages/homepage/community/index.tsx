//@ts-nocheck
"use client";
import { useState, useEffect } from "react";
import {
  MessageCircle,
  Heart,
  Share2,
  MapPin,
  MoreHorizontal,
  Image as ImageIcon,
  Send,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  increment,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useAuth } from "@/context/AuthContextProvider";
import CreatePostModal from "@/components/modals/CreatePostModal";
import Link from "next/link";

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedPosts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timeAgo: formatTimestamp(doc.data().createdAt),
      }));

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
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

  const DiscussionCard = ({ post }) => {
    const [isLiked, setIsLiked] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
      if (user) {
        checkIfLiked();
      }
    }, [user, post.id]);

    const checkIfLiked = async () => {
      if (!user) return;

      try {
        const likesQuery = query(
          collection(db, "posts", post.id, "likes"),
          where("userId", "==", user.uid)
        );

        const likesSnapshot = await getDocs(likesQuery);
        setIsLiked(!likesSnapshot.empty);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    const handleLikeClick = async (e) => {
      e.preventDefault(); // Prevent navigation
      if (!user) return;

      try {
        const likesRef = collection(db, "posts", post.id, "likes");
        const postRef = doc(db, "posts", post.id);

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
        } else {
          // Remove like
          const likeDoc = likeSnapshot.docs[0];
          await deleteDoc(doc(likesRef, likeDoc.id));

          // Decrement post likes count
          await updateDoc(postRef, {
            "engagement.likes": increment(-1),
          });

          setIsLiked(false);
        }
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Header with user info */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={post.userImage || "/api/placeholder/150/150"}
                alt={post.userName}
                className="w-10 h-10 rounded-full border-2 border-gray-100"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{post.userName}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{post.timeAgo}</span>
                  {post.location && (
                    <>
                      <span className="mx-2">•</span>
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{post.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {post.userBadge && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {post.userBadge}
              </span>
            )}
          </div>

          {/* Main content */}
          <Link href={`/community/${post.id}`} className="block">
            <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600 line-clamp-3 mb-4">{post.content}</p>
          </Link>

          {/* Image */}
          {post.imageUrl && (
            <div className="relative -mx-6 mb-4">
              <img
                src={post.imageUrl}
                alt="Post content"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full hover:bg-gray-100 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-2 ${
                  user ? "hover:text-red-500" : "opacity-50 cursor-not-allowed"
                } ${
                  isLiked ? "text-red-500" : "text-gray-600"
                } transition-colors`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">
                  {post.engagement?.likes || 0}
                </span>
              </button>
              <Link
                href={`/community/${post.id}`}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post.engagement?.comments || 0}
                </span>
              </Link>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post.engagement?.shares || 0}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Travel Community
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Post
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {loading
              ? // Loading skeletons
                [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm p-4 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-48 bg-gray-200 rounded" />
                  </div>
                ))
              : posts.map((post) => (
                  <DiscussionCard key={post.id} post={post} />
                ))}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchPosts(); // Refresh posts after creation
        }}
      />
    </div>
  );
};

export default CommunityPage;
