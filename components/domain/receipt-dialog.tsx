"use client";

import { useMemo } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { renderReceiptCanvas, type ReceiptData } from "@/lib/domain/receipt-canvas";
import { useShareableImage } from "@/hooks/use-shareable-image";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Download, Loader2, MessageSquare, Share2 } from "lucide-react";

type ReceiptDialogProps = {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
  filename: string;
  /** Link wa.me al chat del cliente. Abre la conversación con el texto del
   *  comprobante; WhatsApp no permite adjuntar la imagen por URL. */
  whatsappLink?: string | null;
};

export function ReceiptDialog({
  open,
  onClose,
  data,
  filename,
  whatsappLink,
}: ReceiptDialogProps) {
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

        <div className="space-y-2.5">
          <Button
            variant="success"
            size="lg"
            className="w-full gap-2 text-base font-bold"
            disabled={!canvas || busy !== null}
            onClick={() => canvas && share(canvas, filename, data?.titulo ?? "Comprobante")}
          >
            {busy === "share" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
            Enviar imagen por WhatsApp
          </Button>

          <div className="flex gap-2.5">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonClasses("outline", "md"), "flex-1 gap-1.5")}
              >
                <MessageSquare className="h-4 w-4" />
                Abrir chat
              </a>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              disabled={!canvas || busy !== null}
              onClick={() => canvas && download(canvas, filename)}
            >
              {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            La imagen se adjunta con &ldquo;Enviar imagen&rdquo;; &ldquo;Abrir chat&rdquo; lleva el
            texto al número del cliente.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
