import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { parseCSV, hasContactInfo } from '../services/csv.service';
import { OpenAIService } from '../services/openai.service';
import { ProcessRequest, ImportResult, SkippedRecord } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/import/upload
 * Accept a CSV file, parse it, and return preview data
 */
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a CSV file.',
      });
      return;
    }

    const result = parseCSV(req.file.buffer);

    logger.info('File uploaded and parsed', {
      filename: req.file.originalname,
      size: req.file.size,
      headers: result.headers.length,
      rows: result.totalRows,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Upload failed', { error });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV file',
    });
  }
});

/**
 * POST /api/import/process
 * Accept parsed CSV data, run AI extraction, return CRM records
 * Supports Server-Sent Events (SSE) for progress updates via Accept header
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { headers, rows } = req.body as ProcessRequest;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: headers array is required',
      });
      return;
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: rows array is required',
      });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: 'AI service not configured. Please set OPENAI_API_KEY.',
      });
      return;
    }

    // Check if client wants SSE for progress updates
    const wantsSSE = req.headers.accept === 'text/event-stream';

    if (wantsSSE) {
      // SSE mode for progress updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const aiService = new OpenAIService(apiKey);
      const preSkipped: SkippedRecord[] = [];
      const validRows = rows.filter((row) => {
        if (!hasContactInfo(row)) {
          preSkipped.push({
            row,
            reason: 'No email or mobile number found in record',
          });
          return false;
        }
        return true;
      });

      // Send initial progress
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          processedRecords: 0,
          totalRecords: rows.length,
          message: `Starting AI processing... (${preSkipped.length} records pre-skipped)`,
        })}\n\n`
      );

      if (validRows.length === 0) {
        const result: ImportResult = {
          success: true,
          records: [],
          skipped: preSkipped,
          totalImported: 0,
          totalSkipped: preSkipped.length,
          totalProcessed: rows.length,
        };

        res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
        res.end();
        return;
      }

      const { records, skipped } = await aiService.processRows(
        headers,
        validRows,
        (batchIndex, totalBatches, customMessage) => {
          res.write(
            `data: ${JSON.stringify({
              type: 'progress',
              batchIndex,
              totalBatches,
              processedRecords: Math.min(batchIndex * 2, validRows.length),
              totalRecords: rows.length,
              message: customMessage || `Processing batch ${batchIndex}/${totalBatches}...`,
            })}\n\n`
          );
        }
      );

      const allSkipped = [...preSkipped, ...skipped];
      const result: ImportResult = {
        success: true,
        records,
        skipped: allSkipped,
        totalImported: records.length,
        totalSkipped: allSkipped.length,
        totalProcessed: rows.length,
      };

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } else {
      // Standard JSON response mode
      const aiService = new OpenAIService(apiKey);
      const preSkipped: SkippedRecord[] = [];
      const validRows = rows.filter((row) => {
        if (!hasContactInfo(row)) {
          preSkipped.push({
            row,
            reason: 'No email or mobile number found in record',
          });
          return false;
        }
        return true;
      });

      logger.info('Processing import', {
        totalRows: rows.length,
        validRows: validRows.length,
        preSkipped: preSkipped.length,
      });

      if (validRows.length === 0) {
        const result: ImportResult = {
          success: true,
          records: [],
          skipped: preSkipped,
          totalImported: 0,
          totalSkipped: preSkipped.length,
          totalProcessed: rows.length,
        };
        res.json(result);
        return;
      }

      const { records, skipped } = await aiService.processRows(headers, validRows);
      const allSkipped = [...preSkipped, ...skipped];

      const result: ImportResult = {
        success: true,
        records,
        skipped: allSkipped,
        totalImported: records.length,
        totalSkipped: allSkipped.length,
        totalProcessed: rows.length,
      };

      logger.info('Import complete', {
        imported: result.totalImported,
        skipped: result.totalSkipped,
      });

      res.json(result);
    }
  } catch (error) {
    logger.error('Process failed', { error });

    // Check if headers already sent (SSE mode)
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Processing failed',
        })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'AI processing failed',
      });
    }
  }
});

export default router;
