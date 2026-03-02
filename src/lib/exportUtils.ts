import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildRows<T>(data: T[], columns: ExportColumn<T>[]): (string | number)[][] {
  return data.map((row) => columns.map((col) => col.accessor(row)));
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
) {
  const BOM = "\uFEFF";
  const headers = columns.map((c) => c.header);
  const rows = buildRows(data, columns);

  const escapeCsvField = (field: string | number) => {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv =
    BOM +
    [headers.map(escapeCsvField).join(","), ...rows.map((r) => r.map(escapeCsvField).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Datos",
) {
  const headers = columns.map((c) => c.header);
  const rows = buildRows(data, columns);
  const wsData = [headers, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = headers.map((h, i) => {
    const maxDataLen = rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), 0);
    return { wch: Math.max(h.length, maxDataLen) + 2 };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxBuf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportMultiSheetExcel(
  sheets: { name: string; headers: string[]; rows: (string | number)[][] }[],
  filename: string,
) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const wsData = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = sheet.headers.map((h, i) => {
      const maxDataLen = sheet.rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), 0);
      return { wch: Math.max(h.length, maxDataLen) + 2 };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxBuf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function buildTimestamp(): string {
  return format(new Date(), "yyyy-MM-dd");
}
