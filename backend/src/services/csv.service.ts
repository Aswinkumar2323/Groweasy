import { parse } from 'csv-parse/sync';
import { CSVRow, ParseResult } from '../types';
import logger from '../utils/logger';

/**
 * Parse a CSV buffer into structured rows
 */
export function parseCSV(buffer: Buffer): ParseResult {
  try {
    const content = buffer.toString('utf-8');

    // Use csv-parse with flexible options to handle various CSV formats
    const records: CSVRow[] = parse(content, {
      columns: true,            // Use first row as headers
      skip_empty_lines: true,   // Skip blank lines
      trim: true,               // Trim whitespace
      relax_quotes: true,       // Handle imperfect quoting
      relax_column_count: true, // Allow rows with varying column counts
      bom: true,                // Handle BOM markers
      cast: false,              // Keep everything as strings
    });

    if (records.length === 0) {
      throw new Error('CSV file contains no data rows');
    }

    // Extract headers from the first record's keys
    const headers = Object.keys(records[0]);

    if (headers.length === 0) {
      throw new Error('CSV file contains no columns');
    }

    logger.info(`CSV parsed successfully`, {
      headers: headers.length,
      rows: records.length,
    });

    return {
      headers,
      rows: records,
      totalRows: records.length,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('CSV file')) {
      throw error;
    }
    logger.error('CSV parsing failed', { error });
    throw new Error(
      `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate that a row has at least an email or mobile number
 * We check common column name patterns since we don't know the exact headers
 */
export function hasContactInfo(row: CSVRow): boolean {
  const values = Object.entries(row);

  for (const [key, value] of values) {
    if (!value || value.trim() === '') continue;

    const lowerKey = key.toLowerCase();
    const trimmedValue = value.trim();

    // Check for email-like fields
    if (
      lowerKey.includes('email') ||
      lowerKey.includes('e-mail') ||
      lowerKey.includes('mail')
    ) {
      // Basic email validation
      if (trimmedValue.includes('@') && trimmedValue.includes('.')) {
        return true;
      }
    }

    // Check for phone/mobile-like fields
    if (
      lowerKey.includes('phone') ||
      lowerKey.includes('mobile') ||
      lowerKey.includes('cell') ||
      lowerKey.includes('tel') ||
      lowerKey.includes('contact') ||
      lowerKey.includes('number') ||
      lowerKey.includes('whatsapp')
    ) {
      // Basic phone validation (at least 7 digits)
      const digits = trimmedValue.replace(/\D/g, '');
      if (digits.length >= 7) {
        return true;
      }
    }
  }

  // Also check values directly for email/phone patterns even if column names don't match
  for (const [, value] of values) {
    if (!value || value.trim() === '') continue;
    const trimmedValue = value.trim();

    // Check for email pattern in any field
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      return true;
    }

    // Check for phone pattern in any field (10+ digits with optional formatting)
    const digits = trimmedValue.replace(/\D/g, '');
    if (digits.length >= 10 && /^[\d\s\-\+\(\)\.]+$/.test(trimmedValue)) {
      return true;
    }
  }

  return false;
}
