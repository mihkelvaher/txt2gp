/**
 * Gene Expression Analysis App
 * Main Application Entry Point
 */

import {
  extractGeneNames,
  filterIgnoredRows,
  generateSampleNames,
  setupFileInput,
  triggerFileSelect,
  validateControlList,
  validateHousekeeper,
  validateReplicaCount,
  validateSampleList,
} from "./modules/input";
import { generateAllOutputs } from "./modules/output";
import { buildGeneDataWithGroups, processAllGenes } from "./modules/processing";
import { switchTab } from "./modules/ui/components/tabs";
import {
  clearError,
  displayFilename,
  displayValidationErrors,
  getControlList,
  getReplicaCount,
  getSampleList,
  populateSampleList,
  renderHousekeeperPicker,
  renderHousekeeperTable,
  renderInputTable,
  renderStatusWarnings,
  setupHousekeeperPickerHandlers,
  showError,
  updatePageTitle,
} from "./modules/ui/renderers/input-renderer";
import {
  clearOutputSection,
  renderIgnoredGenes,
  renderOutputSection,
} from "./modules/ui/renderers/output-renderer";
import {
  clearProcessingSection,
  renderProcessingSection,
  setupProcessingTabHandlers,
} from "./modules/ui/renderers/processing-renderer";
import { stateManager, subscribe } from "./modules/ui/state";
import { ParsedTsvData, ValidationError } from "./types";

/**
 * Application Controller
 * Orchestrates all application logic
 */
class App {
  private debounceTimer: number | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the application
   */
  private init(): void {
    this.setupEventListeners();
    this.setupStateSubscription();
    console.log("Gene Expression Analysis App initialized");
  }

  /**
   * Setup DOM event listeners
   */
  private setupEventListeners(): void {
    // File upload button
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => triggerFileSelect(fileInput));
      setupFileInput(fileInput, this.handleFileProcessed.bind(this));
    }

    // Replica count input
    const replicaInput = document.getElementById("replica-count");
    if (replicaInput) {
      replicaInput.addEventListener(
        "change",
        this.handleReplicaCountChange.bind(this)
      );
    }

    // Housekeeper selection
    setupHousekeeperPickerHandlers(this.handleHousekeeperChange.bind(this));

    // Sample list input
    const sampleListInput = document.getElementById("sample-list");
    if (sampleListInput) {
      sampleListInput.addEventListener(
        "input",
        this.debounce(this.handleSampleListChange.bind(this), 500)
      );
    }

    // Control list input
    const controlListInput = document.getElementById("control-list");
    if (controlListInput) {
      controlListInput.addEventListener(
        "input",
        this.debounce(this.handleControlListChange.bind(this), 500)
      );
    }

    // Processing tabs
    setupProcessingTabHandlers(this.handleTabChange.bind(this));
  }

  /**
   * Setup state subscription for reactive updates
   */
  private setupStateSubscription(): void {
    subscribe((event, state) => {
      switch (event.type) {
        case "data-loaded":
          if (state.rawData) {
            this.onDataLoaded(state.rawData);
          }
          break;

        case "housekeeper-changed":
          if (state.rawData) {
            renderHousekeeperTable(state.rawData, state.config.housekeeper);
          }
          this.runProcessing();
          break;

        case "samples-changed":
          this.runProcessing();
          break;

        case "processing-complete":
          renderProcessingSection(state.processingResults, state.activeGeneTab);
          this.runOutput();
          break;

        case "output-complete":
          renderOutputSection(state.outputResults);
          // Show ignored genes (excluding housekeeper - that's expected)
          const processedGenes = Array.from(state.outputResults.keys());
          const ignoredGenes = state.availableGenes.filter(
            (g) => !processedGenes.includes(g) && g !== state.config.housekeeper
          );
          renderIgnoredGenes(ignoredGenes);
          break;

        case "tab-changed":
          if (state.activeGeneTab) {
            switchTab(state.activeGeneTab, "gene-tabs", "processing-content");
          }
          break;

        case "validation-error":
          this.displayErrors(state.validationErrors);
          break;
      }
    });
  }

  /**
   * Handle file processing result
   */
  private handleFileProcessed(result: {
    success: boolean;
    data?: ParsedTsvData;
    error?: string;
    filename?: string;
  }): void {
    if (!result.success || !result.data) {
      showError("file-error", result.error ?? "Failed to process file");
      displayFilename("");
      return;
    }

    clearError("file-error");
    displayFilename(result.filename ?? "");

    // Extract gene names and update state
    const genes = extractGeneNames(result.data);
    stateManager.setRawData(result.data, genes);
  }

  /**
   * Handle data loaded event
   */
  private onDataLoaded(data: ParsedTsvData): void {
    const state = stateManager.getState();

    // Update page title
    updatePageTitle(data.title);

    // Render input table (filtered)
    renderInputTable(data);

    // Render status warnings from original data
    renderStatusWarnings(data);

    // Render housekeeper picker
    renderHousekeeperPicker(state.availableGenes, state.config.housekeeper);

    // Auto-generate sample names based on filtered data
    const filteredData = filterIgnoredRows(data);
    const geneRowCount = filteredData.rows.filter(
      (r) => r["Name"] === state.availableGenes[0]
    ).length;
    const replicaCount = getReplicaCount();
    const sampleNames = generateSampleNames(geneRowCount, replicaCount);

    populateSampleList(sampleNames);
    stateManager.setSamples(sampleNames);

    // Clear processing and output
    clearProcessingSection();
    clearOutputSection();
  }

  /**
   * Handle replica count change
   */
  private handleReplicaCountChange(): void {
    const count = getReplicaCount();
    const validation = validateReplicaCount(count);

    if (!validation.isValid) {
      stateManager.setValidationErrors(validation.errors);
      return;
    }

    stateManager.clearValidationError("replicaCount");
    stateManager.setReplicaCount(count);

    // Regenerate sample names
    const state = stateManager.getState();
    if (state.rawData && state.availableGenes.length > 0) {
      const geneRowCount = state.rawData.rows.filter(
        (r) => r["Name"] === state.availableGenes[0]
      ).length;
      const sampleNames = generateSampleNames(geneRowCount, count);
      populateSampleList(sampleNames);
      stateManager.setSamples(sampleNames);
    }
  }

  /**
   * Handle housekeeper selection change
   */
  private handleHousekeeperChange(geneName: string): void {
    const state = stateManager.getState();
    const validation = validateHousekeeper(geneName, state.availableGenes);

    if (!validation.isValid) {
      stateManager.setValidationErrors(validation.errors);
      return;
    }

    stateManager.clearValidationError("housekeeper");
    stateManager.setHousekeeper(geneName);
  }

  /**
   * Handle sample list change
   */
  private handleSampleListChange(): void {
    const samples = getSampleList();
    const state = stateManager.getState();

    if (!state.rawData) return;

    const geneRowCount = state.rawData.rows.filter(
      (r) => r["Name"] === state.availableGenes[0]
    ).length;

    const validation = validateSampleList(
      samples,
      geneRowCount,
      state.config.replicaCount
    );

    if (!validation.isValid) {
      stateManager.setValidationErrors(validation.errors);
      return;
    }

    stateManager.clearValidationError("sampleList");
    stateManager.setSamples(samples);
  }

  /**
   * Handle control list change
   */
  private handleControlListChange(): void {
    const controls = getControlList();
    const state = stateManager.getState();

    const validation = validateControlList(controls, state.config.samples);

    if (!validation.isValid) {
      stateManager.setValidationErrors(validation.errors);
      return;
    }

    stateManager.clearValidationError("controlList");
    stateManager.setControls(controls);
  }

  /**
   * Handle tab change in processing section
   */
  private handleTabChange(geneName: string): void {
    stateManager.setActiveGeneTab(geneName);
  }

  /**
   * Run processing calculations
   */
  private runProcessing(): void {
    const state = stateManager.getState();

    if (
      !state.rawData ||
      !state.config.housekeeper ||
      state.config.samples.length === 0
    ) {
      clearProcessingSection();
      clearOutputSection();
      return;
    }

    try {
      // Build gene data with replica groups
      const geneDataMap = buildGeneDataWithGroups(
        state.rawData,
        state.config.replicaCount,
        state.config.samples
      );

      stateManager.setGeneDataMap(geneDataMap);

      // Process all target genes
      const results = processAllGenes(
        geneDataMap,
        state.config.housekeeper,
        state.config
      );

      stateManager.setProcessingResults(results);
    } catch (error) {
      console.error("Processing error:", error);
      showError(
        "processing-error",
        error instanceof Error ? error.message : "Processing failed"
      );
    }
  }

  /**
   * Run output/normalization calculations
   */
  private runOutput(): void {
    const state = stateManager.getState();

    if (
      state.processingResults.size === 0 ||
      state.config.controls.length === 0
    ) {
      clearOutputSection();
      return;
    }

    try {
      const outputs = generateAllOutputs(
        state.processingResults,
        state.config.controls,
        state.config.samples
      );

      stateManager.setOutputResults(outputs);
    } catch (error) {
      console.error("Output generation error:", error);
      showError(
        "output-error",
        error instanceof Error ? error.message : "Output generation failed"
      );
    }
  }

  /**
   * Display validation errors in UI
   */
  private displayErrors(errors: ValidationError[]): void {
    const errorMap = new Map<string, string>();

    errors.forEach((error) => {
      errorMap.set(error.field, error.message);
    });

    displayValidationErrors(errorMap);
  }

  /**
   * Debounce utility function
   */
  private debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.debounceTimer !== null) {
        window.clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = window.setTimeout(() => {
        func.apply(this, args);
        this.debounceTimer = null;
      }, wait);
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});

// Export for potential external access
export { App };
