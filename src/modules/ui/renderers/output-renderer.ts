/**
 * Output Section Renderer
 * Handles rendering of the normalized output tables
 */

import { GeneOutputResult } from "../../../types";
import { copyGeneOutputToClipboard } from "../../output/exporter";
import { formatNumber } from "../../processing/statistics";
import { escapeHtml } from "../components/table";

/**
 * Track copy counts per gene
 */
const copyCounts = new Map<string, number>();

/**
 * Render output section with gene columns
 * @param results Map of gene output results
 */
export function renderOutputSection(
  results: Map<string, GeneOutputResult>
): void {
  const container = document.getElementById("output-container");
  if (!container) return;

  if (results.size === 0) {
    container.innerHTML =
      '<p class="text-center">Complete the processing step to see normalized output values.</p>';
    return;
  }

  let html = "";

  for (const [geneName, result] of results) {
    html += renderGeneOutputColumn(result);
  }

  container.innerHTML = html;

  // Setup copy button handlers
  setupCopyButtonHandlers(results);
}

/**
 * Render a single gene output column
 * @param result Gene output result
 * @returns HTML string
 */
export function renderGeneOutputColumn(result: GeneOutputResult): string {
  let html = `<div class="output-gene-column" data-gene="${escapeHtml(
    result.geneName
  )}">`;
  html += `<h3>${escapeHtml(result.geneName)}</h3>`;

  // Table 1: 2^-ΔΔCT values
  html += renderFoldChangeTable(result);

  // Table 2: Normalized values
  html += renderNormalizedTable(result);

  // Copy button with counter
  const copyCount = copyCounts.get(result.geneName) || 0;
  html += `
    <div class="copy-btn-container">
      <button class="btn btn-success copy-btn" data-gene="${escapeHtml(
        result.geneName
      )}">
        Copy to Clipboard
      </button>
      <div class="copy-counter" data-gene="${escapeHtml(result.geneName)}">
        Copied ${copyCount} time${copyCount !== 1 ? "s" : ""}
      </div>
    </div>
  `;

  html += "</div>";

  return html;
}

/**
 * Render fold change table (Table 1)
 * @param result Gene output result
 * @returns HTML string
 */
function renderFoldChangeTable(result: GeneOutputResult): string {
  let html = '<div class="output-table-section">';
  html += "<h4>2⁻ΔΔCT values</h4>";

  // Build table with 2-row headers
  html += '<table class="data-table output-table">';
  html += "<thead>";
  html +=
    "<tr><th>Control</th><th>Control</th><th>Observed</th><th>Observed</th></tr>";
  html +=
    "<tr><th>Sample</th><th>2⁻ΔΔCT</th><th>Sample</th><th>2⁻ΔΔCT</th></tr>";
  html += "</thead><tbody>";

  for (const row of result.foldChangeRows) {
    html += "<tr>";
    html += `<td>${escapeHtml(row.controlName)}</td>`;
    html += `<td class="numeric">${
      row.controlName ? formatNumber(row.controlFoldChange, 4) : ""
    }</td>`;
    html += `<td>${escapeHtml(row.observedName)}</td>`;
    html += `<td class="numeric">${
      row.observedName ? formatNumber(row.observedFoldChange, 4) : ""
    }</td>`;
    html += "</tr>";
  }

  // Add totals row
  html += '<tr class="bold totals-row">';
  html += `<td class="bold">Average:</td>`;
  html += `<td class="numeric bold">${formatNumber(
    result.controlAverage,
    4
  )}</td>`;
  html += "<td></td><td></td>";
  html += "</tr>";

  html += "</tbody></table>";
  html += "</div>";

  return html;
}

/**
 * Render normalized table (Table 2)
 * @param result Gene output result
 * @returns HTML string
 */
function renderNormalizedTable(result: GeneOutputResult): string {
  let html = '<div class="output-table-section">';
  html += "<h4>Normalized 2⁻ΔΔCT values</h4>";

  // Build table with 2-row headers
  html += '<table class="data-table output-table">';
  html += "<thead>";
  html +=
    "<tr><th>Control</th><th>norm Control</th><th>Observed</th><th>norm Observed</th></tr>";
  html +=
    "<tr><th>Sample</th><th>2⁻ΔΔCT</th><th>Sample</th><th>2⁻ΔΔCT</th></tr>";
  html += "</thead><tbody>";

  for (const row of result.normalizedRows) {
    html += "<tr>";
    html += `<td>${escapeHtml(row.controlName)}</td>`;
    html += `<td class="numeric">${
      row.controlName ? formatNumber(row.normalizedControl, 4) : ""
    }</td>`;
    html += `<td>${escapeHtml(row.observedName)}</td>`;
    html += `<td class="numeric">${
      row.observedName ? formatNumber(row.normalizedObserved, 4) : ""
    }</td>`;
    html += "</tr>";
  }

  html += "</tbody></table>";
  html += "</div>";

  return html;
}

/**
 * Setup copy button click handlers
 * @param results Map of gene output results
 */
function setupCopyButtonHandlers(results: Map<string, GeneOutputResult>): void {
  const container = document.getElementById("output-container");
  if (!container) return;

  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    if (target.classList.contains("copy-btn")) {
      const geneName = target.dataset.gene;

      if (geneName && results.has(geneName)) {
        const result = results.get(geneName)!;
        const success = await copyGeneOutputToClipboard(result);

        if (success) {
          // Increment copy counter
          const currentCount = copyCounts.get(geneName) || 0;
          copyCounts.set(geneName, currentCount + 1);

          // Update counter display
          const counterElement = container.querySelector(
            `.copy-counter[data-gene="${geneName}"]`
          );
          if (counterElement) {
            const newCount = currentCount + 1;
            counterElement.textContent = `Copied ${newCount} time${
              newCount !== 1 ? "s" : ""
            }`;
          }

          // Visual feedback
          const originalText = target.textContent;
          target.textContent = "Copied!";
          target.classList.add("copy-success");

          setTimeout(() => {
            target.textContent = originalText;
            target.classList.remove("copy-success");
          }, 1500);
        } else {
          target.textContent = "Copy failed";
          setTimeout(() => {
            target.textContent = "Copy to Clipboard";
          }, 1500);
        }
      }
    }
  });
}

/**
 * Clear output section
 */
export function clearOutputSection(): void {
  const container = document.getElementById("output-container");
  if (container) {
    container.innerHTML =
      '<p class="text-center">Complete the processing step to see normalized output values.</p>';
  }
  copyCounts.clear();
  clearIgnoredGenes();
}

/**
 * Render ignored genes list
 * @param ignoredGenes Array of gene names that were ignored
 */
export function renderIgnoredGenes(ignoredGenes: string[]): void {
  const container = document.getElementById("ignored-genes");
  if (!container) return;

  if (ignoredGenes.length === 0) {
    container.innerHTML = "";
    return;
  }

  let html =
    '<div class="ignored-genes-header">Genes excluded from output (no normalized tables):</div>';
  html += '<ul class="ignored-genes-list">';

  for (const gene of ignoredGenes) {
    html += `<li class="ignored-gene-item">${escapeHtml(gene)}</li>`;
  }

  html += "</ul>";
  container.innerHTML = html;
}

/**
 * Clear ignored genes list
 */
export function clearIgnoredGenes(): void {
  const container = document.getElementById("ignored-genes");
  if (container) {
    container.innerHTML = "";
  }
}
