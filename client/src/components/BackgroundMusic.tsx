import { useEffect, useRef, useState, useCallback } from "react";
import { useMedia, MUSIC_ENABLED_PAGES } from "@/contexts/MediaContext";
import { useLocation } from "wouter";

// Cache buster - change this value to force rebuild
const PLAYLIST_VERSION = "2026-01-06-v2";

// Music files in client/public/music/
const MUSIC_FILES = [
  "Suno Playlist_NobleVision - 3 Bucks is 3 Bucks! (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Activate Your Mind (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Agents Don't Sleep! (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Can you Feel the Awakening! (GEMINI3FLASH).mp3",
  "Suno Playlist_NobleVision - Every Bill Gets Paid! (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Get GoGetter - Instrumental (GPT52).mp3",
  "Suno Playlist_NobleVision - Ghost in the Machine (GEMINI3FLASH).mp3",
  "Suno Playlist_NobleVision - Go Getter - Da Wha (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Go Getter - Go Getter (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - God's Grace is the Encryption (GEMINI3FLASH).mp3",
  "Suno Playlist_NobleVision - GoGetter Is Live - Instrumental (GPT52).mp3",
  "Suno Playlist_NobleVision - GoGetter Is Live (GPT52).mp3",
  "Suno Playlist_NobleVision - Manus is the Modem - Ghost in the Machine (GEMINI3FLASH).mp3",
  "Suno Playlist_NobleVision - Noble Vision We don't Stop for 404! (Opus45).mp3",
  "Suno Playlist_NobleVision - Paradox of Profit (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Passport to the Kingdom (GEMINI3FLASH).mp3",
  "Suno Playlist_NobleVision - Perplexity Whispers (GROK41).mp3",
  "Suno Playlist_NobleVision - Stay Inside Your Line (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Time to Bear the Fruit! (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Token Economics (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Truth that Wont Compute - Corner Stone (Opus45).mp3",
  "Suno Playlist_NobleVision - Wait Your Turn (OPUS4.5).mp3",
  "Suno Playlist_NobleVision - Watch the Profits Flow! (GROK41).mp3",
  "Suno Playlist_NobleVision - We Don't Chase Hype! (GPT52).mp3",
  "Suno Playlist_NobleVision - Why Wait for the Call!_ (GROK41).mp3",
  "Suno Playlist_NobleVision - Wisdom Multiplies - Glory to the Grand Design (Opus45).mp3",
  "Suno Playlist_NobleVision - Workflow be the Guide (Opus45).mp3",
  "Suno Playlist_NobleVision - Your Purpose is Devine (OPUS4.5).mp3",
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

// Helper function to format track name for display
function formatTrackName(filename: string): string {
  // Remove file extension
  let name = filename.replace(/\.mp3$/i, "");
  // Remove "Suno Playlist_NobleVision - " prefix
  name = name.replace(/^Suno Playlist_NobleVision - /, "");
  // Remove the AI model suffix in parentheses like (OPUS4.5), (GEMINI3FLASH), etc.
  name = name.replace(/\s*\([^)]*\)\s*$/, "");
  return name.trim();
}

export default function BackgroundMusic() {
  const [location] = useLocation();
  const { musicEnabled, musicVolume, setIsMusicPage, setSkipTrackCallback, setCurrentTrackName } = useMedia();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<string[]>(() => shuffleArray(MUSIC_FILES));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to avoid stale closure issues with the skip callback
  const playlistRef = useRef(playlist);
  const currentTrackIndexRef = useRef(currentTrackIndex);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Check if current page should have music
  const isPageWithMusic = MUSIC_ENABLED_PAGES.includes(location);

  // Update context with current music page status
  useEffect(() => {
    setIsMusicPage(isPageWithMusic);
  }, [isPageWithMusic, setIsMusicPage]);

  // Listen for user interaction to unlock autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserHasInteracted(true);
      // Remove listeners once user has interacted
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  // Fade in function
  const fadeIn = useCallback(() => {
    if (!audioRef.current) return;

    setIsFading(true);
    audioRef.current.volume = 0;

    const playPromise = audioRef.current.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented - mark as pending and wait for user interaction
        setIsFading(false);
        setPendingPlay(true);
      });
    }

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

  // When user interacts and we have a pending play, start the music
  useEffect(() => {
    if (userHasInteracted && pendingPlay && musicEnabled && isPageWithMusic) {
      setPendingPlay(false);
      fadeIn();
    }
  }, [userHasInteracted, pendingPlay, musicEnabled, isPageWithMusic, fadeIn]);

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

  // Handle track end - play next in shuffled playlist (using refs to avoid stale closure)
  const handleTrackEnded = useCallback(() => {
    const currentIndex = currentTrackIndexRef.current;
    const currentPlaylist = playlistRef.current;
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    if (nextIndex === 0) {
      // Reshuffle when playlist ends
      const newPlaylist = shuffleArray(MUSIC_FILES);
      setPlaylist(newPlaylist);
      playlistRef.current = newPlaylist;
    }
    setCurrentTrackIndex(nextIndex);
    currentTrackIndexRef.current = nextIndex;
  }, []); // No dependencies - uses refs

  // Register skip track callback with the context (only once since callback is stable)
  useEffect(() => {
    setSkipTrackCallback(handleTrackEnded);
  }, [setSkipTrackCallback, handleTrackEnded]);

  // Update current track name in context
  const currentTrack = playlist[currentTrackIndex];
  useEffect(() => {
    setCurrentTrackName(formatTrackName(currentTrack));
  }, [currentTrack, setCurrentTrackName]);

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

  const musicUrl = `/music/${encodeURIComponent(currentTrack)}`;

  return (
    <audio
      ref={audioRef}
      src={musicUrl}
      onEnded={handleTrackEnded}
      onError={() => {
        console.warn(`[${PLAYLIST_VERSION}] Music file failed to load:`, currentTrack);
        handleTrackEnded(); // Skip to next track
      }}
      preload="auto"
    />
  );
}

