/**
 * TSV Parser Module
 * Handles parsing of tab-separated value files
 */

import {
  ParsedTsvData,
  RawDataRow,
  ValidationError,
  ValidationResult,
} from "../../types";

/**
 * Parse TSV content into structured data
 * @param content Raw TSV file content
 * @returns Parsed data structure
 */
export function parseTsv(content: string): ParsedTsvData {
  const lines = content.trim().split(/\r?\n/);

  if (lines.length < 3) {
    throw new Error(
      "Invalid file format: File must have at least 3 rows (title, headers, data)"
    );
  }

  // First row is the title
  const title = lines[0].trim();

  // Second row contains headers
  const headers = lines[1].split("\t").map((h) => h.trim());

  // Remaining rows are data
  const rows: RawDataRow[] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split("\t");
    const row: RawDataRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    rows.push(row);
  }

  return { title, headers, rows };
}

/**
 * Validate parsed TSV data
 * @param data Parsed TSV data
 * @returns Validation result
 */
export function validateTsvData(data: ParsedTsvData): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for required 'Name' column
  if (!data.headers.includes("Name")) {
    errors.push({
      field: "headers",
      message: 'Missing required "Name" column in data',
    });
  }

  // Check for CT value column (typically the second column with numeric values)
  const hasCtColumn = data.headers.some(
    (h) =>
      h.toLowerCase().includes("ct") ||
      data.rows.some((row) => !isNaN(parseFloat(row[h])))
  );

  if (!hasCtColumn && data.headers.length < 2) {
    errors.push({
      field: "headers",
      message: "Data must contain CT value columns",
    });
  }

  // Check for data rows
  if (data.rows.length === 0) {
    errors.push({
      field: "rows",
      message: "No data rows found in file",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract unique gene names from parsed data
 * @param data Parsed TSV data
 * @returns Array of unique gene names
 */
export function extractGeneNames(data: ParsedTsvData): string[] {
  const nameColumn = "Name";
  const names = new Set<string>();

  data.rows.forEach((row) => {
    const name = row[nameColumn];
    if (name && name.trim() && !shouldIgnoreRow(row)) {
      names.add(name.trim());
    }
  });

  return Array.from(names);
}

/**
 * Get CT values for a specific gene
 * @param data Parsed TSV data
 * @param geneName Gene name to filter by
 * @param ctColumnIndex Index of the CT value column (defaults to second column)
 * @returns Array of CT values
 */
export function getGeneCtValues(
  data: ParsedTsvData,
  geneName: string,
  ctColumnIndex: number = 1
): number[] {
  const nameColumn = "Name";
  const ctColumn = data.headers[ctColumnIndex];

  return data.rows
    .filter((row) => row[nameColumn] === geneName)
    .map((row) => parseFloat(row[ctColumn]))
    .filter((val) => !isNaN(val));
}

/**
 * Check if a row should be ignored (Sample + number pattern)
 * @param row Data row
 * @returns Whether the row should be ignored
 */
export function shouldIgnoreRow(row: RawDataRow): boolean {
  const name = row["Name"] ?? "";
  // Match "Sample" followed by optional space and a number
  return /^Sample\s*\d+$/i.test(name.trim());
}

/**
 * Filter out ignored rows from data
 * @param data Parsed TSV data
 * @returns New data with filtered rows
 */
export function filterIgnoredRows(data: ParsedTsvData): ParsedTsvData {
  return {
    ...data,
    rows: data.rows.filter((row) => !shouldIgnoreRow(row)),
  };
}

/**
 * Filter rows by gene name
 * @param data Parsed TSV data
 * @param geneName Gene name to filter by
 * @returns Filtered rows
 */
export function filterRowsByGene(
  data: ParsedTsvData,
  geneName: string
): RawDataRow[] {
  return data.rows.filter(
    (row) => row["Name"] === geneName && !shouldIgnoreRow(row)
  );
}

/**
 * Extract unique non-empty status warnings from data
 * @param data Parsed TSV data (original, before filtering)
 * @returns Array of unique status warning messages
 */
export function extractStatusWarnings(data: ParsedTsvData): string[] {
  const statusColumn = "Status";
  const warnings = new Set<string>();

  data.rows.forEach((row) => {
    const status = row[statusColumn]?.trim();
    if (status && status.length > 0) {
      warnings.add(status);
    }
  });

  return Array.from(warnings);
}

/**
 * Get the CT column header (looks for Cp, CT, or similar columns)
 * @param data Parsed TSV data
 * @returns CT column header name
 */
export function detectCtColumn(data: ParsedTsvData): string | null {
  // Priority order for CT column names
  const ctColumnNames = ["cp", "ct", "cq"];

  // First, look for exact match (case-insensitive)
  for (const name of ctColumnNames) {
    const header = data.headers.find((h) => h.toLowerCase() === name);
    if (header) return header;
  }

  // Then look for columns containing these names
  for (const name of ctColumnNames) {
    const header = data.headers.find((h) => h.toLowerCase().includes(name));
    if (header) return header;
  }

  // Otherwise, find the first numeric column after Name that has decimal values
  // (to avoid picking integer columns like Color)
  for (const header of data.headers) {
    if (header === "Name") continue;

    const hasDecimalValues = data.rows.some((row) => {
      const val = row[header];
      if (!val) return false;
      const num = parseFloat(val);
      // Check if it's a decimal number (has decimal point in original string)
      return !isNaN(num) && num > 0 && val.includes(".");
    });

    if (hasDecimalValues) return header;
  }

  return null;
}
