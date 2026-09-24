"use client";

import { useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  projectId: string;
  /** Current cue time in seconds — seeking the video to this position */
  seekTo?: number;
  onTimeUpdate?: (currentTime: number) => void;
  activeBlockId?: string;
  videoUrl?: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VideoPreview({
  projectId,
  seekTo,
  onTimeUpdate,
  activeBlockId,
  videoUrl,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 min placeholder
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);

  /* Seek programmatically when a transcript block is clicked */
  const prevSeekTo = useRef<number | undefined>(undefined);
  if (seekTo !== undefined && seekTo !== prevSeekTo.current) {
    prevSeekTo.current = seekTo;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTo;
    }
    setCurrentTime(seekTo);
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying((p) => !p);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    setIsMuted((p) => {
      const next = !p;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const skip = (delta: number) => {
    const t = Math.max(0, Math.min(duration, currentTime + delta));
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* ── Video area ───────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center bg-black group min-h-0">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl.split('#')[0]}
            className="max-w-full max-h-full aspect-video object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
          />
        ) : (
          <>
            {/* Hidden real video element */}
            <video
              ref={videoRef}
              className="hidden"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
            />

            {/* Stylised placeholder screen */}
            <div className="w-full max-w-2xl aspect-video relative flex items-center justify-center rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)",
                }}
              />
              <div className="relative flex flex-col items-center gap-4 text-center px-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-teal-500/30 border border-white/10 flex items-center justify-center">
                  <Film className="h-8 w-8 text-white/40" strokeWidth={1} />
                </div>
                <div>
                  <p className="text-white/50 text-sm font-medium">
                    Project ID: {projectId}
                  </p>
                  <p className="text-white/25 text-xs mt-1">
                    Placeholder — connect a real video source in Step 4
                  </p>
                </div>

                {/* Active cue overlay */}
                {activeBlockId && (
                  <div className="mt-2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 max-w-sm">
                    <p className="text-white text-sm font-medium text-center leading-snug">
                      ♪ Subtitle cue active
                    </p>
                  </div>
                )}
              </div>

              {/* Big play overlay button */}
              <button
                id="video-play-overlay"
                onClick={togglePlay}
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                )}
              >
                <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  {isPlaying ? (
                    <Pause className="h-7 w-7 text-white" />
                  ) : (
                    <Play className="h-7 w-7 text-white ml-1" />
                  )}
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-white/8 px-5 pt-3 pb-4 space-y-3">
        {/* Progress scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono w-10 text-right flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group/scrub">
            <input
              id="video-scrubber"
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleScrub}
              className="w-full h-1 appearance-none bg-slate-700 rounded-full outline-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-indigo-400
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:group-hover/scrub:opacity-100
                [&::-webkit-slider-thumb]:transition-opacity"
              style={{
                background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${progress}%, rgb(51 65 85) ${progress}%, rgb(51 65 85) 100%)`,
              }}
            />
          </div>
          <span className="text-xs text-slate-500 font-mono w-10 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Volume */}
            <div
              className="relative"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button
                id="video-mute-btn"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              {showVolume && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl">
                  <input
                    id="video-volume-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-20 appearance-none cursor-pointer writing-mode-vertical-lr"
                    style={{ writingMode: "vertical-lr", direction: "rtl" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Centre — skip/play */}
          <div className="flex items-center gap-2">
            <button
              id="video-skip-back-btn"
              onClick={() => skip(-5)}
              aria-label="Skip back 5s"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              id="video-play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>

            <button
              id="video-skip-forward-btn"
              onClick={() => skip(5)}
              aria-label="Skip forward 5s"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Right — fullscreen */}
          <button
            id="video-fullscreen-btn"
            aria-label="Fullscreen"
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
