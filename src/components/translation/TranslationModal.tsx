"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  Upload,
  Link2,
  Globe2,
  ChevronDown,
  Zap,
  FileVideo,
  X,
  Check,
  Languages,
  Wand2,
  FileEdit,
  AlertCircle,
  Loader2,
  Volume2,
  Subtitles,
  Clock4,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toast, useToast } from "@/components/ui/toast";
import type { Project } from "@/components/dashboard/ProjectCard";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type InputTab = "upload" | "url";

interface AdvancedOptions {
  lipSyncEnabled: boolean;
  dynamicDuration: boolean;
  removeNoise: boolean;
  autoSubtitles: boolean;
}

interface TranslationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const SOURCE_LANGUAGES = [
  { value: "auto", label: "Auto-Detect" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "ko", label: "Korean" },
];

const TARGET_LANGUAGES = [
  { value: "ta-IN", label: "Tamil", flag: "🇮🇳" },
  { value: "hi", label: "Hindi", flag: "🇮🇳" },
  { value: "te", label: "Telugu", flag: "🇮🇳" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "pt", label: "Portuguese", flag: "🇧🇷" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
];

const THUMBNAIL_GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
  "bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500",
  "bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400",
  "bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500",
  "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500",
];

const THUMBNAIL_ICONS = ["🎬", "🎓", "📊", "📣", "⚙️", "💼", "🎥", "📹"];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return `proj-${Date.now().toString(36)}`;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

/** A custom <select>-like dropdown (native select styled for dark theme) */
function DarkSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none bg-slate-800 border border-white/10 rounded-xl",
          "px-4 py-3 pr-10 text-sm text-white",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          "transition-all duration-200 cursor-pointer",
          !value && "text-slate-400"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
}

/** Toggle row for advanced options */
function ToggleRow({
  id,
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function TranslationModal({
  open,
  onOpenChange,
  onProjectCreated,
}: TranslationModalProps) {
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  /* Input state */
  const [activeTab, setActiveTab] = useState<InputTab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [urlVerified, setUrlVerified] = useState(false);
  const [urlVerifying, setUrlVerifying] = useState(false);
  const [urlError, setUrlError] = useState("");

  /* Language & Engine state */
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("");
  const [engine, setEngine] = useState<"desi" | "fora">("desi");

  /* Advanced options */
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedOptions>({
    lipSyncEnabled: true,
    dynamicDuration: true,
    removeNoise: false,
    autoSubtitles: false,
  });

  const isValidPublicUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  /* Derived — either a local file or a valid public URL is required */
  const hasInput =
    (activeTab === "upload" && !!file) ||
    (activeTab === "url" && (urlVerified || isValidPublicUrl(url)));
  const isReady = hasInput && !!targetLang;

  /* Dropzone */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-matroska": [".mkv"],
    },
    maxSize: 500 * 1024 * 1024, // 500 MB
    multiple: false,
  });

  /* URL verification */
  const handleVerifyUrl = async () => {
    if (!url.trim()) return;
    setUrlVerifying(true);
    setUrlError("");
    setUrlVerified(false);
    await new Promise((r) => setTimeout(r, 600));
    if (isValidPublicUrl(url)) {
      setUrlVerified(true);
    } else {
      setUrlError("Please enter a valid HTTP or HTTPS public URL.");
    }
    setUrlVerifying(false);
  };

  /* Reset on close */
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setFile(null);
      setUrl("");
      setUrlVerified(false);
      setUrlError("");
      setSourceLang("auto");
      setTargetLang("");
      setAdvancedOpen(false);
      setAdvanced({
        lipSyncEnabled: true,
        dynamicDuration: true,
        removeNoise: false,
        autoSubtitles: false,
      });
    }
    onOpenChange(val);
  };

  /* Build new project object */
  const buildProject = (status: "processing" | "draft"): Project => {
    const titleBase =
      activeTab === "upload" && file
        ? file.name.replace(/\.[^.]+$/, "")
        : url.includes("youtu")
        ? "YouTube Video"
        : "Public Video";

    const target = TARGET_LANGUAGES.find((l) => l.value === targetLang);
    const source = SOURCE_LANGUAGES.find((l) => l.value === sourceLang);

    return {
      id: generateId(),
      title: titleBase,
      thumbnailGradient:
        THUMBNAIL_GRADIENTS[Math.floor(Math.random() * THUMBNAIL_GRADIENTS.length)],
      thumbnailIcon: THUMBNAIL_ICONS[Math.floor(Math.random() * THUMBNAIL_ICONS.length)],
      sourceLanguage: source?.label ?? "English",
      targetLanguage: target?.label ?? targetLang,
      status,
      duration: "—:——",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      progress: status === "processing" ? 0 : undefined,
    };
  };

  const handleOneClickTranslate = async () => {
    setIsProcessing(true);
    try {
      // Always send JSON to generate — never the raw file.
      // For URL: server downloads + uploads to Sarvam (avoids browser CORS).
      // For file: server returns an upload_url; browser then PUTs the file.
      const generateRes = await fetch("/api/translate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: activeTab === "url" ? url.trim() : undefined,
          targetLanguage: targetLang,
          sourceLanguage: sourceLang,
          lipSyncEnabled: advanced.lipSyncEnabled,
          fileName: file?.name,
          engine,
        }),
      });

      if (!generateRes.ok) {
        const text = await generateRes.text();
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch { /* noop */ }
        throw new Error(msg || "Generation failed");
      }

      const data = await generateRes.json();
      const { project_id, job_id, upload_url, lip_sync } = data;

      // For file uploads the server returns upload_url;
      // for URL uploads the server already uploaded — no upload_url.
      if (upload_url && file) {
        const uploadRes = await fetch(upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "video/mp4",
            "x-ms-blob-type": "BlockBlob",
          },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error(
            `Failed to upload file to Sarvam storage (${uploadRes.status}). ` +
            "Try using a public URL instead."
          );
        }
      }

      // Start the Sarvam job
      const startRes = await fetch("/api/translate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id,
          job_id,
          lip_sync,
          video_url: activeTab === "url" ? url.trim() : `file:${file?.name ?? "upload"}`,
          engine,
        }),
      });

      if (!startRes.ok) {
        const text = await startRes.text();
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch { /* noop */ }
        throw new Error(msg || "Failed to start processing");
      }

      const project = buildProject("processing");
      if (activeTab === "url") project.videoUrl = url.trim();
      onProjectCreated(project);
      handleOpenChange(false);
      addToast("Video queued for translation!", "success");
    } catch (error: any) {
      addToast(error.message || "An error occurred", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProofreadScript = async () => {
    setIsProcessing(true);
    try {
      let response: Response;

      if (activeTab === "upload" && file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("sourceLanguage", sourceLang);
        fd.append("targetLanguage", targetLang);
        response = await fetch("/api/translate/transcribe", {
          method: "POST",
          body: fd,
        });
      } else {
        response = await fetch("/api/translate/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: url.trim(),
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
          }),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch { /* noop */ }
        throw new Error(msg || "Transcription failed");
      }
      await response.json(); // transcript data (used in editor)

      const project = buildProject("draft");
      if (activeTab === "url") project.videoUrl = url.trim();
      onProjectCreated(project);
      handleOpenChange(false);
      const qs = project.videoUrl ? `?videoUrl=${encodeURIComponent(project.videoUrl)}` : "";
      router.push(`/translate/${project.id}/proofread${qs}`);
    } catch (error: any) {
      addToast(error.message || "An error occurred", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const targetLangObj = TARGET_LANGUAGES.find((l) => l.value === targetLang);

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0">
        {/* ── Header ── */}
        <DialogHeader className="border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Languages className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <DialogTitle>New Translation</DialogTitle>
              <DialogDescription className="mt-0.5">
                Upload a video or paste a link to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* ══════════════════════════════════════════════════════
              STEP 1 — VIDEO INGESTION
          ══════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-5 w-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                1
              </span>
              <h3 className="text-sm font-semibold text-white">Video Source</h3>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-800 p-1 rounded-xl mb-4">
              <button
                id="tab-upload"
                onClick={() => setActiveTab("upload")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === "upload"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                File Upload
              </button>
              <button
                id="tab-url"
                onClick={() => setActiveTab("url")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === "url"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                URL Link
              </button>
            </div>

            {/* Upload tab */}
            {activeTab === "upload" && (
              <div className="space-y-3">
                {!file ? (
                  <div
                    {...getRootProps()}
                    id="dropzone"
                    className={cn(
                      "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                      isDragActive && !isDragReject
                        ? "border-indigo-400 bg-indigo-500/10"
                        : isDragReject
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:border-indigo-500/50 hover:bg-white/5"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors duration-200",
                          isDragActive && !isDragReject
                            ? "bg-indigo-500/20"
                            : "bg-white/5"
                        )}
                      >
                        <Upload
                          className={cn(
                            "h-6 w-6 transition-colors",
                            isDragActive && !isDragReject
                              ? "text-indigo-400"
                              : "text-slate-500"
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                      {isDragReject ? (
                        <p className="text-sm text-red-400 font-medium">
                          Invalid file type
                        </p>
                      ) : isDragActive ? (
                        <p className="text-sm text-indigo-400 font-medium">
                          Drop to upload!
                        </p>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Drag & drop your video here
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              or{" "}
                              <span className="text-indigo-400 underline underline-offset-2">
                                browse files
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">
                              MP4
                            </span>
                            <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">
                              MOV
                            </span>
                            <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">
                              MKV
                            </span>
                            <span className="text-[10px] text-slate-500">
                              · up to 500 MB
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* File preview card */
                  <div className="flex items-center gap-4 bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <FileVideo className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-teal-400" />
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        aria-label="Remove file"
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Ready notice */}
                {file && (
                  <div className="flex items-center gap-2.5 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 text-xs">
                    <Check className="h-4 w-4 flex-shrink-0 text-teal-400" />
                    <span>File ready — select a target language below to continue.</span>
                  </div>
                )}
              </div>
            )}

            {/* URL tab */}
            {activeTab === "url" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-indigo-400" />
                    </div>
                    <input
                      id="url-input"
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUrl(val);
                        setUrlError("");
                        if (isValidPublicUrl(val)) {
                          setUrlVerified(true);
                        } else {
                          setUrlVerified(false);
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyUrl()}
                      placeholder="Paste YouTube/Public URL (e.g. https://...)"
                      className={cn(
                        "w-full bg-slate-800 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
                        urlError
                          ? "border-red-500/60"
                          : urlVerified
                          ? "border-teal-500/60"
                          : "border-white/10"
                      )}
                    />
                    {urlVerified && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="h-4 w-4 text-teal-400" />
                      </div>
                    )}
                  </div>
                  <button
                    id="verify-url-btn"
                    onClick={handleVerifyUrl}
                    disabled={!url.trim() || urlVerifying}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2",
                      urlVerified
                        ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
                        : "border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {urlVerifying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : urlVerified ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                    {urlVerifying ? "Fetching..." : urlVerified ? "Verified" : "Fetch"}
                  </button>
                </div>
                {urlError && (
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {urlError}
                  </div>
                )}
                {urlVerified && (
                  <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2">
                    <Check className="h-3.5 w-3.5" />
                    Video found and ready to process
                  </div>
                )}
                <p className="text-[11px] text-slate-600">
                  Supported: YouTube, Google Drive, direct public video URLs. Ensure the video is publicly accessible.
                </p>
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════════════════
              STEP 2 — LANGUAGE & AUDIO
          ══════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-5 w-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                2
              </span>
              <h3 className="text-sm font-semibold text-white">
                Language Configuration
              </h3>
            </div>

            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 mb-6">
              <button
                onClick={() => setEngine("desi")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                  engine === "desi"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:text-white border border-transparent"
                )}
              >
                Desi 
              </button>
              <button
                onClick={() => setEngine("fora")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                  engine === "fora"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:text-white border border-transparent"
                )}
              >
                Fora 
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="source-language"
                  className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"
                >
                  Source Language
                </label>
                <DarkSelect
                  id="source-language"
                  value={sourceLang}
                  onChange={setSourceLang}
                  options={SOURCE_LANGUAGES}
                />
              </div>
              <div>
                <label
                  htmlFor="target-language-select"
                  className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"
                >
                  Target Language
                </label>
                <DarkSelect
                  id="target-language-select"
                  value={targetLang}
                  onChange={setTargetLang}
                  placeholder="Select language..."
                  options={TARGET_LANGUAGES.map((l) => ({
                    value: l.value,
                    label: `${l.flag} ${l.label}`,
                  }))}
                />
              </div>
            </div>

            {/* Quick-pick target language badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {TARGET_LANGUAGES.slice(0, 7).map((lang) => (
                <button
                  key={lang.value}
                  id={`lang-badge-${lang.value}`}
                  onClick={() => setTargetLang(lang.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                    targetLang === lang.value
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Advanced Options Accordion */}
            <div className="mt-4 bg-slate-800/40 border border-white/8 rounded-xl overflow-hidden">
              <button
                id="advanced-options-toggle"
                onClick={() => setAdvancedOpen((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-150"
              >
                <span className="flex items-center gap-2">
                  <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
                  Advanced Options
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-500 transition-transform duration-200",
                    advancedOpen && "rotate-180"
                  )}
                />
              </button>

              {advancedOpen && (
                <div className="px-4 pb-2 border-t border-white/8 divide-y divide-white/5">
                  <ToggleRow
                    id="toggle-lip-sync"
                    icon={Wand2}
                    label="Enable Visual Lip Sync"
                    description="Synchronize speaker lip movements with translated audio (via HeyGen)"
                    checked={advanced.lipSyncEnabled}
                    onCheckedChange={(v) =>
                      setAdvanced((p) => ({ ...p, lipSyncEnabled: v }))
                    }
                  />
                  <ToggleRow
                    id="toggle-dynamic-duration"
                    icon={Clock4}
                    label="Dynamic Audio Duration"
                    description="Speed up or slow down to match target speech cadence"
                    checked={advanced.dynamicDuration}
                    onCheckedChange={(v) =>
                      setAdvanced((p) => ({ ...p, dynamicDuration: v }))
                    }
                  />
                  <ToggleRow
                    id="toggle-remove-noise"
                    icon={Volume2}
                    label="Remove Background Noise"
                    description="Isolate vocal stems before translation"
                    checked={advanced.removeNoise}
                    onCheckedChange={(v) =>
                      setAdvanced((p) => ({ ...p, removeNoise: v }))
                    }
                  />
                  <ToggleRow
                    id="toggle-auto-subtitles"
                    icon={Subtitles}
                    label="Auto-Generate Subtitles"
                    description="Export an .SRT subtitle file alongside the video"
                    checked={advanced.autoSubtitles}
                    onCheckedChange={(v) =>
                      setAdvanced((p) => ({ ...p, autoSubtitles: v }))
                    }
                  />
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              STEP 3 — CREDIT ESTIMATE + ACTIONS
          ══════════════════════════════════════════════════════ */}
          <section>
            {/* Credit banner */}
            <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-slate-300">
                  Estimated Cost:{" "}
                  <span className="font-bold text-white">2 Credits</span>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Available:{" "}
                <span className="font-semibold text-indigo-400">340</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {/* 1-Click Translate (Primary) */}
              <button
                id="btn-one-click-translate"
                disabled={!isReady || isProcessing}
                onClick={handleOneClickTranslate}
                className={cn(
                  "flex-1 relative overflow-hidden flex items-center justify-center gap-2.5",
                  "px-5 py-3.5 rounded-xl text-sm font-bold text-white",
                  "bg-gradient-to-r from-indigo-600 to-teal-500",
                  "shadow-lg shadow-indigo-500/30",
                  "transition-all duration-200",
                  isReady
                    ? "hover:from-indigo-700 hover:to-teal-600 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                1-Click Translate
              </button>

              {/* Proofread Script (Secondary) */}
              <button
                id="btn-proofread-script"
                disabled={!isReady || isProcessing}
                onClick={handleProofreadScript}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2.5",
                  "px-5 py-3.5 rounded-xl text-sm font-semibold",
                  "border border-white/15 bg-white/5 text-slate-300",
                  "transition-all duration-200",
                  isReady
                    ? "hover:bg-white/10 hover:text-white hover:border-white/25 hover:scale-[1.02] active:scale-[0.98]"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileEdit className="h-4 w-4" />
                )}
                Proofread Script
              </button>
            </div>

            {!isReady && (
              <p className="text-center text-xs text-slate-500 mt-3">
                {!hasInput
                  ? activeTab === "upload"
                    ? "Upload a video file to continue"
                    : "Paste a public URL to continue"
                  : "Select a target language to continue"}
              </p>
            )}

            {/* Language summary pill */}
            {isReady && targetLangObj && (
              <p className="text-center text-xs text-slate-500 mt-3">
                Translating to{" "}
                <span className="text-indigo-400 font-semibold">
                  {targetLangObj.flag} {targetLangObj.label}
                </span>{" "}
                using Sarvam AI + HeyGen lip-sync
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
