"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { downloadTryOnCapture } from "@/lib/tryon/capture";
import { enabledGlassesItems } from "@/lib/tryon/glassesData";
import { enabledModelFaces } from "@/lib/tryon/modelFaces";
import { GlassesSelector } from "./GlassesSelector";
import { ModelSelector } from "./ModelSelector";
import { TryOnPreview } from "./TryOnPreview";

export function TryOnPage() {
  const [selectedModelId, setSelectedModelId] = useState(
    enabledModelFaces[0]?.id ?? "",
  );
  const [selectedGlassesId, setSelectedGlassesId] = useState(
    enabledGlassesItems[0]?.id ?? "",
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const selectedModel = useMemo(
    () =>
      enabledModelFaces.find((model) => model.id === selectedModelId) ??
      enabledModelFaces[0],
    [selectedModelId],
  );
  const selectedGlasses = useMemo(
    () =>
      enabledGlassesItems.find((glasses) => glasses.id === selectedGlassesId) ??
      enabledGlassesItems[0],
    [selectedGlassesId],
  );
  const canDownload =
    selectedModel !== undefined &&
    selectedGlasses !== undefined &&
    isDownloading === false;

  const handleDownload = async () => {
    if (
      selectedModel === undefined ||
      selectedGlasses === undefined ||
      isDownloading === true
    ) {
      return;
    }

    setIsDownloading(true);

    try {
      const filename = await downloadTryOnCapture(selectedModel, selectedGlasses);

      toast.success("Try-on image downloaded", {
        caption: filename,
        duration: 3200,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not create the try-on image.";

      toast.error("Unable to download image", {
        description: message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-5.5rem)] bg-[#f4f3ef] px-4 py-5 text-black md:px-6">
      <div className="mx-auto grid w-full max-w-[118rem] gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="grid min-h-[calc(100svh-8.5rem)] min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col justify-between gap-5 border-b border-black/10 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <div className="min-w-0">
              <p className="font-afacad text-xs uppercase tracking-[0.28em] text-black/45">
                Season Try-On
              </p>
              <h1 className="mt-3 max-w-full text-wrap font-seesans text-[42px] font-normal uppercase leading-[0.95] tracking-[0.04em] text-black md:text-[50px] lg:text-[52px] xl:text-[54px]">
                <span className="block">Virtual</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Button
                type="button"
                variant="outline"
                disabled={canDownload === false}
                className="h-11 w-fit rounded-lg border-black/15 bg-white/88 px-4 font-afacad text-xs uppercase tracking-[0.18em] text-black shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-black/35 hover:bg-white active:translate-y-0 disabled:bg-white/70 disabled:text-black/38 disabled:hover:translate-y-0 lg:w-full"
                onClick={() => {
                  void handleDownload();
                }}
              >
                {isDownloading === true ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isDownloading === true ? "Saving" : "Download"}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 items-center justify-center">
            {selectedModel !== undefined && selectedGlasses !== undefined ? (
              <TryOnPreview
                modelFace={selectedModel}
                glasses={selectedGlasses}
                showDebug={false}
              />
            ) : (
              <div className="flex min-h-96 w-full items-center justify-center rounded-lg border border-dashed border-black/18 bg-white px-6 text-center font-afacad text-sm text-black/45">
                Try-on assets are not ready yet.
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-6 overflow-y-auto rounded-lg border border-black/10 bg-[#ebe9e1] p-4 shadow-[0_18px_60px_rgba(43,38,30,0.08)] md:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100svh-8.5rem)] lg:self-start">
          <ModelSelector
            models={enabledModelFaces}
            selectedModelId={selectedModel?.id ?? ""}
            onSelectModel={setSelectedModelId}
          />
          <div className="h-px bg-black/10" />
          <GlassesSelector
            glassesItems={enabledGlassesItems}
            selectedGlassesId={selectedGlasses?.id ?? ""}
            onSelectGlasses={setSelectedGlassesId}
          />
        </aside>
      </div>
    </main>
  );
}
