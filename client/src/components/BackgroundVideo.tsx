import { useEffect, useRef, useState, useCallback } from "react";
import { useMedia, VideoCategory, ROUTE_VIDEO_MAP } from "@/contexts/MediaContext";
import { useVideoSelection, getRandomVideoFromCategory, getVideoUrl } from "@/hooks/useVideoSelection";
import { useLocation } from "wouter";

interface BackgroundVideoProps {
  /** Override the automatic category selection based on route */
  category?: VideoCategory;
  /** Custom className for the container */
  className?: string;
  /** Opacity of the video overlay (0-1) */
  overlayOpacity?: number;
}

export default function BackgroundVideo({
  category: overrideCategory,
  className = "",
  overlayOpacity = 0.7,
}: BackgroundVideoProps) {
  const [location] = useLocation();
  const { videoEnabled, setCurrentVideoCategory } = useMedia();
  
  // Determine category based on route or override
  const category = overrideCategory || ROUTE_VIDEO_MAP[location] || "ambient";
  
  // Track category changes
  useEffect(() => {
    setCurrentVideoCategory(category);
  }, [category, setCurrentVideoCategory]);

  const { videoUrl } = useVideoSelection(category);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(videoUrl);
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Handle video end - transition to next video
  const handleVideoEnded = useCallback(() => {
    const nextVideoNumber = getRandomVideoFromCategory(category);
    const nextUrl = getVideoUrl(nextVideoNumber);
    setNextSrc(nextUrl);
    setIsTransitioning(true);
  }, [category]);

  // When next video is ready, swap them
  useEffect(() => {
    if (isTransitioning && nextSrc && nextVideoRef.current) {
      const timer = setTimeout(() => {
        setCurrentSrc(nextSrc);
        setNextSrc(null);
        setIsTransitioning(false);
      }, 1000); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, nextSrc]);

  // Reset when category changes
  useEffect(() => {
    const newVideoNumber = getRandomVideoFromCategory(category);
    setCurrentSrc(getVideoUrl(newVideoNumber));
    setHasError(false);
  }, [category]);

  // Handle video error by switching to a different clip instead of unmounting the layer
  const handleError = useCallback(() => {
    console.warn("Video failed to load:", currentSrc);
    setHasError(true);
    setTimeout(() => {
      const fallbackVideoNumber = getRandomVideoFromCategory(category);
      const fallbackUrl = getVideoUrl(fallbackVideoNumber);
      setCurrentSrc(fallbackUrl);
      setNextSrc(null);
      setIsTransitioning(false);
      setHasError(false);
    }, 250);
  }, [category, currentSrc]);

  if (!videoEnabled) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Current video */}
      <video
        ref={videoRef}
        key={currentSrc}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
        src={currentSrc}
        autoPlay
        loop={false}
        muted
        playsInline
        onEnded={handleVideoEnded}
        onError={handleError}
        preload="auto"
      />
      
      {/* Next video (for crossfade) */}
      {nextSrc && (
        <video
          ref={nextVideoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isTransitioning ? "opacity-100" : "opacity-0"
          }`}
          src={nextSrc}
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={handleVideoEnded}
          onError={handleError}
          preload="auto"
        />
      )}
      
      {/* Dark overlay to ensure UI readability */}
      <div 
        className="absolute inset-0 bg-slate-950"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}

