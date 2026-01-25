"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setShowSuccess(false);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          setShowSuccess(true);
          onUploadComplete();
          setTimeout(() => setShowSuccess(false), 2000);
        }
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [onUploadComplete]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  return (
    <div
      className="relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <button
        className={`p-2 rounded-lg transition-colors ${
          showSuccess
            ? "text-green-400 bg-green-500/10"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
        title="Upload CSV"
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : showSuccess ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
