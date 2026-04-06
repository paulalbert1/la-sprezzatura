import { useCallback, useRef, useState } from "react";
import { Stack, Text, Button, Flex, Spinner, Card } from "@sanity/ui";
import { DocumentIcon } from "@sanity/icons";
import { set, unset, type StringInputProps } from "sanity";
import { upload } from "@vercel/blob/client";

type UploadState = "idle" | "uploading" | "error";

export function BlobFileInput(props: StringInputProps) {
  const { onChange, value } = props;
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadState("uploading");
      setErrorMessage("");

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        onChange(set(blob.pathname));
        setUploadState("idle");
      } catch (err: any) {
        setErrorMessage(err.message || "Upload failed");
        setUploadState("error");
      }

      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onChange],
  );

  const handleRemove = useCallback(() => {
    onChange(unset());
    // Note: does NOT delete blob from Vercel Blob (orphan cleanup is future concern)
  }, [onChange]);

  const handleRetry = useCallback(() => {
    setUploadState("idle");
    setErrorMessage("");
  }, []);

  const isImageFile = (pathname: string): boolean => {
    const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
    return ["jpg", "jpeg", "png", "webp"].includes(ext);
  };

  const getServeUrl = (pathname: string): string => {
    const token = (import.meta as any).env?.SANITY_STUDIO_API_SECRET || "";
    return `/api/blob-serve?path=${encodeURIComponent(pathname)}&source=studio&token=${encodeURIComponent(token)}`;
  };

  // Uploaded state: show thumbnail/icon and remove button
  if (value) {
    const filename = value.split("/").pop() || value;
    const displayName =
      filename.length > 40 ? `${filename.slice(0, 37)}...` : filename;
    const serveUrl = getServeUrl(value);
    const isImage = isImageFile(value);

    return (
      <Stack space={3}>
        <Flex gap={3} align="center">
          {isImage ? (
            <a
              href={serveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0 }}
            >
              <img
                src={serveUrl}
                alt={filename}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 4,
                  display: "block",
                }}
              />
            </a>
          ) : (
            <a
              href={serveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
            >
              <DocumentIcon style={{ fontSize: 24 }} />
            </a>
          )}
          <Flex direction="column" gap={2} style={{ minWidth: 0 }}>
            <Text size={1}>{displayName}</Text>
            <Button
              text="Remove"
              tone="critical"
              mode="ghost"
              fontSize={1}
              onClick={handleRemove}
            />
          </Flex>
        </Flex>
      </Stack>
    );
  }

  // Uploading state
  if (uploadState === "uploading") {
    return (
      <Stack space={3}>
        <Flex gap={2} align="center">
          <Spinner muted />
          <Text size={1}>Uploading...</Text>
        </Flex>
      </Stack>
    );
  }

  // Error state
  if (uploadState === "error") {
    return (
      <Stack space={3}>
        <Card tone="critical" padding={3} radius={2}>
          <Text size={1}>Upload failed: {errorMessage}</Text>
        </Card>
        <Button text="Try Again" mode="ghost" fontSize={1} onClick={handleRetry} />
      </Stack>
    );
  }

  // Idle state: file picker
  return (
    <Stack space={3}>
      <Flex gap={2}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <Button
          text="Choose File"
          mode="ghost"
          onClick={() => fileInputRef.current?.click()}
        />
      </Flex>
      <Text size={1} muted>
        Upload a PDF, JPEG, PNG, or WebP file
      </Text>
    </Stack>
  );
}
