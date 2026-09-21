import { toast } from "sonner";

/**
 * Client-side CSV export. Every dashboard's Export button funnels through
 * here so the file shape stays consistent when the real query layer lands.
 */
export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    toast.info("Nothing to export for the selected filters");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Report downloaded");
}

/** Multiple sections in one file, separated by blank lines + a section title. */
export function downloadCsvSections(
  filename: string,
  sections: { title: string; rows: Record<string, unknown>[] }[],
): void {
  const parts: string[] = [];
  for (const { title, rows } of sections) {
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    parts.push(
      title,
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
      "",
    );
  }
  if (parts.length === 0) {
    toast.info("Nothing to export for the selected filters");
    return;
  }
  const blob = new Blob(["﻿" + parts.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Report downloaded");
}
