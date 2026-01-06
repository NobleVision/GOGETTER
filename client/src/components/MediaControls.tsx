import { useMedia } from "@/contexts/MediaContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Music, 
  Music2
} from "lucide-react";

interface MediaControlsProps {
  /** Show volume slider in a popover */
  showVolumeSlider?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export default function MediaControls({
  showVolumeSlider = true,
  compact = false,
  className = "",
}: MediaControlsProps) {
  const {
    videoEnabled,
    toggleVideo,
    musicEnabled,
    toggleMusic,
    musicVolume,
    setMusicVolume,
    isMusicPage,
  } = useMedia();

  const buttonSize = compact ? "sm" : "default";
  const iconSize = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Video Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={toggleVideo}
            className={`${
              videoEnabled 
                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" 
                : "text-muted-foreground hover:text-white hover:bg-slate-800"
            }`}
            aria-label={videoEnabled ? "Disable background video" : "Enable background video"}
          >
            {videoEnabled ? (
              <Video className={iconSize} />
            ) : (
              <VideoOff className={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{videoEnabled ? "Disable B-roll Video" : "Enable B-roll Video"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Music Toggle with Volume Control */}
      {isMusicPage ? (
        showVolumeSlider ? (
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size={buttonSize}
                    className={`${
                      musicEnabled 
                        ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" 
                        : "text-muted-foreground hover:text-white hover:bg-slate-800"
                    }`}
                    aria-label={musicEnabled ? "Music controls" : "Enable music"}
                  >
                    {musicEnabled ? (
                      <Music2 className={iconSize} />
                    ) : (
                      <VolumeX className={iconSize} />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{musicEnabled ? "Music Controls" : "Enable Music"}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent 
              className="w-48 bg-slate-900 border-slate-700" 
              side="bottom" 
              align="end"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Music</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMusic}
                    className={`h-7 px-2 ${
                      musicEnabled 
                        ? "text-emerald-400 hover:text-emerald-300" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {musicEnabled ? "On" : "Off"}
                  </Button>
                </div>
                {musicEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Volume</span>
                      <span>{Math.round(musicVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="h-3 w-3 text-muted-foreground" />
                      <Slider
                        value={[musicVolume]}
                        onValueChange={([value]) => setMusicVolume(value)}
                        min={0}
                        max={1}
                        step={0.05}
                        className="flex-1"
                      />
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={toggleMusic}
                className={`${
                  musicEnabled 
                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" 
                    : "text-muted-foreground hover:text-white hover:bg-slate-800"
                }`}
                aria-label={musicEnabled ? "Disable music" : "Enable music"}
              >
                {musicEnabled ? (
                  <Music2 className={iconSize} />
                ) : (
                  <VolumeX className={iconSize} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{musicEnabled ? "Disable Music" : "Enable Music"}</p>
            </TooltipContent>
          </Tooltip>
        )
      ) : null}
    </div>
  );
}

