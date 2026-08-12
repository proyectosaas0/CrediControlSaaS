"use client";

import { useMemo } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { renderReceiptCanvas, type ReceiptData } from "@/lib/domain/receipt-canvas";
import { useShareableImage } from "@/hooks/use-shareable-image";
import { Download, Loader2, Share2 } from "lucide-react";

type ReceiptDialogProps = {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
  filename: string;
};

export function ReceiptDialog({ open, onClose, data, filename }: ReceiptDialogProps) {
  const { share, download, busy } = useShareableImage();

  const canvas = useMemo(() => {
    if (!open || !data) return null;
    return renderReceiptCanvas(data);
  }, [open, data]);

  const previewUrl = useMemo(() => canvas?.toDataURL("image/png") ?? null, [canvas]);

  return (
    <Dialog open={open} onClose={onClose} title={data?.titulo ?? "Comprobante"}>
      <div className="space-y-4">
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-muted/30 p-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Vista previa del comprobante" className="w-full rounded-lg" />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Generando...
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            disabled={!canvas || busy !== null}
            onClick={() => canvas && download(canvas, filename)}
          >
            {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar
          </Button>
          <Button
            className="flex-1 gap-1.5"
            disabled={!canvas || busy !== null}
            onClick={() => canvas && share(canvas, filename, data?.titulo ?? "Comprobante")}
          >
            {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
