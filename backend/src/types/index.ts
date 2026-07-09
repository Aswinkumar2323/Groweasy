/**
 * CRM Record interface matching GrowEasy CRM format
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
  crm_status: CRMStatus | '';
  crm_note: string;
  data_source: DataSource | '';
  possession_time: string;
  description: string;
}

/**
 * Allowed CRM status values
 */
export type CRMStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

/**
 * Allowed data source values
 */
export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

/**
 * Raw CSV row as key-value pairs
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Result of CSV parsing
 */
export interface ParseResult {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

/**
 * Result of AI extraction for a single batch
 */
export interface BatchResult {
  records: CRMRecord[];
  skipped: SkippedRecord[];
  batchIndex: number;
  totalBatches: number;
}

/**
 * A record that was skipped during processing
 */
export interface SkippedRecord {
  row: CSVRow;
  reason: string;
}

/**
 * Full import result returned to the client
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
 * Progress update sent via SSE
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
 * API error response
 */
export interface APIError {
  success: false;
  error: string;
  details?: string;
}

/**
 * Upload response with parsed CSV preview
 */
export interface UploadResponse {
  success: true;
  data: ParseResult;
}

/**
 * Process request body
 */
export interface ProcessRequest {
  headers: string[];
  rows: CSVRow[];
}
