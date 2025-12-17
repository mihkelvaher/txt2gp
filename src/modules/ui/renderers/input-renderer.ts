/**
 * Input Section Renderer
 * Handles rendering of the input section UI
 */

import { ParsedTsvData } from "../../../types";
import {
  extractStatusWarnings,
  filterIgnoredRows,
  filterRowsByGene,
} from "../../input/tsv-parser";
import {
  renderRadioGroup,
  setupRadioGroupHandlers,
} from "../components/radio-group";
import { escapeHtml, renderTable } from "../components/table";

/**
 * Render input data table (filters out "Sample X" rows)
 * @param data Parsed TSV data
 */
export function renderInputTable(data: ParsedTsvData): void {
  const container = document.getElementById("input-table-container");
  if (!container) return;

  // Filter out ignored rows for display
  const filteredData = filterIgnoredRows(data);

  const tableHtml = renderTable({
    headers: filteredData.headers,
    rows: filteredData.rows,
    className: "data-table",
  });

  container.innerHTML = tableHtml;
}

/**
 * Display loaded filename
 * @param filename Name of the loaded file
 */
export function displayFilename(filename: string): void {
  const container = document.getElementById("loaded-filename");
  if (container) {
    container.textContent = filename ? `Loaded: ${filename}` : "";
  }
}

/**
 * Render status warnings from the data
 * @param data Parsed TSV data (original, before filtering)
 */
export function renderStatusWarnings(data: ParsedTsvData): void {
  const container = document.getElementById("status-warnings");
  if (!container) return;

  const warnings = extractStatusWarnings(data);

  if (warnings.length === 0) {
    container.innerHTML = "";
    return;
  }

  let html = '<div class="warnings-header">Status Warnings:</div>';
  html += '<ul class="warning-list">';

  for (const warning of warnings) {
    html += `<li class="warning-item">${escapeHtml(warning)}</li>`;
  }

  html += "</ul>";
  container.innerHTML = html;
}

/**
 * Update page title from data
 * @param title Title from file
 */
export function updatePageTitle(title: string): void {
  const titleElement = document.getElementById("page-title");
  if (titleElement) {
    titleElement.textContent = title;
  }
  document.title = title;
}

/**
 * Render housekeeper gene picker
 * @param genes Available gene names
 * @param selectedGene Currently selected housekeeper
 */
export function renderHousekeeperPicker(
  genes: string[],
  selectedGene: string
): void {
  const container = document.getElementById("housekeeper-picker");
  if (!container) return;

  const options = genes.map((gene) => ({ value: gene, label: gene }));
  container.innerHTML = renderRadioGroup(options, selectedGene, "housekeeper");
}

/**
 * Render housekeeper data table
 * @param data Parsed TSV data
 * @param housekeeperName Selected housekeeper gene
 */
export function renderHousekeeperTable(
  data: ParsedTsvData,
  housekeeperName: string
): void {
  const container = document.getElementById("housekeeper-table-container");
  if (!container) return;

  if (!housekeeperName) {
    container.innerHTML =
      '<p class="text-center">Select a housekeeper gene to view its data</p>';
    return;
  }

  const filteredRows = filterRowsByGene(data, housekeeperName);

  const tableHtml = renderTable({
    headers: data.headers,
    rows: filteredRows,
    className: "data-table",
  });

  container.innerHTML = tableHtml;
}

/**
 * Setup housekeeper picker handlers
 * @param onHousekeeperChange Callback when housekeeper changes
 */
export function setupHousekeeperPickerHandlers(
  onHousekeeperChange: (geneName: string) => void
): void {
  setupRadioGroupHandlers("housekeeper-picker", onHousekeeperChange);
}

/**
 * Populate sample list textarea with auto-generated names
 * @param sampleNames Sample names to populate
 */
export function populateSampleList(sampleNames: string[]): void {
  const textarea = document.getElementById(
    "sample-list"
  ) as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = sampleNames.join("\n");
  }
}

/**
 * Get sample list from textarea
 * @returns Array of sample names
 */
export function getSampleList(): string[] {
  const textarea = document.getElementById(
    "sample-list"
  ) as HTMLTextAreaElement;
  if (!textarea) return [];

  return textarea.value
    .trimEnd()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Get control list from textarea
 * @returns Array of control sample names
 */
export function getControlList(): string[] {
  const textarea = document.getElementById(
    "control-list"
  ) as HTMLTextAreaElement;
  if (!textarea) return [];

  return textarea.value
    .trimEnd()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Get replica count from input
 * @returns Replica count number
 */
export function getReplicaCount(): number {
  const input = document.getElementById("replica-count") as HTMLInputElement;
  if (!input) return 3;

  return parseInt(input.value, 10) || 3;
}

/**
 * Show validation error
 * @param elementId Error element ID
 * @param message Error message
 */
export function showError(elementId: string, message: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.remove("hidden");
  }
}

/**
 * Clear validation error
 * @param elementId Error element ID
 */
export function clearError(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = "";
  }
}

/**
 * Show all validation errors in appropriate locations
 * @param errors Map of field to error message
 */
export function displayValidationErrors(errors: Map<string, string>): void {
  // Clear all errors first
  clearError("file-error");
  clearError("replica-error");
  clearError("housekeeper-error");
  clearError("sample-list-error");
  clearError("control-list-error");

  // Display new errors
  errors.forEach((message, field) => {
    switch (field) {
      case "file":
        showError("file-error", message);
        break;
      case "replicaCount":
        showError("replica-error", message);
        break;
      case "housekeeper":
        showError("housekeeper-error", message);
        break;
      case "sampleList":
        showError("sample-list-error", message);
        break;
      case "controlList":
        showError("control-list-error", message);
        break;
    }
  });
}
