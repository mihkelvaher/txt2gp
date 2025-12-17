/**
 * Delta Calculator Module
 * Handles ΔCT, ΔΔCT, and fold change calculations
 */

import {
  GeneData,
  GeneProcessingResult,
  ProcessingConfig,
  ProcessingTableRow,
} from "../../types";
import {
  combinedStandardDeviation,
  foldChange,
  mean,
  sem,
  standardDeviation,
} from "./statistics";

/**
 * Calculate processing table rows for a gene
 * @param targetGene Target gene data
 * @param housekeeperGene Housekeeper gene data
 * @param config Processing configuration
 * @returns Array of processing table rows
 */
export function calculateProcessingRows(
  targetGene: GeneData,
  housekeeperGene: GeneData,
  config: ProcessingConfig
): ProcessingTableRow[] {
  const rows: ProcessingTableRow[] = [];
  const { replicaCount } = config;

  // First pass: calculate ΔCT for all samples to get reference
  const deltaCts: number[] = [];

  for (let i = 0; i < targetGene.replicaGroups.length; i++) {
    const targetGroup = targetGene.replicaGroups[i];
    const hkGroup = housekeeperGene.replicaGroups[i];

    if (!targetGroup || !hkGroup) continue;

    const targetMean = mean(targetGroup.ctValues);
    const hkMean = mean(hkGroup.ctValues);
    const deltaCt = targetMean - hkMean;
    deltaCts.push(deltaCt);
  }

  // Reference ΔCT is the first sample's value
  const referenceDeltaCt = deltaCts.length > 0 ? deltaCts[0] : 0;

  // Second pass: build complete rows
  for (let i = 0; i < targetGene.replicaGroups.length; i++) {
    const targetGroup = targetGene.replicaGroups[i];
    const hkGroup = housekeeperGene.replicaGroups[i];

    if (!targetGroup || !hkGroup) continue;

    // Calculate statistics
    const ctMean = mean(targetGroup.ctValues);
    const ctStd = standardDeviation(targetGroup.ctValues);
    const hkMean = mean(hkGroup.ctValues);
    const hkStd = standardDeviation(hkGroup.ctValues);

    // Delta calculations
    const deltaCt = ctMean - hkMean;
    const deltaDeltaCt = deltaCt - referenceDeltaCt;

    // Combined standard deviation and SEM
    const combinedStd = combinedStandardDeviation(ctStd, hkStd);
    const semValue = sem(combinedStd, replicaCount, replicaCount);

    // Fold change
    const foldChangeValue = foldChange(deltaDeltaCt);

    // Main row (summary)
    rows.push({
      sampleNumber: targetGroup.sampleNumber,
      sampleName: targetGroup.sampleName,
      ctValues: targetGroup.ctValues,
      ctStd,
      ctMean,
      hkCtValues: hkGroup.ctValues,
      hkCtStd: hkStd,
      hkCtMean: hkMean,
      deltaCt,
      deltaDeltaCt,
      combinedStd,
      foldChange: foldChangeValue,
      sem: semValue,
      isReplicaRow: false,
    });

    // Add individual replica rows
    for (let r = 0; r < replicaCount; r++) {
      if (r < targetGroup.ctValues.length) {
        rows.push({
          sampleNumber: targetGroup.sampleNumber,
          sampleName: targetGroup.sampleName,
          ctValues: [targetGroup.ctValues[r]],
          ctStd: 0,
          ctMean: 0,
          hkCtValues: [hkGroup.ctValues[r] ?? 0],
          hkCtStd: 0,
          hkCtMean: 0,
          deltaCt: 0,
          deltaDeltaCt: 0,
          combinedStd: 0,
          foldChange: 0,
          sem: 0,
          isReplicaRow: true,
          replicaIndex: r,
        });
      }
    }
  }

  return rows;
}

/**
 * Process a single gene and generate complete results
 * @param targetGene Target gene data
 * @param housekeeperGene Housekeeper gene data
 * @param config Processing configuration
 * @returns Gene processing result
 */
export function processGene(
  targetGene: GeneData,
  housekeeperGene: GeneData,
  config: ProcessingConfig
): GeneProcessingResult {
  const rows = calculateProcessingRows(targetGene, housekeeperGene, config);

  // Find the first ΔCT value (from first non-replica row)
  const firstMainRow = rows.find((r) => !r.isReplicaRow);
  const firstDeltaCt = firstMainRow?.deltaCt ?? 0;

  return {
    geneName: targetGene.name,
    rows,
    firstDeltaCt,
  };
}

/**
 * Process all target genes
 * @param geneDataMap Map of all gene data
 * @param housekeeperName Name of housekeeper gene
 * @param config Processing configuration
 * @returns Map of gene name to processing results
 */
export function processAllGenes(
  geneDataMap: Map<string, GeneData>,
  housekeeperName: string,
  config: ProcessingConfig
): Map<string, GeneProcessingResult> {
  const results = new Map<string, GeneProcessingResult>();

  const housekeeperData = geneDataMap.get(housekeeperName);
  if (!housekeeperData) {
    throw new Error(`Housekeeper gene "${housekeeperName}" not found`);
  }

  for (const [geneName, geneData] of geneDataMap) {
    if (geneName === housekeeperName) continue;

    const result = processGene(geneData, housekeeperData, config);
    results.set(geneName, result);
  }

  return results;
}

/**
 * Get fold change values for specific samples
 * @param result Gene processing result
 * @param sampleNames Sample names to extract
 * @returns Array of fold change values in order
 */
export function getFoldChangeForSamples(
  result: GeneProcessingResult,
  sampleNames: string[]
): number[] {
  return sampleNames.map((name) => {
    const row = result.rows.find(
      (r) => !r.isReplicaRow && r.sampleName === name
    );
    return row?.foldChange ?? 0;
  });
}
