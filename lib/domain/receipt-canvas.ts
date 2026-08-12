export type ReceiptRowAccent = "default" | "success" | "warning" | "danger";

export type ReceiptRow = {
  label: string;
  value: string;
  accent?: ReceiptRowAccent;
};

export type ReceiptSection = {
  heading?: string;
  rows: ReceiptRow[];
};

export type ReceiptData = {
  negocio: string;
  titulo: string;
  subtitulo?: string;
  sections: ReceiptSection[];
  footerNote?: string;
};

const COLORS = {
  bg: "#ffffff",
  headerBg: "#4338ca",
  headerText: "#ffffff",
  foreground: "#0c0d1a",
  muted: "#5a5d78",
  border: "#e4e4ec",
  success: "#059669",
  warning: "#d97706",
  danger: "#e11d48",
  default: "#0c0d1a",
} as const;

const WIDTH = 720;
const PADDING = 40;
const HEADER_HEIGHT = 150;
const ROW_HEIGHT = 56;
const SECTION_HEADING_HEIGHT = 40;
const SECTION_GAP = 16;
const FOOTER_HEIGHT = 90;

function accentColor(accent: ReceiptRowAccent | undefined) {
  switch (accent) {
    case "success":
      return COLORS.success;
    case "warning":
      return COLORS.warning;
    case "danger":
      return COLORS.danger;
    default:
      return COLORS.default;
  }
}

function measureHeight(data: ReceiptData) {
  let height = HEADER_HEIGHT + PADDING;
  for (const section of data.sections) {
    if (section.heading) height += SECTION_HEADING_HEIGHT;
    height += section.rows.length * ROW_HEIGHT;
    height += SECTION_GAP;
  }
  height += FOOTER_HEIGHT;
  return Math.round(height);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderReceiptCanvas(data: ReceiptData): HTMLCanvasElement {
  const scale = 2; // render at 2x for crisp output on high-DPI screens
  const height = measureHeight(data);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(scale, scale);

  // Background + outer border
  ctx.fillStyle = COLORS.bg;
  roundRect(ctx, 0, 0, WIDTH, height, 24);
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, WIDTH - 1, height - 1, 24);
  ctx.stroke();

  // Header
  ctx.save();
  roundRect(ctx, 0, 0, WIDTH, HEADER_HEIGHT, 24);
  ctx.clip();
  ctx.fillStyle = COLORS.headerBg;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  ctx.restore();

  ctx.fillStyle = COLORS.headerText;
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(data.negocio, PADDING, 56);

  ctx.font = "700 32px system-ui, -apple-system, sans-serif";
  ctx.fillText(data.titulo, PADDING, 100);

  if (data.subtitulo) {
    ctx.font = "400 16px system-ui, -apple-system, sans-serif";
    ctx.globalAlpha = 0.85;
    ctx.fillText(data.subtitulo, PADDING, 128);
    ctx.globalAlpha = 1;
  }

  // Body
  let y = HEADER_HEIGHT + PADDING;
  for (const section of data.sections) {
    if (section.heading) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = "700 13px system-ui, -apple-system, sans-serif";
      ctx.save();
      ctx.letterSpacing = "1.5px";
      ctx.fillText(section.heading.toUpperCase(), PADDING, y + 18);
      ctx.restore();
      y += SECTION_HEADING_HEIGHT;
    }

    for (const row of section.rows) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = "400 16px system-ui, -apple-system, sans-serif";
      ctx.fillText(row.label, PADDING, y + 24);

      ctx.fillStyle = accentColor(row.accent);
      ctx.font = "700 20px system-ui, -apple-system, sans-serif";
      const valueWidth = ctx.measureText(row.value).width;
      ctx.fillText(row.value, WIDTH - PADDING - valueWidth, y + 30);

      y += ROW_HEIGHT;
      if (row !== section.rows[section.rows.length - 1]) {
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PADDING, y - 8);
        ctx.lineTo(WIDTH - PADDING, y - 8);
        ctx.stroke();
      }
    }
    y += SECTION_GAP;
  }

  // Footer
  ctx.strokeStyle = COLORS.border;
  ctx.beginPath();
  ctx.moveTo(PADDING, height - FOOTER_HEIGHT + 10);
  ctx.lineTo(WIDTH - PADDING, height - FOOTER_HEIGHT + 10);
  ctx.stroke();

  ctx.fillStyle = COLORS.muted;
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    data.footerNote ?? `Generado por CrediControl · ${new Date().toLocaleString("es-CO")}`,
    PADDING,
    height - 36,
  );

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
