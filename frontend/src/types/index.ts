/**
 * CRM Record matching GrowEasy CRM format
 */
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

/**
 * Skipped record with reason
 */
export interface SkippedRecord {
  row: Record<string, string>;
  reason: string;
}

/**
 * CSV row as key-value pairs
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Parsed CSV result
 */
export interface ParseResult {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

/**
 * Import result from backend
 */
export interface ImportResult {
  success: boolean;
  records: CRMRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalProcessed: number;
}

/**
 * SSE progress update
 */
export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'error';
  batchIndex?: number;
  totalBatches?: number;
  processedRecords?: number;
  totalRecords?: number;
  message?: string;
  result?: ImportResult;
}

/**
 * Application step
 */
export type AppStep = 'upload' | 'preview' | 'processing' | 'results';

/**
 * CRM field display configuration
 */
export interface CRMFieldConfig {
  key: keyof CRMRecord;
  label: string;
  width: number;
}

/**
 * CRM field display configurations
 */
export const CRM_FIELDS: CRMFieldConfig[] = [
  { key: 'created_at', label: 'Created At', width: 170 },
  { key: 'name', label: 'Name', width: 150 },
  { key: 'email', label: 'Email', width: 220 },
  { key: 'country_code', label: 'Code', width: 70 },
  { key: 'mobile_without_country_code', label: 'Mobile', width: 130 },
  { key: 'company', label: 'Company', width: 150 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'state', label: 'State', width: 120 },
  { key: 'country', label: 'Country', width: 100 },
  { key: 'lead_owner', label: 'Lead Owner', width: 180 },
  { key: 'crm_status', label: 'Status', width: 190 },
  { key: 'crm_note', label: 'Notes', width: 250 },
  { key: 'data_source', label: 'Source', width: 140 },
  { key: 'possession_time', label: 'Possession', width: 130 },
  { key: 'description', label: 'Description', width: 200 },
];
