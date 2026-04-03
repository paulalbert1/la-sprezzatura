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

export function StepUpload({ images, onImagesChange }: StepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  // Mutable ref to track latest images state across async upload iterations
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount = imagesRef.current.length;

      // Create placeholders
      const placeholders: WizardImage[] = fileArray.map((file, i) => {
        const idx = currentCount + i;
        return {
          blobPathname: "",
          fileName: file.name,
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
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob-upload",
          });
          const latest = [...imagesRef.current];
          latest[placeholderIndex] = {
            ...latest[placeholderIndex],
            blobPathname: blob.pathname,
            uploading: false,
            error: undefined,
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
    [onImagesChange],
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
              <Text size={0} muted style={{ marginTop: 4, textAlign: "center" }}>
                {img.fileName.length > 16
                  ? `${img.fileName.slice(0, 13)}...`
                  : img.fileName}
              </Text>
            </Card>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
