import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoryData, RouteData } from "@/utils/search";

interface ModalState {
  // Story modal state
  isStoryModalOpen: boolean;
  selectedStory: StoryData | null;
  openStoryModal: (story: StoryData) => void;
  closeStoryModal: () => void;

  // Route modal state
  isRouteModalOpen: boolean;
  selectedRoute: RouteData | null;
  openRouteModal: (route: RouteData) => void;
  closeRouteModal: () => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  // Initial story modal state
  isStoryModalOpen: false,
  selectedStory: null,
  openStoryModal: (story: StoryData) =>
    set({ isStoryModalOpen: true, selectedStory: story }),
  closeStoryModal: () => set({ isStoryModalOpen: false, selectedStory: null }),

  // Initial route modal state
  isRouteModalOpen: false,
  selectedRoute: null,
  openRouteModal: (route: RouteData) =>
    set({ isRouteModalOpen: true, selectedRoute: route }),
  closeRouteModal: () => set({ isRouteModalOpen: false, selectedRoute: null }),
}));
