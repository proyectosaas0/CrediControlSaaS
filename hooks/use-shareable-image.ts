import { useState } from "react";
import { canvasToBlob } from "@/lib/domain/receipt-canvas";
import { toast } from "sonner";

export function useShareableImage() {
  const [busy, setBusy] = useState<"share" | "download" | null>(null);

  async function toFile(canvas: HTMLCanvasElement, filename: string) {
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("No se pudo generar la imagen");
    return new File([blob], filename, { type: "image/png" });
  }

  function canShareFiles(file: File) {
    return (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator &&
      navigator.canShare({ files: [file] })
    );
  }

  async function share(canvas: HTMLCanvasElement, filename: string, title: string) {
    setBusy("share");
    try {
      const file = await toFile(canvas, filename);
      if (canShareFiles(file)) {
        await navigator.share({ files: [file], title });
      } else {
        await download(canvas, filename);
        toast.info("Tu navegador no permite compartir directo, se descargó la imagen");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("No se pudo compartir la imagen");
    } finally {
      setBusy(null);
    }
  }

  async function download(canvas: HTMLCanvasElement, filename: string) {
    setBusy("download");
    try {
      const file = await toFile(canvas, filename);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar la imagen");
    } finally {
      setBusy(null);
    }
  }

  return { share, download, busy };
}
