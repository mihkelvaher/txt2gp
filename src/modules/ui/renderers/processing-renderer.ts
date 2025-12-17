/**
 * Processing Section Renderer
 * Handles rendering of the processing tables
 */

import { GeneProcessingResult, ProcessingTableRow } from "../../../types";
import { formatNumber } from "../../processing/statistics";
import { escapeHtml } from "../components/table";
import { renderTabs, setupTabHandlers, TabConfig } from "../components/tabs";

/**
 * Render processing section with gene tabs
 * @param results Map of gene processing results
 * @param activeGene Currently active gene tab
 */
export function renderProcessingSection(
  results: Map<string, GeneProcessingResult>,
  activeGene: string | null
): void {
  if (results.size === 0) {
    const content = document.getElementById("processing-content");
    if (content) {
      content.innerHTML =
        '<p class="text-center">Configure input settings and select a housekeeper gene to see processing results.</p>';
    }
    return;
  }

  const tabs: TabConfig[] = [];

  for (const [geneName, result] of results) {
    tabs.push({
      id: geneName,
      label: geneName,
      content: renderProcessingTable(result),
    });
  }

  renderTabs(tabs, activeGene, "gene-tabs", "processing-content");
}

/**
 * Render processing table for a single gene
 * @param result Gene processing result
 * @returns HTML string
 */
export function renderProcessingTable(result: GeneProcessingResult): string {
  const headers = [
    "SAMPLE NR",
    "SAMPLE",
    "CT",
    "STD",
    "[CT]",
    "",
    "H CT",
    "H STD",
    "H [CT]",
    "",
    "ΔCT",
    "ΔΔCT",
    "Combined STD",
    "",
    "2⁻ΔΔCT",
    "SEM",
  ];

  const headerClasses = [
    "sample-header",
    "sample-header",
    "sample-header",
    "sample-header",
    "sample-header",
    "",
    "housekeeper-header",
    "housekeeper-header",
    "housekeeper-header",
    "",
    "calc-header",
    "calc-header",
    "calc-header",
    "",
    "result-header",
    "result-header",
  ];

  let html =
    '<div class="table-container scrollable" style="max-height: 500px;">';
  html += '<table class="data-table processing-table">';

  // Header
  html += "<thead><tr>";
  headers.forEach((header, i) => {
    html += `<th class="${headerClasses[i]}">${escapeHtml(header)}</th>`;
  });
  html += "</tr></thead>";

  // Body
  html += "<tbody>";

  for (const row of result.rows) {
    html += renderProcessingRow(row);
  }

  html += "</tbody></table></div>";

  return html;
}

/**
 * Render a single processing table row
 * @param row Processing table row data
 * @returns HTML string
 */
function renderProcessingRow(row: ProcessingTableRow): string {
  if (row.isReplicaRow) {
    // Replica sub-row - only show CT values
    return `
      <tr class="replica-row">
        <td></td>
        <td></td>
        <td class="numeric">${formatNumber(row.ctValues[0], 2)}</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="numeric">${formatNumber(row.hkCtValues[0], 2)}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }

  // Main sample row
  return `
    <tr class="sample-row">
      <td class="numeric bold">${row.sampleNumber}</td>
      <td class="bold">${escapeHtml(row.sampleName)}</td>
      <td class="numeric">${formatNumber(row.ctValues[0], 2)}</td>
      <td class="numeric">${formatNumber(row.ctStd, 2)}</td>
      <td class="numeric">${formatNumber(row.ctMean, 2)}</td>
      <td></td>
      <td class="numeric">${formatNumber(row.hkCtValues[0], 2)}</td>
      <td class="numeric">${formatNumber(row.hkCtStd, 2)}</td>
      <td class="numeric">${formatNumber(row.hkCtMean, 2)}</td>
      <td></td>
      <td class="numeric">${formatNumber(row.deltaCt, 2)}</td>
      <td class="numeric">${formatNumber(row.deltaDeltaCt, 2)}</td>
      <td class="numeric">${formatNumber(row.combinedStd, 2)}</td>
      <td></td>
      <td class="numeric">${formatNumber(row.foldChange, 2)}</td>
      <td class="numeric">${formatNumber(row.sem, 2)}</td>
    </tr>
  `;
}

/**
 * Setup processing tab handlers
 * @param onTabChange Callback when tab changes
 */
export function setupProcessingTabHandlers(
  onTabChange: (geneName: string) => void
): void {
  setupTabHandlers("gene-tabs", "processing-content", onTabChange);
}

/**
 * Clear processing section
 */
export function clearProcessingSection(): void {
  const headers = document.getElementById("gene-tabs");
  const content = document.getElementById("processing-content");

  if (headers) headers.innerHTML = "";
  if (content) {
    content.innerHTML =
      '<p class="text-center">Configure input settings and select a housekeeper gene to see processing results.</p>';
  }
}
