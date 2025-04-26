import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// Helper function to get the correct collection name
const getCollectionName = (contentType: "story" | "post" | "route"): string => {
  switch (contentType) {
    case "story":
      return "stories";
    case "post":
      return "posts";
    case "route":
      return "routes";
    default:
      return contentType + "s";
  }
};

/**
 * Creates a new notification when a user likes or comments on content
 */
export const createNotification = async (params: {
  type: "like" | "comment";
  contentType: "story" | "post" | "route";
  contentId: string;
  senderId: string; // The user ID of the person liking/commenting
  recipientId?: string; // If not provided, it will be fetched from the content
}) => {
  try {
    const { type, contentType, contentId, senderId } = params;
    let recipientId = params.recipientId;
    let contentTitle = "";

    // Get recipient ID if not provided (from content owner)
    if (!recipientId) {
      try {
        const collectionName = getCollectionName(contentType);
        console.log(
          `Looking for ${contentType} in collection: ${collectionName}, ID: ${contentId}`
        );

        const contentRef = doc(db, collectionName, contentId);
        const contentDoc = await getDoc(contentRef);

        // Handle document not existing
        if (!contentDoc.exists()) {
          console.log(
            "Content document not found:",
            contentType,
            contentId,
            "in collection:",
            collectionName
          );
          return; // Silently abort notification creation
        }

        const contentData = contentDoc.data();
        recipientId = contentData.userId;
        contentTitle = contentData.title || `${contentType} update`;

        // Don't notify users about their own actions
        if (recipientId === senderId) {
          return;
        }
      } catch (error) {
        console.log("Error fetching content for notification:", error);
        return; // Silently abort notification creation
      }
    }

    // Get sender info
    try {
      const senderRef = doc(db, "users", senderId);
      const senderDoc = await getDoc(senderRef);

      if (!senderDoc.exists()) {
        console.log("Sender document not found:", senderId);
        return; // Silently abort notification creation
      }

      const senderData = senderDoc.data();

      // Create notification
      await addDoc(collection(db, "notifications"), {
        type,
        contentType,
        contentId,
        contentTitle,
        senderId,
        senderName: senderData.name || "A user",
        senderPhoto: senderData.photoURL || null,
        recipientId,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.log("Error creating notification:", error);
      // Silently fail - don't break the app experience for notification errors
    }
  } catch (error) {
    console.log("Unexpected error in notification system:", error);
    // Silently fail - we never want notifications to break the main app flow
  }
};

/**
 * Checks if a notification with the exact same parameters already exists to prevent duplicates
 */
export const checkForExistingNotification = async (params: {
  type: "like" | "comment";
  contentType: "story" | "post" | "route";
  contentId: string;
  senderId: string;
  recipientId: string;
}) => {
  try {
    const { type, contentType, contentId, senderId, recipientId } = params;

    // Query for existing notification with the same parameters
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("type", "==", type),
      where("contentType", "==", contentType),
      where("contentId", "==", contentId),
      where("senderId", "==", senderId),
      where("recipientId", "==", recipientId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.log("Error checking for existing notification:", error);
    return false;
  }
};
