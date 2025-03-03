"use client";
import { useAuth } from "@/context/AuthContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  return user ? children : null;
};

export default ProtectedRoute;
