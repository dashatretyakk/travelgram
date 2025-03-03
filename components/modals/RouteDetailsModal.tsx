//@ts-nocheck
"use client";
import { useAuth } from "@/context/AuthContextProvider";
import { db } from "@/utils/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Share2,
  ArrowRight,
  Car,
  Train,
  Bus,
  Plane,
  User,
  Calendar,
  Info,
  MessageCircle,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";

const RouteDetailsModal = ({ isOpen, onClose, route }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(route?.likes || 0);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch comments and handle likes status
  useEffect(() => {
    if (!route?.id) return;

    // Subscribe to comments
    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("routeId", "==", route.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });

    // Check if user has liked this route
    if (user) {
      const checkLikeStatus = async () => {
        const likeRef = doc(db, "likes", `${route.id}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        setIsLiked(likeDoc.exists());
      };
      checkLikeStatus();
    }

    return () => unsubscribe();
  }, [route?.id, user]);

  const handleLike = async () => {
    if (!user) {
      alert("Please log in to like routes");
      return;
    }

    try {
      const likeRef = doc(db, "likes", `${route.id}_${user.uid}`);
      const routeRef = doc(db, "routes", route.id);

      if (!isLiked) {
        await setDoc(likeRef, {
          userId: user.uid,
          routeId: route.id,
          createdAt: serverTimestamp(),
        });
        await updateDoc(routeRef, { likes: increment(1) });
        setLikeCount((prev) => prev + 1);
      } else {
        await deleteDoc(likeRef);
        await updateDoc(routeRef, { likes: increment(-1) });
        setLikeCount((prev) => prev - 1);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to comment");
      return;
    }
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const commentData = {
        routeId: route.id,
        userId: user.uid,
        userName: user.name,
        userImage: user.photoURL,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "comments"), commentData);

      // Update route's comment count
      const routeRef = doc(db, "routes", route.id);
      await updateDoc(routeRef, {
        comments: increment(1),
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen || !route) return null;

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

  if (!isOpen || !route) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden"
        >
          {/* Header Image Section */}
          <div className="relative h-64 lg:h-96">
            <img
              src={route.mainImage}
              alt={route.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{route.title}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  {route.duration}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  {route.cost}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm capitalize
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
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* Tabs */}
              <div className="flex space-x-6 border-b mb-6">
                {[
                  { id: "overview", label: "Overview", icon: Info },
                  { id: "route", label: "Route Details", icon: MapPin },
                  {
                    id: "discussion",
                    label: "Discussion",
                    icon: MessageCircle,
                    count: comments.length,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 pb-4 px-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-b-2 border-blue-500 text-blue-500"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-sm">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Description */}
                    <div className="prose max-w-none mb-6">
                      <p className="text-gray-600">{route.description}</p>
                    </div>

                    {/* Transport Modes */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">
                        Transportation
                      </h3>
                      <div className="flex gap-3">
                        {route.transportModes?.map((mode) => {
                          const Icon = getTransportIcon(mode);
                          return (
                            <div
                              key={mode}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg"
                            >
                              <Icon className="w-5 h-5 text-gray-600" />
                              <span className="text-gray-700 capitalize">
                                {mode}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Best Seasons */}
                    {route.season && route.season.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">
                          Best Seasons
                        </h3>
                        <div className="flex gap-3">
                          {route.season.map((season) => (
                            <div
                              key={season}
                              className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg"
                            >
                              <Calendar className="w-5 h-5" />
                              <span>{season}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Travel Tips */}
                    {route.tips && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">
                          Travel Tips
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-blue-700">{route.tips}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "route" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {route.stops?.map((stop, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {stop.location}
                          </h4>
                          <p className="text-gray-600 mt-1">
                            {stop.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "discussion" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="mb-6 ">
                      <div className="flex items-start space-x-3">
                        <img
                          src={user?.photoURL || "/api/placeholder/32/32"}
                          alt="Your avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={
                              user
                                ? "Write a comment..."
                                : "Please log in to comment"
                            }
                            disabled={!user || loading}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            rows={3}
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={!user || loading || !newComment.trim()}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                            >
                              <Send className="w-4 h-4" />
                              <span>Comment</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4 h-[200px] overflow-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <img
                            src={comment.userImage}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-gray-700">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 p-6 bg-gray-50 lg:border-l">
              {/* Creator Info */}
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src={route.userImage}
                  alt={route.userName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium">{route.userName}</h4>
                  <p className="text-gray-500 text-sm">Route Creator</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="font-semibold text-xl">{likeCount}</div>
                  <div className="text-gray-500 text-sm">Likes</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="font-semibold text-xl">{comments.length}</div>
                  <div className="text-gray-500 text-sm">Comments</div>
                </div>
              </div>

              {/* Tags */}
              {route.tags && route.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {route.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white rounded-full text-sm text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleLike}
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 
                    ${
                      isLiked
                        ? "bg-red-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  disabled={!user}
                >
                  <Heart className={isLiked ? "fill-current" : ""} />
                  <span>{isLiked ? "Liked" : "Like Route"}</span>
                </button>
                <button
                  onClick={() => setActiveTab("discussion")}
                  className="w-full py-3 px-4 bg-white text-gray-700 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </button>
                <button className="w-full py-3 px-4 bg-white text-gray-700 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100">
                  <Share2 className="w-5 h-5" />
                  <span>Share Route</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RouteDetailsModal;
