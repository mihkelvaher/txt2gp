/**
 * File Handler Module
 * Manages file upload and reading operations
 */

import { ParsedTsvData } from "../../types";
import { parseTsv, validateTsvData } from "./tsv-parser";

/**
 * Result of file processing
 */
export interface FileProcessingResult {
  success: boolean;
  data?: ParsedTsvData;
  error?: string;
  filename?: string;
}

/**
 * Read and parse a file
 * @param file File object from file input
 * @returns Promise resolving to processing result
 */
export async function processFile(file: File): Promise<FileProcessingResult> {
  try {
    // Validate file type
    if (!isValidFileType(file)) {
      return {
        success: false,
        error: "Invalid file type. Please select a .txt or .tsv file.",
      };
    }

    // Read file content
    const content = await readFileContent(file);

    // Parse TSV
    const parsedData = parseTsv(content);

    // Validate parsed data
    const validation = validateTsvData(parsedData);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map((e) => e.message).join("; "),
      };
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error processing file",
    };
  }
}

/**
 * Read file content as text
 * @param file File object
 * @returns Promise resolving to file content string
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        resolve(content);
      } else {
        reject(new Error("Failed to read file content"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Check if file type is valid
 * @param file File object
 * @returns Whether file type is acceptable
 */
function isValidFileType(file: File): boolean {
  const validExtensions = [".txt", ".tsv"];
  const fileName = file.name.toLowerCase();

  return validExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Setup file input handler
 * @param fileInput File input element
 * @param onFileProcessed Callback when file is processed
 */
export function setupFileInput(
  fileInput: HTMLInputElement,
  onFileProcessed: (result: FileProcessingResult) => void
): void {
  fileInput.addEventListener("change", async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      const result = await processFile(file);
      result.filename = file.name;
      onFileProcessed(result);
    }
  });
}

/**
 * Trigger file input click
 * @param fileInput File input element
 */
export function triggerFileSelect(fileInput: HTMLInputElement): void {
  fileInput.click();
}
