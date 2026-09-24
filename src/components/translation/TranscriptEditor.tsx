"use client";

import { useRef, useState, useEffect } from "react";
import { Play, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface TranscriptBlock {
  id: string;
  startTime: string;     // "MM:SS"
  endTime: string;       // "MM:SS"
  startSeconds: number;  // For seek
  text: string;
  translatedText: string;
}

interface TranscriptEditorProps {
  blocks: TranscriptBlock[];
  sourceLanguage: string;
  targetLanguage: string;
  activeBlockId?: string;
  onBlockSeek: (blockId: string, startSeconds: number) => void;
  onTextChange: (blockId: string, newText: string) => void;
}

/* ─── Auto-resize textarea hook ─────────────────────────────────────────── */
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return ref;
}

/* ─── Single block component ─────────────────────────────────────────────── */
function BlockRow({
  block,
  isActive,
  onSeek,
  onTextChange,
}: {
  block: TranscriptBlock;
  isActive: boolean;
  onSeek: (startSeconds: number) => void;
  onTextChange: (newText: string) => void;
}) {
  const [value, setValue] = useState(block.translatedText);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useAutoResize(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setIsDirty(true);
    onTextChange(e.target.value);
  };

  // Simulate auto-save feedback
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => setIsDirty(false), 1800);
    return () => clearTimeout(timer);
  }, [isDirty, value]);

  return (
    <div
      id={`block-${block.id}`}
      className={cn(
        "group rounded-xl border transition-all duration-200 overflow-hidden",
        isActive
          ? "border-indigo-300 bg-indigo-50/60 shadow-sm shadow-indigo-100"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      )}
    >
      {/* Block header */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 border-b",
          isActive ? "border-indigo-200/60 bg-indigo-50/50" : "border-slate-100"
        )}
      >
        {/* Seek button */}
        <button
          id={`seek-btn-${block.id}`}
          onClick={() => onSeek(block.startSeconds)}
          aria-label={`Jump to ${block.startTime}`}
          className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all",
            isActive
              ? "bg-indigo-500 text-white"
              : "bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600"
          )}
        >
          <Play className="h-3 w-3 ml-0.5" fill="currentColor" />
        </button>

        {/* Timestamp badge */}
        <div className="flex items-center gap-1">
          <Clock
            className={cn(
              "h-3 w-3 flex-shrink-0",
              isActive ? "text-indigo-500" : "text-slate-400"
            )}
          />
          <span
            className={cn(
              "text-xs font-mono font-semibold",
              isActive ? "text-indigo-600" : "text-slate-500"
            )}
          >
            {block.startTime}
          </span>
          <span className="text-[10px] text-slate-300 mx-0.5">→</span>
          <span
            className={cn(
              "text-xs font-mono font-semibold",
              isActive ? "text-indigo-600" : "text-slate-500"
            )}
          >
            {block.endTime}
          </span>
        </div>

        {/* Dirty / saved indicator */}
        <div className="ml-auto">
          {isDirty ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
              <AlertCircle className="h-3 w-3" />
              Editing…
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-teal-500 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Source text */}
      <div className="px-4 pt-2.5 pb-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5">
          Original
        </p>
        <p className="text-sm text-slate-500 leading-relaxed italic">{block.text}</p>
      </div>

      {/* Editable translation */}
      <div className="px-4 pt-2 pb-3">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-wider mb-1.5",
            isActive ? "text-indigo-500" : "text-slate-400"
          )}
        >
          Translation
        </p>
        <textarea
          id={`textarea-${block.id}`}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          rows={2}
          className={cn(
            "w-full resize-none text-sm leading-relaxed bg-transparent outline-none",
            "border-b border-transparent transition-all duration-150",
            "placeholder:text-slate-300",
            isActive
              ? "text-slate-800 border-b-indigo-300 focus:border-b-indigo-500"
              : "text-slate-700 focus:border-b-indigo-400",
            "focus:ring-0"
          )}
          placeholder="Enter translation…"
          aria-label={`Translation for block at ${block.startTime}`}
        />
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export function TranscriptEditor({
  blocks,
  sourceLanguage,
  targetLanguage,
  activeBlockId,
  onBlockSeek,
  onTextChange,
}: TranscriptEditorProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Sticky header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Edit Transcript</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">{sourceLanguage}</span>
              <span className="text-slate-300">→</span>
              <span className="font-semibold text-indigo-600">{targetLanguage}</span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-500 font-medium">Auto-saved</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            {blocks.length} segments
          </div>
        </div>
      </div>

      {/* Scrollable blocks list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            isActive={block.id === activeBlockId}
            onSeek={(secs) => onBlockSeek(block.id, secs)}
            onTextChange={(text) => onTextChange(block.id, text)}
          />
        ))}
      </div>
    </div>
  );
}
