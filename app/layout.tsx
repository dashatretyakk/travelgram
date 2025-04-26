"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContextProvider";
import * as PWA from "../app/pwa";
import { useEffect, useState } from "react";
import Head from "next/head";
import { prefetchCriticalData } from "@/utils/prefetch";
import { useAuth } from "@/context/AuthContextProvider";
import ModalProvider from "@/components/providers/ModalProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata = {
//   title: "Travel Community",
//   description: "A community platform for travelers",
//   manifest: "/manifest.json",
//   themeColor: "#3b82f6",
//   viewport:
//     "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
//   icons: {
//     apple: [
//       { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
//       { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
//     ],
//   },
// };

function MainContent({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [hasPrefetched, setHasPrefetched] = useState(false);
  const { user } = useAuth();

  // Set up offline detection
  useEffect(() => {
    function handleOnlineStatusChange() {
      const online = navigator.onLine;
      setIsOffline(!online);

      // When coming back online, try to prefetch data again if needed
      if (online && user && !hasPrefetched) {
        prefetchData();
      }
    }

    // Check initial status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline status
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, [user, hasPrefetched]);

  // Prefetch data for offline use when user is available
  useEffect(() => {
    if (user && navigator.onLine && !hasPrefetched) {
      prefetchData();
    }
  }, [user, hasPrefetched]);

  // Prefetch important data for offline use
  const prefetchData = async () => {
    if (user?.uid) {
      const success = await prefetchCriticalData(user.uid);
      if (success) {
        setHasPrefetched(true);
      }
    }
  };

  return (
    <>
      {isOffline && (
        <div className="bg-yellow-500 text-white text-center py-2 px-4 fixed top-0 left-0 right-0 z-50">
          You are currently offline. Some features may be limited.
        </div>
      )}
      {children}
    </>
  );
}

// Add offline detection state
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Register service worker
    PWA.register();
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Travel Community" />
        <meta name="description" content="A community platform for travelers" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthContextProvider>
          <ModalProvider>
            <MainContent>{children}</MainContent>
          </ModalProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
