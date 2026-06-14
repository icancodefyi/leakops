"use client";

import { useRef, useState } from "react";

type DropZoneProps = {
  file: File | null;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  label?: string;
  compact?: boolean;
};

export function DropZone({
  file,
  preview,
  onFile,
  onClear,
  label = "Drag and drop your image here",
  compact = false,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const nextFile = event.dataTransfer.files[0];
        if (nextFile) onFile(nextFile);
      }}
      onClick={() => {
        if (!file) inputRef.current?.click();
      }}
      className={`relative w-full rounded-2xl border-2 border-dashed transition-all ${
        dragging
          ? "border-rose-400 bg-rose-50"
          : file
            ? "border-[#e8e4de] bg-white"
            : "cursor-pointer border-[#d4cfc9] bg-white hover:border-[#0a0a0a] hover:bg-[#fafaf8]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) onFile(nextFile);
        }}
      />

      {file && preview ? (
        <div className={`flex items-start gap-4 ${compact ? "p-4" : "p-6"}`} onClick={(event) => event.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Upload preview"
            className={`shrink-0 rounded-xl border border-[#e8e4de] object-cover ${compact ? "h-16 w-16" : "h-24 w-24"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#0a0a0a]">{file.name}</p>
            <p className="mt-0.5 text-[12px] text-[#9ca3af]">
              {(file.size / 1024).toFixed(0)} KB - {(file.type.split("/")[1] || "image").toUpperCase()}
            </p>
            <button type="button" onClick={onClear} className="mt-2 text-[12px] text-red-500 transition-colors hover:text-red-700">
              Remove
            </button>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg width="10" height="10" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "gap-2 py-12" : "gap-3 py-16"}`}>
          {!compact && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e8e4de] bg-[#fafaf8]">
              <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {compact && (
            <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div>
            <p className="text-[14px] font-medium text-[#374151]">{dragging ? "Drop to upload" : label}</p>
            {!compact && <p className="mt-1 text-[12px] text-[#9ca3af]">or click to browse files</p>}
          </div>
          <p className="font-mono text-[11px] text-[#c4bdb5]">{compact ? "JPG - PNG - WEBP" : "JPG - PNG - WEBP - MAX 10 MB"}</p>
        </div>
      )}
    </div>
  );
}
