/**
 * Normalizer Module
 * Handles normalization of fold change values
 */

import {
  FoldChangeTableRow,
  GeneOutputResult,
  GeneProcessingResult,
  NormalizedTableRow,
} from "../../types";
import { mean, roundTo } from "../processing/statistics";

/**
 * Build fold change table rows for a gene
 * @param result Gene processing result
 * @param controls Control sample names
 * @param allSamples All sample names in order
 * @returns Fold change table rows
 */
export function buildFoldChangeTable(
  result: GeneProcessingResult,
  controls: string[],
  allSamples: string[]
): FoldChangeTableRow[] {
  const rows: FoldChangeTableRow[] = [];

  // Get observed samples (non-controls that match the count of controls)
  const observed = allSamples.filter((s) => !controls.includes(s));
  const observedCount = Math.min(observed.length, controls.length);
  const observedSamples = observed.slice(0, observedCount);

  // Build paired rows
  const rowCount = Math.max(controls.length, observedSamples.length);

  for (let i = 0; i < rowCount; i++) {
    const controlName = controls[i] ?? "";
    const observedName = observedSamples[i] ?? "";

    // Find fold change values from main rows
    const controlRow = result.rows.find(
      (r) => !r.isReplicaRow && r.sampleName === controlName
    );
    const observedRow = result.rows.find(
      (r) => !r.isReplicaRow && r.sampleName === observedName
    );

    rows.push({
      controlName,
      controlFoldChange: controlRow?.foldChange ?? 0,
      observedName,
      observedFoldChange: observedRow?.foldChange ?? 0,
    });
  }

  return rows;
}

/**
 * Calculate control average from fold change table
 * @param foldChangeRows Fold change table rows
 * @returns Average of control fold change values
 */
export function calculateControlAverage(
  foldChangeRows: FoldChangeTableRow[]
): number {
  const controlValues = foldChangeRows
    .filter((row) => row.controlName && row.controlFoldChange > 0)
    .map((row) => row.controlFoldChange);

  return controlValues.length > 0 ? mean(controlValues) : 1;
}

/**
 * Build normalized table rows
 * @param foldChangeRows Fold change table rows
 * @param controlAverage Average of control fold change values
 * @returns Normalized table rows
 */
export function buildNormalizedTable(
  foldChangeRows: FoldChangeTableRow[],
  controlAverage: number
): NormalizedTableRow[] {
  if (controlAverage === 0) controlAverage = 1; // Prevent division by zero

  return foldChangeRows.map((row) => ({
    controlName: row.controlName,
    normalizedControl: row.controlFoldChange / controlAverage,
    observedName: row.observedName,
    normalizedObserved: row.observedFoldChange / controlAverage,
  }));
}

/**
 * Generate complete output for a gene
 * @param result Gene processing result
 * @param controls Control sample names
 * @param allSamples All sample names
 * @returns Complete gene output result
 */
export function generateGeneOutput(
  result: GeneProcessingResult,
  controls: string[],
  allSamples: string[]
): GeneOutputResult {
  const foldChangeRows = buildFoldChangeTable(result, controls, allSamples);
  const controlAverage = calculateControlAverage(foldChangeRows);
  const normalizedRows = buildNormalizedTable(foldChangeRows, controlAverage);

  return {
    geneName: result.geneName,
    foldChangeRows,
    controlAverage: roundTo(controlAverage, 4),
    normalizedRows,
  };
}

/**
 * Generate output for all genes
 * @param processingResults Map of gene processing results
 * @param controls Control sample names
 * @param allSamples All sample names
 * @returns Map of gene name to output results
 */
export function generateAllOutputs(
  processingResults: Map<string, GeneProcessingResult>,
  controls: string[],
  allSamples: string[]
): Map<string, GeneOutputResult> {
  const outputs = new Map<string, GeneOutputResult>();

  for (const [geneName, result] of processingResults) {
    const output = generateGeneOutput(result, controls, allSamples);
    outputs.set(geneName, output);
  }

  return outputs;
}
