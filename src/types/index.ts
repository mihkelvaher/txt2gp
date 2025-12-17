/**
 * Core type definitions for the Gene Expression Analysis App
 */

// ============================================================================
// Raw Input Data Types
// ============================================================================

/**
 * Represents a single row from the input TSV file
 */
export interface RawDataRow {
  [columnName: string]: string;
}

/**
 * Parsed TSV file structure
 */
export interface ParsedTsvData {
  title: string;
  headers: string[];
  rows: RawDataRow[];
}

/**
 * Configuration for data processing
 */
export interface ProcessingConfig {
  replicaCount: number;
  housekeeper: string;
  samples: string[];
  controls: string[];
}

// ============================================================================
// Gene Expression Data Types
// ============================================================================

/**
 * A single CT value measurement
 */
export interface CtMeasurement {
  value: number;
  rowIndex: number;
}

/**
 * Grouped replica measurements for a sample
 */
export interface ReplicaGroup {
  sampleName: string;
  sampleNumber: number;
  ctValues: number[];
}

/**
 * Gene data extracted from input
 */
export interface GeneData {
  name: string;
  measurements: CtMeasurement[];
  replicaGroups: ReplicaGroup[];
}

// ============================================================================
// Processing Result Types
// ============================================================================

/**
 * Calculated statistics for a replica group
 */
export interface ReplicaStatistics {
  mean: number;
  stdDev: number;
}

/**
 * Single row in the processing table
 */
export interface ProcessingTableRow {
  sampleNumber: number;
  sampleName: string;
  ctValues: number[]; // Individual CT values
  ctStd: number; // STD
  ctMean: number; // [CT]
  hkCtValues: number[]; // Housekeeper CT values
  hkCtStd: number; // H STD
  hkCtMean: number; // H [CT]
  deltaCt: number; // ΔCT
  deltaDeltaCt: number; // ΔΔCT
  combinedStd: number; // Combined STD
  foldChange: number; // 2^-ΔΔCT
  sem: number; // SEM
  isReplicaRow: boolean; // Whether this is a sub-row showing individual replica
  replicaIndex?: number; // Index within replica group (0, 1, 2...)
}

/**
 * Complete processing result for a gene
 */
export interface GeneProcessingResult {
  geneName: string;
  rows: ProcessingTableRow[];
  firstDeltaCt: number; // Reference ΔCT for ΔΔCT calculation
}

// ============================================================================
// Output / Normalization Types
// ============================================================================

/**
 * Row in the 2^-ΔΔCT values table
 */
export interface FoldChangeTableRow {
  controlName: string;
  controlFoldChange: number;
  observedName: string;
  observedFoldChange: number;
}

/**
 * Row in the normalized values table
 */
export interface NormalizedTableRow {
  controlName: string;
  normalizedControl: number;
  observedName: string;
  normalizedObserved: number;
}

/**
 * Complete output for a gene
 */
export interface GeneOutputResult {
  geneName: string;
  foldChangeRows: FoldChangeTableRow[];
  controlAverage: number;
  normalizedRows: NormalizedTableRow[];
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error with field reference
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Application state
 */
export interface AppState {
  // Input data
  rawData: ParsedTsvData | null;
  config: ProcessingConfig;

  // Derived data
  availableGenes: string[];
  geneDataMap: Map<string, GeneData>;

  // Processing results
  processingResults: Map<string, GeneProcessingResult>;

  // Output results
  outputResults: Map<string, GeneOutputResult>;

  // UI state
  activeGeneTab: string | null;
  validationErrors: ValidationError[];
}

/**
 * State change event types
 */
export type StateChangeType =
  | "data-loaded"
  | "config-changed"
  | "housekeeper-changed"
  | "samples-changed"
  | "processing-complete"
  | "output-complete"
  | "validation-error"
  | "tab-changed";

/**
 * State change event
 */
export interface StateChangeEvent {
  type: StateChangeType;
  payload?: unknown;
}

/**
 * State subscriber callback
 */
export type StateSubscriber = (
  event: StateChangeEvent,
  state: AppState
) => void;
