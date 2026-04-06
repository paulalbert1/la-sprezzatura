import { useState, useEffect } from "react";
import { type DocumentActionProps, useClient } from "sanity";
import { Grid, Card, Flex, Button, Text, Stack, Spinner } from "@sanity/ui";
import { StarFilledIcon } from "@sanity/icons";
import imageUrlBuilder from "@sanity/image-url";
import { buildPortfolioPayload } from "../../lib/portfolioSpawn";

export function SpawnPortfolioAction(props: DocumentActionProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"ask" | "select" | "creating">("ask");
  const [alreadyExists, setAlreadyExists] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = imageUrlBuilder(client);
  const doc = props.draft || props.published;

  // Duplicate check (D-02): hide button if portfolio already exists for this admin project
  useEffect(() => {
    if (doc?._id) {
      const cleanId = (doc._id as string).replace(/^drafts\./, "");
      client
        .fetch(
          `count(*[_type == "portfolioProject" && sourceAdminProject._ref == $id]) > 0`,
          { id: cleanId },
        )
        .then(setAlreadyExists);
    }
  }, [doc?._id, client]);

  // Visibility gates (D-01, D-02)
  if (props.type !== "project") return null;
  if (doc?.projectStatus !== "completed") return null;
  if (alreadyExists === null) return null; // hide while loading (prevents button flash - Research Pitfall 2)
  if (alreadyExists === true) return null;

  // Build combined image array: hero first, then gallery
  const heroImg = doc?.heroImage as Record<string, any> | undefined;
  const galleryImgs = (doc?.images as any[]) || [];
  const allImages = heroImg ? [heroImg, ...galleryImgs] : [...galleryImgs];

  function toggleImage(idx: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }

  function selectAll() {
    setSelected(allImages.map(() => true));
  }

  function selectNone() {
    setSelected(allImages.map(() => false));
  }

  function thumbnailUrl(img: any): string {
    return builder
      .image(img)
      .width(150)
      .height(150)
      .fit("crop")
      .auto("format")
      .url();
  }

  function handleCreateWithoutPhotos() {
    setStep("creating");
    createPortfolio([]);
  }

  function handleCreateWithSelectedImages() {
    const selectedImgs = allImages.filter((_, i) => selected[i]);
    setStep("creating");
    createPortfolio(selectedImgs);
  }

  async function createPortfolio(selectedImages: Record<string, any>[]) {
    setStep("creating");
    setError(null);
    try {
      const cleanId = (doc!._id as string).replace(/^drafts\./, "");
      const payload = buildPortfolioPayload(
        { ...doc, _id: cleanId },
        selectedImages,
      );
      const newDoc = await client.create(payload);
      // Navigate to the new portfolio project document
      window.location.href = `/admin/structure/portfolioProject;${newDoc._id}`;
    } catch (err) {
      console.error("Failed to create portfolio version:", err);
      setError("Something went wrong. Please try again.");
      setStep("select"); // go back to selection so user can retry
    }
  }

  // Render the step-based dialog content
  function renderDialogContent() {
    // Error banner (shown above any step content on error)
    const errorBanner = error ? (
      <Card padding={3} radius={2} tone="critical" marginBottom={4}>
        <Stack space={2}>
          <Text size={2} weight="semibold">
            Unable to create portfolio version
          </Text>
          <Text size={1} muted>
            Something went wrong. Please try again.
          </Text>
        </Stack>
      </Card>
    ) : null;

    if (step === "ask") {
      return (
        <Stack space={4} padding={4}>
          <Text size={2}>
            Has this project been professionally photographed?
          </Text>
          <Flex gap={3} justify="flex-end">
            <Button
              text="No, create without photos"
              mode="ghost"
              tone="default"
              onClick={handleCreateWithoutPhotos}
            />
            <Button
              text="Yes, select photos"
              tone="positive"
              onClick={() => {
                setSelected(allImages.map(() => true));
                setStep("select");
              }}
            />
          </Flex>
        </Stack>
      );
    }

    if (step === "select") {
      return (
        <Stack space={4} padding={4}>
          {errorBanner}

          <Flex justify="space-between" align="center">
            <Text size={2} weight="semibold">
              Select images to include
            </Text>
            <Flex gap={2}>
              <Button
                text="Select All"
                mode="bleed"
                fontSize={1}
                padding={2}
                onClick={selectAll}
              />
              <Button
                text="Select None"
                mode="bleed"
                fontSize={1}
                padding={2}
                onClick={selectNone}
              />
            </Flex>
          </Flex>

          {allImages.length === 0 ? (
            <Text size={2} muted>
              No images found on this project. The portfolio version will be
              created without photos.
            </Text>
          ) : (
            <Grid columns={[2, 3, 4]} gap={3}>
              {allImages.map((img, idx) => (
                <Card
                  key={idx}
                  padding={2}
                  radius={2}
                  border
                  tone={selected[idx] ? "primary" : "default"}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleImage(idx)}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={thumbnailUrl(img)}
                      alt={
                        img.alt ||
                        (idx === 0 ? "Hero image" : `Photo ${idx}`)
                      }
                      style={{
                        width: "100%",
                        borderRadius: 4,
                        aspectRatio: "1",
                        objectFit: "cover",
                      }}
                    />
                    {idx === 0 && (
                      <StarFilledIcon
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          color: "#D97706",
                          fontSize: 20,
                        }}
                      />
                    )}
                  </div>
                  <Flex align="center" gap={2} marginTop={2}>
                    <input
                      type="checkbox"
                      checked={selected[idx] || false}
                      onChange={() => toggleImage(idx)}
                    />
                    <Text size={0}>
                      {idx === 0 ? "Hero" : `Photo ${idx}`}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>
          )}

          <Flex gap={3} justify="flex-end">
            <Button
              text="Cancel Creation"
              mode="ghost"
              onClick={() => {
                setDialogOpen(false);
                setStep("ask");
              }}
            />
            <Button
              text="Create Portfolio Version"
              tone="positive"
              onClick={handleCreateWithSelectedImages}
            />
          </Flex>
        </Stack>
      );
    }

    // step === "creating"
    return (
      <Stack space={3} padding={4} style={{ textAlign: "center" }}>
        <Flex justify="center">
          <Spinner />
        </Flex>
        <Text size={2} muted>
          Creating portfolio version...
        </Text>
      </Stack>
    );
  }

  return {
    label: "Create Portfolio Version",
    tone: "positive" as const,
    onHandle: () => {
      setStep("ask");
      setError(null);
      setDialogOpen(true);
    },
    dialog: isDialogOpen
      ? {
          type: "dialog" as const,
          onClose: () => {
            setDialogOpen(false);
            setStep("ask");
            setError(null);
          },
          header: "Create Portfolio Version",
          content: renderDialogContent(),
        }
      : undefined,
  };
}
