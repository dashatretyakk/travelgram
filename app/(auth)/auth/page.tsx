"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/utils/firebase";
import { Compass, Globe, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContextProvider";

// Function to check if username is already taken
const isUsernameTaken = async (username) => {
  try {
    // Query Firestore for any user with this username
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    // If we found any documents, the username is taken
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    // In case of error, assume the username might be taken to be safe
    return true;
  }
};

// Generate a unique username based on name
const generateUniqueUsername = async (baseName) => {
  // Create base username by removing spaces
  let baseUsername = `@${baseName.replace(/\s/g, "")}`;

  // First check if the base username is available
  if (!(await isUsernameTaken(baseUsername))) {
    return baseUsername;
  }

  // If not available, try adding a random number until we find an available one
  let attempt = 1;
  const maxAttempts = 10;

  while (attempt <= maxAttempts) {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const candidateUsername = `${baseUsername}${randomSuffix}`;

    if (!(await isUsernameTaken(candidateUsername))) {
      return candidateUsername;
    }

    attempt++;
  }

  // If we couldn't find a username after multiple attempts, add timestamp as a last resort
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${baseUsername}${timestamp}`;
};

const AuthPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("signin"); // signin, signup
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  useEffect(() => {
    if (user) {
      router.push(`/profile/${user.username}`);
    }
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
    setError("");
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (authMode === "signup") {
      if (!formData.name.trim()) {
        setError("Name is required");
        return false;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      if (authMode === "signup") {
        // Sign up with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });

        // Generate a unique username
        const username = await generateUniqueUsername(formData.name);

        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          name: formData.name,
          photoURL:
            userCredential.user.photoURL ||
            "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2210.jpg?semt=ais_hybrid&w=740",
          createdAt: serverTimestamp(),
          bio: "",
          location: "",
          website: "",
          followers: 0,
          following: 0,
          stories: 0,
          username: username,
        });

        router.push("/");
      } else {
        // Sign in with email and password
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        router.push("/");
      }
    } catch (error) {
      console.error("Email auth error:", error);

      // Handle specific Firebase auth errors
      const errorMap = {
        "auth/email-already-in-use":
          "Email already in use. Please sign in instead.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password is too weak.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
      };

      setError(errorMap[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

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
        // Generate a unique username for Google sign in
        const username = await generateUniqueUsername(result.user.displayName);

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
          username: username,
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
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-gray-500 mb-8">
              {authMode === "signin"
                ? "Welcome back to TravelApp"
                : "Join TravelApp community today"}
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {authMode === "signup" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {loading
                ? "Loading..."
                : authMode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Sign In Button */}
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
                Continue with Google
              </span>
            </button>

            {/* Error Message */}
            {error && (
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Sign In / Sign Up Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {authMode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
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
