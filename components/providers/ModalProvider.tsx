"use client";
import React from "react";
import { useModalStore } from "@/context/ModalStore";
import StoryViewerModal from "@/components/modals/StoryViewerModal";
import RouteDetailsModal from "@/components/modals/RouteDetailsModal";

const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isStoryModalOpen,
    selectedStory,
    closeStoryModal,
    isRouteModalOpen,
    selectedRoute,
    closeRouteModal,
  } = useModalStore();

  const handleStoryLikeUpdate = (storyId: string, newLikeCount: number) => {
    // This function is optional but useful if we need to update story likes in the store
    // For now, we'll just update the local modal state which is sufficient
  };

  return (
    <>
      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={isStoryModalOpen}
        onClose={closeStoryModal}
        story={selectedStory}
        onLikeUpdate={handleStoryLikeUpdate}
      />

      {/* Route Details Modal */}
      <RouteDetailsModal
        isOpen={isRouteModalOpen}
        onClose={closeRouteModal}
        route={selectedRoute}
      />

      {children}
    </>
  );
};

export default ModalProvider;
