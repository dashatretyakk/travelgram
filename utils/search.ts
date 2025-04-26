import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";

// Define data type interfaces
export interface StoryData {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  tags?: string[];
  images?: string[];
  createdAt?: any;
  likes?: number;
  userId?: string;
}

export interface RouteData {
  id: string;
  title?: string;
  description?: string;
  stops?: Array<{ location?: string; description?: string }>;
  tags?: string[];
  createdAt?: any;
  likes?: number;
  difficulty?: string;
  userId?: string;
  mainImage?: string;
}

export interface PostData {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  createdAt?: any;
  likes?: number;
  comments?: number;
  userId?: string;
  userPhoto?: string;
  userName?: string;
}

export interface SearchResults {
  stories: StoryData[];
  routes: RouteData[];
  posts: PostData[];
}

/**
 * Performs a search across stories, routes, and posts in Firestore
 * @param searchTerm The term to search for
 * @returns Object containing arrays of matching stories, routes, and posts
 */
export const performSearch = async (
  searchTerm: string
): Promise<SearchResults> => {
  // Don't search for very short terms
  if (!searchTerm || searchTerm.length < 2) {
    return { stories: [], routes: [], posts: [] };
  }

  try {
    // Get collections
    const storiesRef = collection(db, "stories");
    const routesRef = collection(db, "routes");
    const postsRef = collection(db, "posts");

    // Get all recent documents with higher limits to ensure we find matches
    const storiesQuery = query(storiesRef, limit(50));
    const routesQuery = query(routesRef, limit(50));
    const postsQuery = query(postsRef, limit(50));

    // Execute all queries in parallel
    const [storiesSnapshot, routesSnapshot, postsSnapshot] = await Promise.all([
      getDocs(storiesQuery),
      getDocs(routesQuery),
      getDocs(postsQuery),
    ]);

    // Log data counts for debugging
    console.log("Data counts:", {
      stories: storiesSnapshot.size,
      routes: routesSnapshot.size,
      posts: postsSnapshot.size,
    });

    // Prepare search term
    const searchTermLower = searchTerm.toLowerCase();

    // Process stories - use broad text matching
    const filteredStories = storiesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as StoryData))
      .filter((story) => {
        // First convert the entire story object to string to search broadly
        const storyString = JSON.stringify(story).toLowerCase();
        if (storyString.includes(searchTermLower)) return true;

        // Then do more specific matching
        const title = (story.title || "").toLowerCase();
        const description = (story.description || "").toLowerCase();
        const location = (story.location || "").toLowerCase();
        const tags = story.tags || [];

        return (
          title.includes(searchTermLower) ||
          description.includes(searchTermLower) ||
          location.includes(searchTermLower) ||
          tags.some((tag) => tag.toLowerCase().includes(searchTermLower))
        );
      });

    // Process routes
    const filteredRoutes = routesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as RouteData))
      .filter((route) => {
        // First convert the entire route to string to search broadly
        const routeString = JSON.stringify(route).toLowerCase();
        if (routeString.includes(searchTermLower)) return true;

        const title = (route.title || "").toLowerCase();
        const description = (route.description || "").toLowerCase();
        const tags = route.tags || [];

        // Check stops (locations)
        const stopsMatch =
          route.stops &&
          route.stops.some((stop) =>
            (stop.location || "").toLowerCase().includes(searchTermLower)
          );

        return (
          title.includes(searchTermLower) ||
          description.includes(searchTermLower) ||
          tags.some((tag) => tag.toLowerCase().includes(searchTermLower)) ||
          stopsMatch
        );
      });

    // Process posts
    const filteredPosts = postsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as PostData))
      .filter((post) => {
        // First convert the entire post to string to search broadly
        const postString = JSON.stringify(post).toLowerCase();
        if (postString.includes(searchTermLower)) return true;

        const title = (post.title || "").toLowerCase();
        const content = (post.content || "").toLowerCase();
        const tags = post.tags || [];

        return (
          title.includes(searchTermLower) ||
          content.includes(searchTermLower) ||
          tags.some((tag) => tag.toLowerCase().includes(searchTermLower))
        );
      });

    // Log search results
    console.log("Search results for", searchTerm, ":", {
      stories: filteredStories.length,
      routes: filteredRoutes.length,
      posts: filteredPosts.length,
    });

    return {
      stories: filteredStories,
      routes: filteredRoutes,
      posts: filteredPosts,
    };
  } catch (error) {
    console.error("Error searching:", error);
    return { stories: [], routes: [], posts: [] };
  }
};
