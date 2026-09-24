"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Clock,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  FileText,
  Globe,
  Edit2,
  Download,
  Link as LinkIcon,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProjectStatus = "completed" | "processing" | "draft" | "uploading" | "failed";

export interface Project {
  id: string;
  title: string;
  thumbnailGradient: string;
  thumbnailIcon: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: ProjectStatus;
  duration: string;
  createdAt: string;
  progress?: number;
  videoUrl?: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "completed" | "processing" | "draft";
    icon: React.ElementType;
    iconClass: string;
  }
> = {
  completed: {
    label: "Completed",
    variant: "completed",
    icon: CheckCircle2,
    iconClass: "text-teal-500",
  },
  processing: {
    label: "Processing",
    variant: "processing",
    icon: Loader2,
    iconClass: "text-amber-500 animate-spin",
  },
  draft: {
    label: "Draft",
    variant: "draft",
    icon: FileText,
    iconClass: "text-slate-400",
  },
  // API-set statuses
  uploading: {
    label: "Uploading",
    variant: "processing",
    icon: Upload,
    iconClass: "text-indigo-400 animate-pulse",
  },
  failed: {
    label: "Failed",
    variant: "draft",
    icon: XCircle,
    iconClass: "text-red-500",
  },
};

const FALLBACK_STATUS = {
  label: "Processing",
  variant: "processing" as const,
  icon: Loader2,
  iconClass: "text-amber-500 animate-spin",
};

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localProgress, setLocalProgress] = useState(project.progress || 0);
  const status = statusConfig[project.status] ?? FALLBACK_STATUS;
  const StatusIcon = status.icon;

  // Simulate progress bar animation for demo purposes
  useEffect(() => {
    if (project.progress !== undefined) {
      setLocalProgress(project.progress);
    }
  }, [project.progress]);

  useEffect(() => {
    if (project.status === "processing") {
      const interval = setInterval(() => {
        setLocalProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            return 98;
          }
          return Math.min(98, prev + Math.floor(Math.random() * 5) + 2);
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [project.status]);

  const handleCardClick = () => {
    if (project.status === "completed") {
      if (project.videoUrl) {
        window.open(project.videoUrl, "_blank");
      }
    } else if (project.status === "draft") {
      const qs = project.videoUrl ? `?videoUrl=${encodeURIComponent(project.videoUrl)}` : "";
      router.push(`/translate/${project.id}/proofread${qs}`);
    }
  };

  const handleMenuAction = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setDropdownOpen(false);
    if (action === "edit") {
      const qs = project.videoUrl ? `?videoUrl=${encodeURIComponent(project.videoUrl)}` : "";
      router.push(`/translate/${project.id}/proofread${qs}`);
    } else if (action === "delete") {
      if (confirm("Are you sure you want to delete this project?")) {
        try {
          const res = await fetch(`/api/translate/delete?id=${project.id}`, { method: "DELETE" });
          if (res.ok && onDelete) {
            onDelete(project.id);
          }
        } catch (e) {
          console.error("Failed to delete", e);
        }
      }
    } else if (action === "download") {
      if (project.videoUrl) window.open(project.videoUrl, "_blank");
    } else if (action === "share") {
      if (project.videoUrl) {
        navigator.clipboard.writeText(project.videoUrl);
        alert("Link copied to clipboard!");
      }
    }
  };

  return (
    <Card
      id={`project-card-${project.id}`}
      className="overflow-hidden group cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative h-44 w-full overflow-hidden",
          project.thumbnailGradient
        )}
      >
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        />

        {/* Emoji icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl opacity-80 drop-shadow-lg select-none">
            {project.thumbnailIcon}
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <Clock className="h-3 w-3 text-white/80" />
          <span className="text-xs font-medium text-white/90">{project.duration}</span>
        </div>

        {/* Hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
          <div className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-5 w-5 text-indigo-600 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* More options button */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <button
            aria-label="More options"
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
            className="h-7 w-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/50 text-white"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); }}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30">
                <button onClick={(e) => handleMenuAction(e, 'edit')} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                  <Edit2 className="mr-2 h-4 w-4" /> Open in Editor
                </button>
                <button onClick={(e) => handleMenuAction(e, 'download')} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                  <Download className="mr-2 h-4 w-4" /> Download MP4
                </button>
                <button onClick={(e) => handleMenuAction(e, 'share')} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy Share Link
                </button>
                <button onClick={(e) => handleMenuAction(e, 'delete')} className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-slate-100 transition-colors">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1 flex-1">
            {project.title}
          </h3>
          <Badge variant={status.variant} className="flex-shrink-0 gap-1">
            <StatusIcon className={cn("h-3 w-3", status.iconClass)} />
            {status.label}
          </Badge>
        </div>

        {/* Language route */}
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] py-0 px-2">
              {project.sourceLanguage}
            </Badge>
            <span className="text-slate-300 text-xs">→</span>
            <Badge variant="language" className="text-[10px] py-0 px-2">
              {project.targetLanguage}
            </Badge>
          </div>
        </div>

        {/* Progress bar for processing items */}
        {project.status === "processing" && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 font-medium">Translating...</span>
              <span className="text-[10px] text-amber-600 font-semibold">{localProgress}%</span>
            </div>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${localProgress}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-3">{project.createdAt}</p>
      </CardContent>
    </Card>
  );
}
