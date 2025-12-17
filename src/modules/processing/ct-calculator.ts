/**
 * CT Calculator Module
 * Handles CT value grouping and basic calculations
 */

import {
  CtMeasurement,
  GeneData,
  ParsedTsvData,
  ReplicaGroup,
} from "../../types";
import { detectCtColumn, shouldIgnoreRow } from "../input/tsv-parser";

/**
 * Extract all gene data from parsed TSV (filters out "Sample X" rows)
 * @param data Parsed TSV data
 * @returns Map of gene name to gene data
 */
export function extractGeneData(data: ParsedTsvData): Map<string, GeneData> {
  const geneMap = new Map<string, GeneData>();
  const ctColumn = detectCtColumn(data);

  if (!ctColumn) {
    throw new Error("Could not detect CT value column");
  }

  data.rows.forEach((row, index) => {
    // Skip "Sample X" rows
    if (shouldIgnoreRow(row)) return;

    const geneName = row["Name"];
    if (!geneName) return;

    const ctValue = parseFloat(row[ctColumn]);
    if (isNaN(ctValue)) return;

    if (!geneMap.has(geneName)) {
      geneMap.set(geneName, {
        name: geneName,
        measurements: [],
        replicaGroups: [],
      });
    }

    const geneData = geneMap.get(geneName)!;
    geneData.measurements.push({
      value: ctValue,
      rowIndex: index,
    });
  });

  return geneMap;
}

/**
 * Group CT measurements into replica groups
 * @param measurements Array of CT measurements
 * @param replicaCount Number of replicas per sample
 * @param sampleNames Array of sample names
 * @returns Array of replica groups
 */
export function groupIntoReplicas(
  measurements: CtMeasurement[],
  replicaCount: number,
  sampleNames: string[]
): ReplicaGroup[] {
  const groups: ReplicaGroup[] = [];

  for (let i = 0; i < sampleNames.length; i++) {
    const startIndex = i * replicaCount;
    const endIndex = startIndex + replicaCount;

    if (endIndex > measurements.length) break;

    const ctValues = measurements
      .slice(startIndex, endIndex)
      .map((m) => m.value);

    groups.push({
      sampleName: sampleNames[i],
      sampleNumber: i + 1,
      ctValues,
    });
  }

  return groups;
}

/**
 * Build gene data with replica grouping
 * @param data Parsed TSV data
 * @param replicaCount Number of replicas per sample
 * @param sampleNames Array of sample names
 * @returns Map of gene name to complete gene data
 */
export function buildGeneDataWithGroups(
  data: ParsedTsvData,
  replicaCount: number,
  sampleNames: string[]
): Map<string, GeneData> {
  const geneMap = extractGeneData(data);

  for (const [geneName, geneData] of geneMap) {
    geneData.replicaGroups = groupIntoReplicas(
      geneData.measurements,
      replicaCount,
      sampleNames
    );
  }

  return geneMap;
}

/**
 * Get CT values for a specific gene and sample
 * @param geneData Gene data
 * @param sampleNumber Sample number (1-indexed)
 * @returns Array of CT values for that sample
 */
export function getCtValuesForSample(
  geneData: GeneData,
  sampleNumber: number
): number[] {
  const group = geneData.replicaGroups.find(
    (g) => g.sampleNumber === sampleNumber
  );
  return group?.ctValues ?? [];
}

/**
 * Get all genes except the housekeeper
 * @param geneMap Map of all genes
 * @param housekeeperName Name of housekeeper gene
 * @returns Array of non-housekeeper gene names
 */
export function getTargetGenes(
  geneMap: Map<string, GeneData>,
  housekeeperName: string
): string[] {
  return Array.from(geneMap.keys()).filter((name) => name !== housekeeperName);
}
