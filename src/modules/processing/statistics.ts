/**
 * Statistics Module
 * Provides statistical calculation functions
 */

/**
 * Calculate the arithmetic mean of an array of numbers
 * @param values Array of numeric values
 * @returns Mean value
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the sample standard deviation
 * @param values Array of numeric values
 * @returns Standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance =
    squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate population standard deviation
 * @param values Array of numeric values
 * @returns Population standard deviation
 */
export function populationStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance =
    squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calculate combined standard deviation for two independent measurements
 * Formula: sqrt(std1^2 + std2^2)
 * @param std1 First standard deviation
 * @param std2 Second standard deviation
 * @returns Combined standard deviation
 */
export function combinedStandardDeviation(std1: number, std2: number): number {
  return Math.sqrt(Math.pow(std1, 2) + Math.pow(std2, 2));
}

/**
 * Calculate Standard Error of the Mean (SEM)
 * Formula: combinedStd / sqrt((n1 + n2) / 2)
 * @param combinedStd Combined standard deviation
 * @param n1 Count of first group
 * @param n2 Count of second group
 * @returns SEM value
 */
export function sem(combinedStd: number, n1: number, n2: number): number {
  if (n1 + n2 === 0) return 0;
  return combinedStd / Math.sqrt((n1 + n2) / 2);
}

/**
 * Calculate fold change from delta-delta CT
 * Formula: 2^(-deltaDeltaCt)
 * @param deltaDeltaCt Delta-delta CT value
 * @returns Fold change (2^-ΔΔCT)
 */
export function foldChange(deltaDeltaCt: number): number {
  return Math.pow(2, -deltaDeltaCt);
}

/**
 * Round a number to a specified number of decimal places
 * @param value Value to round
 * @param decimals Number of decimal places
 * @returns Rounded value
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format a number for display with fixed decimal places
 * @param value Value to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return "-";
  return value.toFixed(decimals);
}
