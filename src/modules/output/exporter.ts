/**
 * Exporter Module
 * Handles clipboard export functionality
 */

import { GeneOutputResult } from "../../types";
import { formatNumber } from "../processing/statistics";

/**
 * Format normalized values as TSV for clipboard
 * @param outputResult Gene output result
 * @returns TSV formatted string
 */
export function formatNormalizedAsTsv(outputResult: GeneOutputResult): string {
  const lines: string[] = [];

  // Data rows only (no header)
  for (const row of outputResult.normalizedRows) {
    const control = row.controlName
      ? formatNumber(row.normalizedControl, 4)
      : "";
    const observed = row.observedName
      ? formatNumber(row.normalizedObserved, 4)
      : "";
    lines.push(`${control}\t${observed}`);
  }

  return lines.join("\n");
}

/**
 * Format all genes' normalized values as TSV
 * @param outputs Map of gene output results
 * @returns TSV formatted string with all genes
 */
export function formatAllNormalizedAsTsv(
  outputs: Map<string, GeneOutputResult>
): string {
  const lines: string[] = [];

  // Build headers (gene names repeated for control and observed)
  const geneNames = Array.from(outputs.keys());
  const headerParts: string[] = [];

  for (const geneName of geneNames) {
    headerParts.push(`${geneName} Control`);
    headerParts.push(`${geneName} Observed`);
  }
  lines.push(headerParts.join("\t"));

  // Find max row count
  let maxRows = 0;
  for (const output of outputs.values()) {
    maxRows = Math.max(maxRows, output.normalizedRows.length);
  }

  // Build data rows
  for (let i = 0; i < maxRows; i++) {
    const rowParts: string[] = [];

    for (const geneName of geneNames) {
      const output = outputs.get(geneName)!;
      const row = output.normalizedRows[i];

      if (row) {
        const control = row.controlName
          ? formatNumber(row.normalizedControl, 4)
          : "";
        const observed = row.observedName
          ? formatNumber(row.normalizedObserved, 4)
          : "";
        rowParts.push(control);
        rowParts.push(observed);
      } else {
        rowParts.push("");
        rowParts.push("");
      }
    }

    lines.push(rowParts.join("\t"));
  }

  return lines.join("\n");
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise resolving when copied
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    return copyToClipboardFallback(text);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Fallback clipboard copy using textarea
 * @param text Text to copy
 * @returns Whether copy was successful
 */
function copyToClipboardFallback(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.select();

  try {
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    document.body.removeChild(textarea);
    return false;
  }
}

/**
 * Copy gene output to clipboard
 * @param outputResult Gene output result
 * @returns Promise resolving to success status
 */
export async function copyGeneOutputToClipboard(
  outputResult: GeneOutputResult
): Promise<boolean> {
  const tsv = formatNormalizedAsTsv(outputResult);
  return copyToClipboard(tsv);
}
