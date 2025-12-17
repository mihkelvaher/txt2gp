/**
 * Table Component
 * Reusable table rendering utilities
 */

import { RawDataRow } from "../../../types";

/**
 * Options for table rendering
 */
export interface TableRenderOptions {
  headers: string[];
  rows: RawDataRow[] | string[][];
  className?: string;
  headerClassName?: string;
  cellRenderer?: (value: string, column: string, rowIndex: number) => string;
}

/**
 * Render a data table
 * @param options Table rendering options
 * @returns HTML string
 */
export function renderTable(options: TableRenderOptions): string {
  const {
    headers,
    rows,
    className = "data-table",
    headerClassName = "",
    cellRenderer,
  } = options;

  let html = `<table class="${className}">`;

  // Header row
  html += "<thead><tr>";
  headers.forEach((header) => {
    html += `<th class="${headerClassName}">${escapeHtml(header)}</th>`;
  });
  html += "</tr></thead>";

  // Body rows
  html += "<tbody>";
  rows.forEach((row, rowIndex) => {
    html += "<tr>";

    if (Array.isArray(row)) {
      // String array format
      row.forEach((cell, colIndex) => {
        const value = cellRenderer
          ? cellRenderer(cell, headers[colIndex], rowIndex)
          : escapeHtml(cell);
        html += `<td>${value}</td>`;
      });
    } else {
      // Object format
      headers.forEach((header) => {
        const rawValue = row[header] ?? "";
        const value = cellRenderer
          ? cellRenderer(rawValue, header, rowIndex)
          : escapeHtml(rawValue);
        html += `<td>${value}</td>`;
      });
    }

    html += "</tr>";
  });
  html += "</tbody>";

  html += "</table>";

  return html;
}

/**
 * Render a simple table from 2D array
 * @param data 2D array of values
 * @param options Optional configuration
 * @returns HTML string
 */
export function renderSimpleTable(
  data: string[][],
  options?: {
    className?: string;
    hasHeader?: boolean;
    boldRows?: number[];
    numericColumns?: number[];
  }
): string {
  const {
    className = "data-table",
    hasHeader = true,
    boldRows = [],
    numericColumns = [],
  } = options ?? {};

  if (data.length === 0) return "";

  let html = `<table class="${className}">`;

  const startRow = hasHeader ? 1 : 0;

  // Header
  if (hasHeader) {
    html += "<thead><tr>";
    data[0].forEach((cell, colIndex) => {
      const numericClass = numericColumns.includes(colIndex) ? " numeric" : "";
      html += `<th class="${numericClass}">${escapeHtml(cell)}</th>`;
    });
    html += "</tr></thead>";
  }

  // Body
  html += "<tbody>";
  for (let i = startRow; i < data.length; i++) {
    const isBold = boldRows.includes(i);
    const rowClass = isBold ? "bold totals-row" : "";

    html += `<tr class="${rowClass}">`;
    data[i].forEach((cell, colIndex) => {
      const numericClass = numericColumns.includes(colIndex) ? " numeric" : "";
      const cellClass = isBold ? `bold${numericClass}` : numericClass;
      html += `<td class="${cellClass}">${escapeHtml(cell)}</td>`;
    });
    html += "</tr>";
  }
  html += "</tbody>";

  html += "</table>";

  return html;
}

/**
 * Escape HTML special characters
 * @param text Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Set table container content with scroll preservation
 * @param containerId Container element ID
 * @param tableHtml Table HTML content
 */
export function setTableContent(containerId: string, tableHtml: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    const scrollTop = container.scrollTop;
    container.innerHTML = tableHtml;
    container.scrollTop = scrollTop;
  }
}

/**
 * Clear table content
 * @param containerId Container element ID
 */
export function clearTable(containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }
}
