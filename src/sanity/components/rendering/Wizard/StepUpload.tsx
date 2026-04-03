import { useRef, useCallback, useState } from "react";
import { Stack, Card, Grid, Text, Spinner } from "@sanity/ui";
import { UploadIcon, CloseIcon, ErrorOutlineIcon } from "@sanity/icons";
import { upload } from "@vercel/blob/client";
import type { WizardImage } from "../types";
import { getImageServeUrl } from "../types";

interface StepUploadProps {
  images: WizardImage[];
  onImagesChange: (images: WizardImage[]) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const SERVER_UPLOAD_LIMIT = 4.5 * 1024 * 1024; // 4.5MB -- Vercel Functions body limit

export function StepUpload({ images, onImagesChange }: StepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  // Mutable ref to track latest images state across async upload iterations
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const uploadFile = useCallback(async (file: File): Promise<{ pathname: string }> => {
    if (file.size <= SERVER_UPLOAD_LIMIT) {
      // Server-side upload -- reliable on localhost and production, no CORS issues
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/blob-upload", { method: "PUT", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errData.error || "Upload failed");
      }
      return res.json();
    } else {
      // Client-side upload for large files (>4.5MB) -- direct to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      return { pathname: blob.pathname };
    }
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount = imagesRef.current.length;

      // Create placeholders
      const placeholders: WizardImage[] = fileArray.map((f, i) => {
        const idx = currentCount + i;
        return {
          blobPathname: "",
          fileName: f.name,
          file: f,  // Retain File object for retry capability
          imageType: idx === 0 && currentCount === 0 ? "Floor Plan" : "Existing Space Photo",
          location: "",
          notes: "",
          copyExact: idx === 0 && currentCount === 0,
          uploading: true,
          error: undefined,
        };
      });

      const updatedImages = [...imagesRef.current, ...placeholders];
      onImagesChange(updatedImages);

      // Upload each file sequentially, reading latest state via ref
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const placeholderIndex = currentCount + i;

        // File size check
        if (file.size > MAX_FILE_SIZE) {
          const latest = [...imagesRef.current];
          latest[placeholderIndex] = {
            ...latest[placeholderIndex],
            uploading: false,
            error: "File exceeds 20MB limit",
          };
          onImagesChange(latest);
          continue;
        }

        try {
          const result = await uploadFile(file);
          const latest = [...imagesRef.current];
          latest[placeholderIndex] = {
            ...latest[placeholderIndex],
            blobPathname: result.pathname,
            uploading: false,
            error: undefined,
            file: undefined,  // Clear File reference after successful upload
          };
          onImagesChange(latest);
        } catch {
          const latest = [...imagesRef.current];
          latest[placeholderIndex] = {
            ...latest[placeholderIndex],
            uploading: false,
            error: "Upload failed",
          };
          onImagesChange(latest);
        }
      }
    },
    [onImagesChange, uploadFile],
  );

  const retryUpload = useCallback(
    async (index: number) => {
      const img = imagesRef.current[index];
      if (!img?.file) return;

      // Mark as uploading
      const latest = [...imagesRef.current];
      latest[index] = { ...latest[index], uploading: true, error: undefined };
      onImagesChange(latest);

      try {
        const result = await uploadFile(img.file);
        const updated = [...imagesRef.current];
        updated[index] = {
          ...updated[index],
          blobPathname: result.pathname,
          uploading: false,
          error: undefined,
          file: undefined,  // Clear File reference after success
        };
        onImagesChange(updated);
      } catch {
        const updated = [...imagesRef.current];
        updated[index] = {
          ...updated[index],
          uploading: false,
          error: "Upload failed",
        };
        onImagesChange(updated);
      }
    },
    [onImagesChange, uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFiles],
  );

  const removeImage = useCallback(
    (index: number) => {
      onImagesChange(images.filter((_, i) => i !== index));
    },
    [images, onImagesChange],
  );

  return (
    <Stack space={4}>
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? "#C4836A" : "#B8B0A4"}`,
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        <UploadIcon style={{ fontSize: 32, opacity: 0.5 }} />
        <Text size={2} style={{ marginTop: 8 }}>
          Drag &amp; drop files or click to browse
        </Text>
        <Text size={1} muted style={{ marginTop: 4 }}>
          JPG, PNG, WebP, HEIC, PDF -- up to 20MB each
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {/* Soft hint at 7+ images */}
      {images.length >= 7 && (
        <Card tone="caution" padding={3}>
          <Text size={1}>
            Lots of references! The AI works best with 3-6 focused images.
          </Text>
        </Card>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <Grid columns={[2, 3, 4]} gap={3}>
          {images.map((img, idx) => (
            <Card key={`${img.fileName}-${idx}`} padding={2} radius={2} border>
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
                {img.uploading ? (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Spinner muted />
                  </div>
                ) : img.error ? (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ErrorOutlineIcon style={{ fontSize: 24, color: "#dc3545" }} />
                    <Text size={0} style={{ color: "#dc3545", marginTop: 4 }}>
                      {img.error}
                    </Text>
                    {img.file && (
                      <button
                        onClick={(e) => { e.stopPropagation(); retryUpload(idx); }}
                        style={{
                          marginTop: 4,
                          padding: "2px 8px",
                          fontSize: 11,
                          border: "1px solid #dc3545",
                          borderRadius: 4,
                          background: "transparent",
                          color: "#dc3545",
                          cursor: "pointer",
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (
                  <img
                    src={getImageServeUrl(img.blobPathname, "studio")}
                    alt={img.fileName}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                )}
                {!img.uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    title="Remove image"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "none",
                      background: "#666",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      fontSize: 12,
                    }}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              <div
                title={img.fileName}
                style={{
                  marginTop: 4,
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 120,
                  margin: "4px auto 0",
                }}
              >
                <Text size={0} muted>
                  {img.fileName}
                </Text>
              </div>
            </Card>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
