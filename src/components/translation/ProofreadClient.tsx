"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Loader2,
  CheckCircle2,
  Languages,
} from "lucide-react";
import { VideoPreview } from "@/components/translation/VideoPreview";
import {
  TranscriptEditor,
  type TranscriptBlock,
} from "@/components/translation/TranscriptEditor";
import { Toast, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

/* ─── Seed transcript data ───────────────────────────────────────────────── */
const SEED_BLOCKS: TranscriptBlock[] = [
  {
    id: "blk-001",
    startTime: "00:00",
    endTime: "00:04",
    startSeconds: 0,
    text: "Welcome to our platform. We're excited to have you here.",
    translatedText: "हमारे प्लेटफ़ॉर्म पर आपका स्वागत है। हमें खुशी है कि आप यहाँ हैं।",
  },
  {
    id: "blk-002",
    startTime: "00:04",
    endTime: "00:09",
    startSeconds: 4,
    text: "Today we'll be walking you through our core features.",
    translatedText: "आज हम आपको हमारी मुख्य विशेषताओं के बारे में बताएंगे।",
  },
  {
    id: "blk-003",
    startTime: "00:09",
    endTime: "00:15",
    startSeconds: 9,
    text: "Our AI-powered translation engine supports over 50 languages.",
    translatedText: "हमारा AI-संचालित अनुवाद इंजन 50 से अधिक भाषाओं का समर्थन करता है।",
  },
  {
    id: "blk-004",
    startTime: "00:15",
    endTime: "00:21",
    startSeconds: 15,
    text: "With lip-sync technology, your audience will never notice the difference.",
    translatedText: "लिप-सिंक तकनीक के साथ, आपके दर्शकों को कभी भी अंतर नहीं पता चलेगा।",
  },
  {
    id: "blk-005",
    startTime: "00:21",
    endTime: "00:27",
    startSeconds: 21,
    text: "Click the button below to get started with your first translation.",
    translatedText: "अपना पहला अनुवाद शुरू करने के लिए नीचे दिए गए बटन पर क्लिक करें।",
  },
  {
    id: "blk-006",
    startTime: "00:27",
    endTime: "00:32",
    startSeconds: 27,
    text: "Our team is available 24/7 to support your translation needs.",
    translatedText: "हमारी टीम आपकी अनुवाद जरूरतों को पूरा करने के लिए 24/7 उपलब्ध है।",
  },
];

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface ProofreadClientProps {
  projectId: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export function ProofreadClient({ projectId }: ProofreadClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, addToast, dismissToast } = useToast();

  const videoUrlParam = searchParams.get("videoUrl") || "https://res.cloudinary.com/bex5ixba/video/upload/v1790232026/dubberband_sample.mp4";

  const [blocks, setBlocks] = useState<TranscriptBlock[]>([]);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [activeBlockId, setActiveBlockId] = useState<string | undefined>(undefined);
  const [isRendering, setIsRendering] = useState(false);
  const [renderDone, setRenderDone] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const response = await fetch("/api/translate/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: videoUrlParam,
            sourceLanguage: "auto",
          }),
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || "Failed to fetch transcript");
        }
        const data = await response.json();
        setBlocks(data.transcript);
      } catch (error: any) {
        addToast(error.message || "An error occurred fetching transcript", "error");
        setBlocks(SEED_BLOCKS); // fallback
      } finally {
        setIsLoadingTranscript(false);
      }
    };
    fetchTranscript();
  }, [addToast, videoUrlParam]);

  /* Seek video + highlight block when transcript row's play is clicked */
  const handleBlockSeek = useCallback((blockId: string, startSeconds: number) => {
    setActiveBlockId(blockId);
    setSeekTo(startSeconds);
  }, []);

  /* Text change from TranscriptEditor */
  const handleTextChange = useCallback((blockId: string, newText: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, translatedText: newText } : b
      )
    );
  }, []);

  /* Video time update — highlight matching block */
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      const active = blocks.find(
        (b) => currentTime >= b.startSeconds && currentTime < b.startSeconds + 4
      );
      if (active) setActiveBlockId(active.id);
    },
    [blocks]
  );

  const handleConfirmRender = async () => {
    setIsRendering(true);
    try {
      const response = await fetch("/api/translate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrlParam,
          transcript: blocks,
          targetLanguage: "ta-IN",
          lipSyncEnabled: true,
        }),
      });
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Rendering failed");
      }
      const data = await response.json();

      setRenderDone(true);
      addToast("🎬 Video queued for rendering — we'll notify you when it's ready!", "success");
      // Navigate home after toast appears
      setTimeout(() => router.push("/"), 2000);
    } catch (error: any) {
      addToast(error.message || "An error occurred during rendering", "error");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <>
      {/* Toast portal */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Full-viewport editor shell ─────────────────────────── */}
      <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">

        {/* ── Minimal top bar ───────────────────────────────────── */}
        <header className="flex-shrink-0 h-14 bg-slate-900 border-b border-white/8 flex items-center px-5 gap-4 z-10">
          {/* Back */}
          <Link
            href="/"
            id="back-to-dashboard-link"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors duration-150 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="h-4 w-px bg-white/10" />

          {/* Project identity */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center">
              <Languages className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-white font-semibold truncate max-w-48">
              Proofread Editor
            </span>
            <span className="text-xs text-slate-600 font-mono hidden sm:block">
              #{projectId}
            </span>
          </div>

          <div className="flex-1" />

          {/* Language indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 border border-white/8 rounded-lg px-3 py-1.5">
            <span className="font-semibold text-slate-300">English</span>
            <span className="text-slate-600">→</span>
            <span className="font-semibold text-indigo-400">Hindi</span>
          </div>

          {/* Quick render button in header (compact) */}
          <button
            id="header-render-btn"
            disabled={isRendering || renderDone}
            onClick={handleConfirmRender}
            className={cn(
              "hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
              renderDone
                ? "bg-teal-500/20 border border-teal-500/30 text-teal-400"
                : "bg-gradient-to-r from-indigo-600 to-teal-500 text-white hover:shadow-md hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]",
              (isRendering || renderDone) && "opacity-80 cursor-not-allowed"
            )}
          >
            {isRendering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : renderDone ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {renderDone ? "Queued!" : "Render"}
          </button>
        </header>

        {/* ── Split-screen body ─────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Left — Video Player (60%) */}
          <div className="w-[60%] flex-shrink-0 border-r border-white/8">
            <VideoPreview
              projectId={projectId}
              seekTo={seekTo}
              onTimeUpdate={handleTimeUpdate}
              activeBlockId={activeBlockId}
            />
          </div>

          {/* Right — Transcript Editor (40%) */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 min-h-0 relative">
              {isLoadingTranscript ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <TranscriptEditor
                  blocks={blocks}
                  sourceLanguage="English"
                  targetLanguage="Hindi"
                  activeBlockId={activeBlockId}
                  onBlockSeek={handleBlockSeek}
                  onTextChange={handleTextChange}
                />
              )}
            </div>

            {/* ── Sticky footer ─────────────────────────────────── */}
            <footer className="flex-shrink-0 bg-white border-t border-slate-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between gap-4">
                {/* Cost summary */}
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Final Cost
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-800">2</span>
                    <span className="text-sm text-slate-500">Credits</span>
                    <span className="text-xs text-teal-600 font-semibold ml-1">
                      · 340 available
                    </span>
                  </div>
                </div>

                {/* Confirm & Render CTA */}
                <button
                  id="confirm-render-btn"
                  onClick={handleConfirmRender}
                  disabled={isRendering || renderDone}
                  className={cn(
                    "relative flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white",
                    "transition-all duration-200 shadow-lg",
                    renderDone
                      ? "bg-teal-500 shadow-teal-500/30 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-teal-500 shadow-indigo-500/30 hover:from-indigo-700 hover:to-teal-600 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]",
                    (isRendering || renderDone) && "pointer-events-none"
                  )}
                >
                  {/* Spinner overlay */}
                  {isRendering && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-inherit">
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex items-center gap-2.5 transition-opacity",
                      isRendering && "opacity-0"
                    )}
                  >
                    {renderDone ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        Video Queued!
                      </>
                    ) : (
                      <>
                        <Zap className="h-4.5 w-4.5" />
                        Confirm &amp; Render Video
                      </>
                    )}
                  </span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
