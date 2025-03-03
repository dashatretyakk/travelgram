"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/utils/firebase";
import { Compass, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";

const AuthPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(`/profile/${user.username}`);
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
          bio: "",
          location: "",
          website: "",
          followers: 0,
          following: 0,
          stories: 0,
          username: `@` + result.user?.displayName.replace(/\s/g, ""),
        });
      }

      router.push("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <div className="absolute top-2 right-2 text-gray-200">
            <Globe className="w-24 h-24 opacity-10" />
          </div>

          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50"></div>
                <Compass className="relative w-16 h-16 text-blue-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to TravelApp
            </h2>
            <p className="text-gray-500 mb-8">
              Share your adventures, discover new places
            </p>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-6 h-6 mr-3"
              />
              <span className="text-gray-700 font-medium relative">
                {loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>

            {/* Error Message */}
            {error && (
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our{" "}
              <a href="#" className="text-blue-500 hover:text-blue-600">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-500 hover:text-blue-600">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
