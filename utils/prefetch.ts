import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Prefetches critical data for offline use
 * This function should be called when the user is online to proactively
 * cache important data for offline access
 */
export async function prefetchCriticalData(userId: string) {
  try {
    console.log("Prefetching critical data for offline use...");

    // Prefetch user data
    if (userId) {
      await prefetchUserData(userId);
    }

    // Prefetch recent stories
    await prefetchRecentStories();

    // Prefetch trending routes
    await prefetchTrendingRoutes();

    // Prefetch recent community posts
    await prefetchCommunityPosts();

    console.log("Critical data prefetched successfully");
    return true;
  } catch (error) {
    console.error("Error prefetching data:", error);
    return false;
  }
}

/**
 * Prefetches user data including profile and personal content
 */
async function prefetchUserData(userId: string) {
  // Prefetch user's profile data
  try {
    // Prefetch user's profile
    const userQuery = query(
      collection(db, "users"),
      where("uid", "==", userId)
    );
    await getDocs(userQuery);

    // Prefetch user's stories
    const storiesQuery = query(
      collection(db, "stories"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    await getDocs(storiesQuery);

    // Prefetch user's saved items
    const savedQuery = query(
      collection(db, "saved"),
      where("userId", "==", userId)
    );
    await getDocs(savedQuery);

    // Prefetch user's notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    await getDocs(notificationsQuery);

    console.log("User data prefetched");
  } catch (error) {
    console.error("Error prefetching user data:", error);
  }
}

/**
 * Prefetches recent stories for offline browsing
 */
async function prefetchRecentStories() {
  try {
    const storiesQuery = query(
      collection(db, "stories"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    await getDocs(storiesQuery);
    console.log("Recent stories prefetched");
  } catch (error) {
    console.error("Error prefetching stories:", error);
  }
}

/**
 * Prefetches trending routes for offline browsing
 */
async function prefetchTrendingRoutes() {
  try {
    const routesQuery = query(
      collection(db, "routes"),
      orderBy("likes", "desc"),
      limit(10)
    );
    await getDocs(routesQuery);
    console.log("Trending routes prefetched");
  } catch (error) {
    console.error("Error prefetching routes:", error);
  }
}

/**
 * Prefetches recent community posts for offline browsing
 */
async function prefetchCommunityPosts() {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    await getDocs(postsQuery);
    console.log("Community posts prefetched");
  } catch (error) {
    console.error("Error prefetching community posts:", error);
  }
}
