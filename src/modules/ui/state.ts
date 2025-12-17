/**
 * State Management Module
 * Centralized application state with pub/sub pattern
 */

import {
  AppState,
  GeneData,
  GeneOutputResult,
  GeneProcessingResult,
  ParsedTsvData,
  StateChangeEvent,
  StateSubscriber,
  ValidationError,
} from "../../types";

/**
 * Create initial application state
 */
function createInitialState(): AppState {
  return {
    rawData: null,
    config: {
      replicaCount: 3,
      housekeeper: "",
      samples: [],
      controls: [],
    },
    availableGenes: [],
    geneDataMap: new Map(),
    processingResults: new Map(),
    outputResults: new Map(),
    activeGeneTab: null,
    validationErrors: [],
  };
}

/**
 * State Manager class
 * Implements centralized state management with pub/sub
 */
class StateManager {
  private state: AppState;
  private subscribers: Set<StateSubscriber>;

  constructor() {
    this.state = createInitialState();
    this.subscribers = new Set();
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<AppState> {
    return this.state;
  }

  /**
   * Subscribe to state changes
   * @param subscriber Callback function
   * @returns Unsubscribe function
   */
  subscribe(subscriber: StateSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Notify all subscribers of a state change
   */
  private notify(event: StateChangeEvent): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(event, this.state);
      } catch (error) {
        console.error("State subscriber error:", error);
      }
    });
  }

  /**
   * Set raw data from file upload
   */
  setRawData(data: ParsedTsvData, genes: string[]): void {
    this.state.rawData = data;
    this.state.availableGenes = genes;
    this.state.geneDataMap.clear();
    this.state.processingResults.clear();
    this.state.outputResults.clear();
    this.state.validationErrors = [];

    this.notify({ type: "data-loaded", payload: data });
  }

  /**
   * Update replica count
   */
  setReplicaCount(count: number): void {
    this.state.config.replicaCount = count;
    this.notify({ type: "config-changed", payload: { replicaCount: count } });
  }

  /**
   * Set housekeeper gene
   */
  setHousekeeper(geneName: string): void {
    this.state.config.housekeeper = geneName;
    this.state.processingResults.clear();
    this.state.outputResults.clear();

    this.notify({ type: "housekeeper-changed", payload: geneName });
  }

  /**
   * Set sample names
   */
  setSamples(samples: string[]): void {
    this.state.config.samples = samples;
    this.state.processingResults.clear();
    this.state.outputResults.clear();

    this.notify({ type: "samples-changed", payload: samples });
  }

  /**
   * Set control samples
   */
  setControls(controls: string[]): void {
    this.state.config.controls = controls;
    this.state.outputResults.clear();

    this.notify({ type: "samples-changed", payload: controls });
  }

  /**
   * Update gene data map
   */
  setGeneDataMap(dataMap: Map<string, GeneData>): void {
    this.state.geneDataMap = dataMap;
  }

  /**
   * Set processing results
   */
  setProcessingResults(results: Map<string, GeneProcessingResult>): void {
    this.state.processingResults = results;

    // Set first gene as active tab if not set
    if (!this.state.activeGeneTab && results.size > 0) {
      this.state.activeGeneTab = Array.from(results.keys())[0];
    }

    this.notify({ type: "processing-complete", payload: results });
  }

  /**
   * Set output results
   */
  setOutputResults(results: Map<string, GeneOutputResult>): void {
    this.state.outputResults = results;
    this.notify({ type: "output-complete", payload: results });
  }

  /**
   * Set active gene tab
   */
  setActiveGeneTab(geneName: string): void {
    this.state.activeGeneTab = geneName;
    this.notify({ type: "tab-changed", payload: geneName });
  }

  /**
   * Set validation errors
   */
  setValidationErrors(errors: ValidationError[]): void {
    this.state.validationErrors = errors;
    this.notify({ type: "validation-error", payload: errors });
  }

  /**
   * Clear specific validation error
   */
  clearValidationError(field: string): void {
    this.state.validationErrors = this.state.validationErrors.filter(
      (e) => e.field !== field
    );
  }

  /**
   * Add validation error
   */
  addValidationError(error: ValidationError): void {
    // Remove existing error for the same field
    this.clearValidationError(error.field);
    this.state.validationErrors.push(error);
    this.notify({
      type: "validation-error",
      payload: this.state.validationErrors,
    });
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.state = createInitialState();
    this.notify({ type: "data-loaded", payload: null });
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Convenience exports
export const getState = () => stateManager.getState();
export const subscribe = (subscriber: StateSubscriber) =>
  stateManager.subscribe(subscriber);
