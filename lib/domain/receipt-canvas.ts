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

export type ReceiptHero = {
  label: string;
  value: string;
  accent?: ReceiptRowAccent;
};

export type ReceiptData = {
  negocio: string;
  titulo: string;
  subtitulo?: string;
  icon?: "check" | "summary";
  hero: ReceiptHero;
  sections: ReceiptSection[];
  footerNote?: string;
};

const COLORS = {
  bg: "#ffffff",
  headerFrom: "#4338ca",
  headerTo: "#7c3aed",
  headerText: "#ffffff",
  foreground: "#12142b",
  muted: "#6b7089",
  border: "#eceef4",
  cardBg: "#f8f8fc",
  success: "#059669",
  warning: "#d97706",
  danger: "#e11d48",
  default: "#12142b",
} as const;

const WIDTH = 720;
const PADDING = 44;
const RADIUS = 28;
const HEADER_HEIGHT = 188;
const HERO_HEIGHT = 148;
const ROW_HEIGHT = 50;
const SECTION_HEADING_HEIGHT = 34;
const SECTION_PAD_Y = 18;
const SECTION_GAP = 18;
const FOOTER_HEIGHT = 76;
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

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

function measureSectionHeight(section: ReceiptSection) {
  let h = SECTION_PAD_Y * 2;
  if (section.heading) h += SECTION_HEADING_HEIGHT;
  h += section.rows.length * ROW_HEIGHT;
  return h;
}

const SECTION_TOP_GAP = PADDING * 0.6;

function measureHeight(data: ReceiptData) {
  let height = HEADER_HEIGHT + HERO_HEIGHT + SECTION_TOP_GAP;
  for (const section of data.sections) {
    height += measureSectionHeight(section) + SECTION_GAP;
  }
  height += FOOTER_HEIGHT;
  return Math.round(height);
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return `${text.slice(0, low)}…`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number },
) {
  const rad = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rad.tl, y);
  ctx.lineTo(x + w - rad.tr, y);
  ctx.arcTo(x + w, y, x + w, y + rad.tr, rad.tr);
  ctx.lineTo(x + w, y + h - rad.br);
  ctx.arcTo(x + w, y + h, x + w - rad.br, y + h, rad.br);
  ctx.lineTo(x + rad.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad.bl, rad.bl);
  ctx.lineTo(x, y + rad.tl);
  ctx.arcTo(x, y, x + rad.tl, y, rad.tl);
  ctx.closePath();
}

function drawIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, kind: "check" | "summary") {
  const r = 26;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "check") {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx - 3, cy + 8);
    ctx.lineTo(cx + 11, cy - 9);
    ctx.stroke();
  } else {
    for (const [i, w] of [0.42, 0.6, 0.3].entries()) {
      const ly = cy - 10 + i * 10;
      ctx.beginPath();
      ctx.moveTo(cx - 12, ly);
      ctx.lineTo(cx - 12 + 24 * w, ly);
      ctx.stroke();
    }
  }
  ctx.restore();
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

  // Outer card with soft drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(30, 20, 90, 0.16)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = COLORS.bg;
  roundRect(ctx, 0, 0, WIDTH, height, RADIUS);
  ctx.fill();
  ctx.restore();

  // Header gradient band
  ctx.save();
  roundRect(ctx, 0, 0, WIDTH, HEADER_HEIGHT, { tl: RADIUS, tr: RADIUS, br: 0, bl: 0 });
  ctx.clip();
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEADER_HEIGHT);
  gradient.addColorStop(0, COLORS.headerFrom);
  gradient.addColorStop(1, COLORS.headerTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  ctx.restore();

  drawIcon(ctx, PADDING + 26, 60, data.icon ?? "check");

  ctx.fillStyle = COLORS.headerText;
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 17px ${FONT}`;
  ctx.globalAlpha = 0.92;
  ctx.fillText(data.negocio.toUpperCase(), PADDING + 66, 55);
  ctx.globalAlpha = 1;

  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(data.titulo, PADDING, 130);

  if (data.subtitulo) {
    ctx.font = `500 15px ${FONT}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(data.subtitulo, PADDING, 158);
    ctx.globalAlpha = 1;
  }

  // Hero amount block
  const heroTop = HEADER_HEIGHT;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, heroTop, WIDTH, HERO_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `700 12px ${FONT}`;
  ctx.save();
  ctx.letterSpacing = "2px";
  ctx.fillText(data.hero.label.toUpperCase(), WIDTH / 2, heroTop + 46);
  ctx.restore();

  ctx.fillStyle = accentColor(data.hero.accent ?? "default");
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText(data.hero.value, WIDTH / 2, heroTop + 104);
  ctx.textAlign = "left";

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, heroTop + HERO_HEIGHT - 1);
  ctx.lineTo(WIDTH - PADDING, heroTop + HERO_HEIGHT - 1);
  ctx.stroke();

  // Sections, each its own soft rounded card
  let y = heroTop + HERO_HEIGHT + SECTION_TOP_GAP;
  for (const section of data.sections) {
    const sectionHeight = measureSectionHeight(section);

    ctx.fillStyle = COLORS.cardBg;
    roundRect(ctx, PADDING - 20, y, WIDTH - (PADDING - 20) * 2, sectionHeight, 18);
    ctx.fill();

    let rowY = y + SECTION_PAD_Y;
    if (section.heading) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = `700 12px ${FONT}`;
      ctx.save();
      ctx.letterSpacing = "1.5px";
      ctx.fillText(section.heading.toUpperCase(), PADDING, rowY + 12);
      ctx.restore();
      rowY += SECTION_HEADING_HEIGHT;
    }

    for (const row of section.rows) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = `500 15px ${FONT}`;
      const labelWidth = ctx.measureText(row.label).width;
      ctx.fillText(row.label, PADDING, rowY + 22);

      ctx.fillStyle = accentColor(row.accent);
      ctx.font = `700 17px ${FONT}`;
      const maxValueWidth = WIDTH - PADDING * 2 - labelWidth - 24;
      const value = truncateToWidth(ctx, row.value, Math.max(maxValueWidth, 60));
      const valueWidth = ctx.measureText(value).width;
      ctx.fillText(value, WIDTH - PADDING - valueWidth, rowY + 22);

      rowY += ROW_HEIGHT;
    }

    y += sectionHeight + SECTION_GAP;
  }

  // Footer
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.8;
  ctx.fillText(
    data.footerNote ?? `Generado por CrediControl · ${new Date().toLocaleString("es-CO")}`,
    WIDTH / 2,
    height - FOOTER_HEIGHT / 2 + 4,
  );
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
