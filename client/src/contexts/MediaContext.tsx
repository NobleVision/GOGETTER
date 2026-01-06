import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Video category ranges (1-indexed video numbers)
export const VIDEO_CATEGORIES = {
  hero: { start: 1, end: 20, label: "Hero Section & Landing Page" },
  wizard: { start: 21, end: 35, label: "Business Discovery & Wizard Flow" },
  catalog: { start: 36, end: 50, label: "Business Catalog & Scoring" },
  dashboard: { start: 51, end: 70, label: "Dashboard & Monitoring" },
  agents: { start: 71, end: 85, label: "AI Agents & Automation" },
  tokens: { start: 86, end: 92, label: "Token Usage & Cost Optimization" },
  resources: { start: 93, end: 97, label: "Resources & Business Formation" },
  ambient: { start: 98, end: 100, label: "Ambient & Atmospheric B-Roll" },
} as const;

export type VideoCategory = keyof typeof VIDEO_CATEGORIES;

// Map routes to video categories
export const ROUTE_VIDEO_MAP: Record<string, VideoCategory> = {
  "/": "dashboard",
  "/wizard": "wizard",
  "/catalog": "catalog",
  "/my-businesses": "dashboard",
  "/monitoring": "dashboard",
  "/token-usage": "tokens",
  "/api-config": "agents",
  "/webhooks": "agents",
  "/blueprints": "agents",
  "/resources": "resources",
  "/settings": "ambient",
};

// Pages that should have music enabled
export const MUSIC_ENABLED_PAGES = ["/", "/wizard"];

// localStorage keys
const STORAGE_KEYS = {
  videoEnabled: "go-getter-video-enabled",
  musicEnabled: "go-getter-music-enabled",
  musicVolume: "go-getter-music-volume",
};

interface MediaContextType {
  // Video state
  videoEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  toggleVideo: () => void;
  currentVideoCategory: VideoCategory;
  setCurrentVideoCategory: (category: VideoCategory) => void;
  
  // Music state
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  toggleMusic: () => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  isMusicPage: boolean;
  setIsMusicPage: (isPage: boolean) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

interface MediaProviderProps {
  children: React.ReactNode;
}

export function MediaProvider({ children }: MediaProviderProps) {
  // Video state with localStorage persistence
  const [videoEnabled, setVideoEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.videoEnabled);
    return stored !== null ? stored === "true" : true; // Default enabled
  });

  // Music state with localStorage persistence
  const [musicEnabled, setMusicEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.musicEnabled);
    return stored !== null ? stored === "true" : true; // Default enabled
  });

  const [musicVolume, setMusicVolumeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.musicVolume);
    return stored !== null ? parseFloat(stored) : 0.3; // Default 30% volume
  });

  const [currentVideoCategory, setCurrentVideoCategory] = useState<VideoCategory>("dashboard");
  const [isMusicPage, setIsMusicPage] = useState(false);

  // Persist video preference
  const setVideoEnabled = useCallback((enabled: boolean) => {
    setVideoEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.videoEnabled, String(enabled));
  }, []);

  // Persist music preference
  const setMusicEnabled = useCallback((enabled: boolean) => {
    setMusicEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.musicEnabled, String(enabled));
  }, []);

  // Persist volume preference
  const setMusicVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMusicVolumeState(clampedVolume);
    localStorage.setItem(STORAGE_KEYS.musicVolume, String(clampedVolume));
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled(!videoEnabled);
  }, [videoEnabled, setVideoEnabled]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled(!musicEnabled);
  }, [musicEnabled, setMusicEnabled]);

  return (
    <MediaContext.Provider
      value={{
        videoEnabled,
        setVideoEnabled,
        toggleVideo,
        currentVideoCategory,
        setCurrentVideoCategory,
        musicEnabled,
        setMusicEnabled,
        toggleMusic,
        musicVolume,
        setMusicVolume,
        isMusicPage,
        setIsMusicPage,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within MediaProvider");
  }
  return context;
}

