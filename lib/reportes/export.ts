import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { formatCop } from "@/lib/domain/money";

export type ReportesExportData = {
  rango: { desde: string; hasta: string };
  metricas?: { recaudoTotal: number; prestamosActivos: number; prestamosEnMora: number };
  cartera?: { mayorA3: number; mayorA7: number; mayorA15: number; montoTotal: number };
  proyeccionTotal?: number;
  recaudoDiario: { fecha: string; recaudado: number; esperado: number }[];
  rendimiento: { nombre: string; total: number }[];
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

export function exportReportesCsv(data: ReportesExportData) {
  const lines: string[] = [];

  lines.push(csvRow(["Reporte", `${data.rango.desde} a ${data.rango.hasta}`]));
  lines.push("");

  lines.push(csvRow(["Metrica", "Valor"]));
  lines.push(csvRow(["Recaudo del periodo", data.metricas?.recaudoTotal ?? 0]));
  lines.push(csvRow(["Mora activa", data.cartera?.montoTotal ?? 0]));
  lines.push(csvRow(["Prestamos activos", data.metricas?.prestamosActivos ?? 0]));
  lines.push(csvRow(["Prestamos en mora", data.metricas?.prestamosEnMora ?? 0]));
  lines.push(csvRow(["Proyeccion 30 dias", data.proyeccionTotal ?? 0]));
  lines.push("");

  lines.push(csvRow(["Fecha", "Recaudado", "Esperado"]));
  for (const d of data.recaudoDiario) {
    lines.push(csvRow([d.fecha, d.recaudado, d.esperado]));
  }
  lines.push("");

  lines.push(csvRow(["Cobrador", "Total recaudado"]));
  for (const r of data.rendimiento) {
    lines.push(csvRow([r.nombre, r.total]));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `reporte_${data.rango.desde}_${data.rango.hasta}.csv`);
}

export function exportReportesPdf(data: ReportesExportData) {
  const doc = new jsPDF();
  let cursorY = 18;

  doc.setFontSize(16);
  doc.text("Reporte de operacion", 14, cursorY);
  cursorY += 7;
  doc.setFontSize(10);
  doc.text(`Periodo: ${data.rango.desde} a ${data.rango.hasta}`, 14, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    head: [["Metrica", "Valor"]],
    body: [
      ["Recaudo del periodo", formatCop(data.metricas?.recaudoTotal ?? 0)],
      ["Mora activa", formatCop(data.cartera?.montoTotal ?? 0)],
      ["Prestamos activos", String(data.metricas?.prestamosActivos ?? 0)],
      ["Prestamos en mora", String(data.metricas?.prestamosEnMora ?? 0)],
      ["Proyeccion 30 dias", formatCop(data.proyeccionTotal ?? 0)],
    ],
    theme: "striped",
    styles: { fontSize: 9 },
  });
  cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 10;

  if (data.recaudoDiario.length > 0) {
    doc.setFontSize(12);
    doc.text("Recaudo diario", 14, cursorY);
    cursorY += 4;
    autoTable(doc, {
      startY: cursorY,
      head: [["Fecha", "Recaudado", "Esperado"]],
      body: data.recaudoDiario.map((d) => [d.fecha, formatCop(d.recaudado), formatCop(d.esperado)]),
      theme: "striped",
      styles: { fontSize: 9 },
    });
    cursorY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 10;
  }

  if (data.rendimiento.length > 0) {
    if (cursorY > 260) {
      doc.addPage();
      cursorY = 18;
    }
    doc.setFontSize(12);
    doc.text("Rendimiento por cobrador", 14, cursorY);
    cursorY += 4;
    autoTable(doc, {
      startY: cursorY,
      head: [["Cobrador", "Total recaudado"]],
      body: data.rendimiento.map((r) => [r.nombre, formatCop(r.total)]),
      theme: "striped",
      styles: { fontSize: 9 },
    });
  }

  doc.save(`reporte_${data.rango.desde}_${data.rango.hasta}.pdf`);
}
