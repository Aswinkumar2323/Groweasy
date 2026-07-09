import OpenAI from 'openai';
import Bottleneck from 'bottleneck';
import { CSVRow, CRMRecord, BatchResult, SkippedRecord } from '../types';
import { withRetry } from '../utils/retry';
import logger from '../utils/logger';

const BATCH_SIZE = 5; // Reduced for better visual progress reporting during demo

// Global rate limiter for OpenAI API
const openaiLimiter = new Bottleneck({
  minTime: 200, // Safe rate limiting for OpenAI 
  maxConcurrent: 5,
});

/**
 * System prompt for CRM field extraction
 */
const SYSTEM_PROMPT = `You are an AI assistant that extracts customer relationship management (CRM) records from CSV data.

Your goal is to parse messy CSV rows and map them strictly to the requested CRM format.

RULES:
1. Extract first and last names carefully.
2. Standardize country codes for phone numbers (assume +91 if Indian city, +1 if US, etc., if not present).
3. If multiple phone numbers or emails exist in a single cell, use the first/primary one for the respective field. Append any remaining emails or numbers into the "crm_note" field.
4. "created_at" must be in ISO 8601 format. If none provided, use the current timestamp.
5. Identify the "crm_status" based on notes/remarks. Must be one of: 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'.
6. Identify the "data_source" if obvious from the row, otherwise leave empty. Must be one of: 'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'.
7. Combine any extra columns into a readable "description".
8. DO NOT hallucinate data. If a field is missing, leave it as an empty string.

You must return a valid JSON object matching this schema exactly:
{
  "records": [
    {
      "created_at": "string (ISO Date)",
      "name": "string",
      "email": "string",
      "country_code": "string",
      "mobile_without_country_code": "string",
      "company": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "lead_owner": "string",
      "crm_status": "string or empty",
      "crm_note": "string",
      "data_source": "string or empty",
      "possession_time": "string",
      "description": "string"
    }
  ],
  "skipped": [
    {
      "rowIndex": 0,
      "reason": "Reason for skipping (e.g. absolutely no name, email, or phone)"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. Do not include markdown code blocks.`;

/**
 * OpenAIService handles AI-powered CRM field extraction
 */
export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Process all rows in batches with AI extraction
   */
  async processRows(
    headers: string[],
    rows: CSVRow[],
    onProgress?: (batchIndex: number, totalBatches: number, message?: string) => void
  ): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
    const batches = this.createBatches(rows, BATCH_SIZE);
    const allRecords: CRMRecord[] = [];
    const allSkipped: SkippedRecord[] = [];

    logger.info(`Processing ${rows.length} rows in ${batches.length} batches`);

    let completedBatches = 0;
    
    // Process batches concurrently for blazing fast speed
    const batchPromises = batches.map(async (batch, i) => {
      try {
        const result = await this.processBatch(headers, batch, i, batches.length, onProgress);
        
        // Safely push to shared arrays (JS is single-threaded, so this is safe)
        allRecords.push(...result.records);
        allSkipped.push(...result.skipped);

        completedBatches++;
        if (onProgress) {
          onProgress(completedBatches, batches.length, `Completed batch ${completedBatches} of ${batches.length}`);
        }
      } catch (error) {
        logger.error(`Batch ${i + 1} failed completely`, { error });
        for (const row of batch) {
          allSkipped.push({
            row,
            reason: `AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
        completedBatches++;
        if (onProgress) {
          onProgress(completedBatches, batches.length, `Batch ${i + 1} failed. Continuing...`);
        }
      }
    });

    await Promise.all(batchPromises);

    return { records: allRecords, skipped: allSkipped };
  }

  /**
   * Process a single batch of rows through OpenAI
   */
  private async processBatch(
    headers: string[],
    rows: CSVRow[],
    batchIndex: number,
    totalBatches: number,
    onProgress?: (batchIndex: number, totalBatches: number, message?: string) => void
  ): Promise<BatchResult> {
    
    // MOCK MODE FOR TESTING UI WITHOUT API KEY
    if (process.env.MOCK_AI_MODE === 'true') {
      logger.info(`Running in MOCK_AI_MODE for batch ${batchIndex + 1}`);
      // Stagger the delays so the UI updates smoothly one by one
      await new Promise(r => setTimeout(r, 1000 + (batchIndex * 1500)));
      
      const records: CRMRecord[] = rows.map((row, i) => ({
        created_at: new Date().toISOString(),
        name: row.name || row['First Name'] || `Mock User ${i}`,
        email: row.email || row.email_id || row['Email Address'] || 'mock@example.com',
        country_code: '+91',
        mobile_without_country_code: (row.phone || row.mobile_number || '9999999999').replace(/\\D/g, '').slice(-10),
        company: row.company || row['Company Name'] || 'Mock Company',
        city: row.city || 'Mock City',
        state: row.state || 'Mock State',
        country: row.country || 'Mock Country',
        lead_owner: 'Mock Owner',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: row.notes || row.remarks || 'Mocked note',
        data_source: 'leads_on_demand',
        possession_time: row.possession_date || '',
        description: 'Mock extracted data'
      }));

      return {
        records,
        skipped: [],
        batchIndex,
        totalBatches
      };
    }

    const userPrompt = this.buildUserPrompt(headers, rows);

    const result = await withRetry(
      async () => {
        return openaiLimiter.schedule(async () => {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          });

          const text = response.choices[0]?.message?.content || '{}';
          return this.parseAIResponse(text, rows);
        });
      },
      5,
      1000,
      `Batch ${batchIndex + 1}/${totalBatches}`,
      (delayMs, attempt, maxRetries, isRateLimit) => {
        // Only report retry progress if we have a way to do it without messing up the completedBatches count.
        // For concurrent processing, we just let it retry silently to keep the progress bar smooth.
      }
    );

    logger.info(
      `Batch ${batchIndex + 1}/${totalBatches}: ${result.records.length} records, ${result.skipped.length} skipped`
    );

    return {
      ...result,
      batchIndex,
      totalBatches,
    };
  }

  /**
   * Build the user prompt with CSV data
   */
  private buildUserPrompt(headers: string[], rows: CSVRow[]): string {
    return `Extract CRM records from the following CSV data.

CSV HEADERS: ${JSON.stringify(headers)}

CSV ROWS (${rows.length} records):
${JSON.stringify(rows, null, 2)}`;
  }

  /**
   * Parse the AI JSON response and map it to CRMRecord objects
   */
  private parseAIResponse(
    responseString: string,
    originalRows: CSVRow[]
  ): { records: CRMRecord[]; skipped: SkippedRecord[] } {
    try {
      // Remove any markdown code blocks if the AI accidentally added them
      const cleanJson = responseString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(cleanJson);

      const records: CRMRecord[] = parsed.records || [];
      const aiSkipped = parsed.skipped || [];

      // Map AI skipped indices back to original rows
      const skipped: SkippedRecord[] = aiSkipped.map((skip: any) => {
        const rowIndex = skip.rowIndex;
        return {
          row: originalRows[rowIndex] || {},
          reason: skip.reason || 'Skipped by AI extraction',
        };
      });

      return { records, skipped };
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error,
        responseString,
      });
      throw new Error('AI returned invalid JSON format');
    }
  }

  /**
   * Split rows into manageable batches
   */
  private createBatches(rows: CSVRow[], size: number): CSVRow[][] {
    const batches: CSVRow[][] = [];
    for (let i = 0; i < rows.length; i += size) {
      batches.push(rows.slice(i, i + size));
    }
    return batches;
  }
}
