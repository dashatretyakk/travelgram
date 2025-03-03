"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
const AuthContext = createContext({});

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Set up real-time listener for user data
          const userDocRef = doc(db, "users", authUser.uid);

          const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              // Combine auth user and Firestore data
              console.log(authUser);

              setUser({
                uid: authUser.uid,
                email: authUser.email,
                emailVerified: authUser.emailVerified,
                ...doc.data(),
              });
            } else {
              // If Firestore document doesn't exist, use only auth data
              setUser({
                uid: authUser.uid,
                email: authUser.email,
                emailVerified: authUser.emailVerified,
              });
            }
            setLoading(false);
          });

          // Clean up Firestore listener when auth state changes
          return () => unsubscribeFirestore();
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        router.push("/auth");
        setLoading(false);
      }
    });

    // Clean up auth listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context as any;
};
