import { useEffect, useRef, useState, useCallback } from "react";
import { useMedia, MUSIC_ENABLED_PAGES } from "@/contexts/MediaContext";
import { useLocation } from "wouter";

// Music files in dist/public/music/
const MUSIC_FILES = [
  "Suno Playlist_NobleVision - Go Getter (GROK41) (1).mp3",
  "Suno Playlist_NobleVision - Go Getter (GROK41) (2).mp3",
  "Suno Playlist_NobleVision - Go Getter (GROK41).mp3",
  "Suno Playlist_NobleVision - Go Getter (OPUS4.5) (1).mp3",
  "Suno Playlist_NobleVision - Go Getter (OPUS4.5) (2).mp3",
  "Suno Playlist_NobleVision - Go Getter (OPUS4.5) (3).mp3",
  "Suno Playlist_NobleVision - Go Getter (OPUS4.5) (4).mp3",
  "Suno Playlist_NobleVision - Go Getter (OPUS4.5).mp3",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const FADE_DURATION = 1000; // ms

export default function BackgroundMusic() {
  const [location] = useLocation();
  const { musicEnabled, musicVolume, setIsMusicPage } = useMedia();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<string[]>(() => shuffleArray(MUSIC_FILES));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current page should have music
  const isPageWithMusic = MUSIC_ENABLED_PAGES.includes(location);

  // Update context with current music page status
  useEffect(() => {
    setIsMusicPage(isPageWithMusic);
  }, [isPageWithMusic, setIsMusicPage]);

  // Fade in function
  const fadeIn = useCallback(() => {
    if (!audioRef.current) return;
    
    setIsFading(true);
    audioRef.current.volume = 0;
    audioRef.current.play().catch(() => {
      // Autoplay was prevented - user needs to interact first
      console.log("Autoplay prevented - waiting for user interaction");
    });
    
    const targetVolume = musicVolume;
    const steps = 20;
    const stepDuration = FADE_DURATION / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (audioRef.current) {
        audioRef.current.volume = Math.min(volumeStep * currentStep, targetVolume);
      }
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        setIsFading(false);
        setIsPlaying(true);
      }
    }, stepDuration);
  }, [musicVolume]);

  // Fade out function
  const fadeOut = useCallback(() => {
    if (!audioRef.current || !isPlaying) return;
    
    setIsFading(true);
    const startVolume = audioRef.current.volume;
    const steps = 20;
    const stepDuration = FADE_DURATION / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (audioRef.current) {
        audioRef.current.volume = Math.max(startVolume - (volumeStep * currentStep), 0);
      }
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsFading(false);
        setIsPlaying(false);
      }
    }, stepDuration);
  }, [isPlaying]);

  // Handle track end - play next in shuffled playlist
  const handleTrackEnded = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    if (nextIndex === 0) {
      // Reshuffle when playlist ends
      setPlaylist(shuffleArray(MUSIC_FILES));
    }
    setCurrentTrackIndex(nextIndex);
  }, [currentTrackIndex, playlist.length]);

  // Update volume when preference changes
  useEffect(() => {
    if (audioRef.current && !isFading) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume, isFading]);

  // Start/stop music based on enabled state and page
  useEffect(() => {
    if (musicEnabled && isPageWithMusic && !isPlaying && !isFading) {
      fadeIn();
    } else if ((!musicEnabled || !isPageWithMusic) && isPlaying && !isFading) {
      fadeOut();
    }
  }, [musicEnabled, isPageWithMusic, isPlaying, isFading, fadeIn, fadeOut]);

  // Cleanup fade interval on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const currentTrack = playlist[currentTrackIndex];
  const musicUrl = `/music/${encodeURIComponent(currentTrack)}`;

  return (
    <audio
      ref={audioRef}
      src={musicUrl}
      onEnded={handleTrackEnded}
      onError={() => {
        console.warn("Music file failed to load:", currentTrack);
        handleTrackEnded(); // Skip to next track
      }}
      preload="auto"
    />
  );
}

