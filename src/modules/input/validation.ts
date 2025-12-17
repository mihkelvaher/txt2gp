/**
 * Input Validation Module
 * Validates user inputs for processing configuration
 */

import {
  ParsedTsvData,
  ProcessingConfig,
  ValidationError,
  ValidationResult,
} from "../../types";

/**
 * Validate replica count
 * @param count Replica count value
 * @returns Validation result
 */
export function validateReplicaCount(count: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(count)) {
    errors.push({
      field: "replicaCount",
      message: "Replica count must be a whole number",
    });
  } else if (count < 1) {
    errors.push({
      field: "replicaCount",
      message: "Replica count must be at least 1",
    });
  } else if (count > 10) {
    errors.push({
      field: "replicaCount",
      message: "Replica count cannot exceed 10",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate housekeeper selection
 * @param housekeeper Selected housekeeper gene
 * @param availableGenes List of available genes
 * @returns Validation result
 */
export function validateHousekeeper(
  housekeeper: string,
  availableGenes: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!housekeeper || housekeeper.trim() === "") {
    errors.push({
      field: "housekeeper",
      message: "Please select a housekeeper gene",
    });
  } else if (!availableGenes.includes(housekeeper)) {
    errors.push({
      field: "housekeeper",
      message: `"${housekeeper}" is not a valid gene in the data`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate sample list
 * @param samples Array of sample names
 * @param totalDataRows Total number of data rows
 * @param replicaCount Number of replicas per sample
 * @returns Validation result
 */
export function validateSampleList(
  samples: string[],
  totalDataRows: number,
  replicaCount: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (samples.length === 0) {
    errors.push({
      field: "sampleList",
      message: "Please enter at least one sample name",
    });
  }

  // Check for duplicates
  const uniqueSamples = new Set(samples);
  if (uniqueSamples.size !== samples.length) {
    errors.push({
      field: "sampleList",
      message: "Duplicate sample names found",
    });
  }

  // Check if sample count matches data
  const expectedSamples = Math.floor(totalDataRows / replicaCount);
  if (samples.length > expectedSamples) {
    errors.push({
      field: "sampleList",
      message: `Too many samples. Data supports ${expectedSamples} samples with ${replicaCount} replicas each`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate control list
 * @param controls Array of control sample names
 * @param samples Array of all sample names
 * @returns Validation result
 */
export function validateControlList(
  controls: string[],
  samples: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (controls.length === 0) {
    errors.push({
      field: "controlList",
      message: "Please enter at least one control sample",
    });
  }

  // Check that all controls are in the sample list
  const invalidControls = controls.filter((c) => !samples.includes(c));
  if (invalidControls.length > 0) {
    errors.push({
      field: "controlList",
      message: `Invalid control(s): ${invalidControls.join(
        ", "
      )}. Controls must be in the sample list.`,
    });
  }

  // Check for duplicates
  const uniqueControls = new Set(controls);
  if (uniqueControls.size !== controls.length) {
    errors.push({
      field: "controlList",
      message: "Duplicate control names found",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete processing configuration
 * @param config Processing configuration
 * @param data Parsed TSV data
 * @param availableGenes Available gene names
 * @returns Validation result
 */
export function validateProcessingConfig(
  config: ProcessingConfig,
  data: ParsedTsvData,
  availableGenes: string[]
): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Get row count for one gene to determine total rows per gene
  const geneRowCount = data.rows.filter(
    (r) => r["Name"] === availableGenes[0]
  ).length;

  // Validate replica count
  const replicaResult = validateReplicaCount(config.replicaCount);
  allErrors.push(...replicaResult.errors);

  // Validate housekeeper
  const housekeeperResult = validateHousekeeper(
    config.housekeeper,
    availableGenes
  );
  allErrors.push(...housekeeperResult.errors);

  // Validate samples
  const sampleResult = validateSampleList(
    config.samples,
    geneRowCount,
    config.replicaCount
  );
  allErrors.push(...sampleResult.errors);

  // Validate controls
  const controlResult = validateControlList(config.controls, config.samples);
  allErrors.push(...controlResult.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Parse sample list from textarea input
 * @param input Textarea content
 * @returns Array of sample names
 */
export function parseSampleList(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Auto-generate sample names from gene data
 * @param totalRows Total number of rows per gene
 * @param replicaCount Number of replicas per sample
 * @param prefix Prefix for sample names
 * @returns Generated sample names
 */
export function generateSampleNames(
  totalRows: number,
  replicaCount: number,
  prefix: string = "Sample"
): string[] {
  const sampleCount = Math.floor(totalRows / replicaCount);
  const samples: string[] = [];

  for (let i = 1; i <= sampleCount; i++) {
    samples.push(`${prefix} ${i}`);
  }

  return samples;
}
