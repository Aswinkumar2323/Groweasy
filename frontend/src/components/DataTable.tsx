'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CSVRow } from '@/types';

interface DataTableProps {
  headers: string[];
  rows: CSVRow[];
  maxHeight?: string;
}

export default function DataTable({
  headers,
  rows,
  maxHeight = '450px',
}: DataTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set up the virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 45, // Estimated row height in px
    overscan: 10,
  });

  return (
    <div className="table-container fade-in" id="data-preview-table">
      <div
        className="table-scroll-wrapper"
        ref={scrollRef}
        style={{ maxHeight, overflowY: 'auto' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th className="table-row-index">#</th>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
              display: 'block', // Required for virtualization positioning
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'flex', // Ensures children layout correctly in block container
                  }}
                >
                  <td className="table-row-index" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {virtualRow.index + 1}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={`${virtualRow.index}-${header}`}
                      title={row[header] || ''}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {row[header] || '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-info-bar">
        <span>
          Showing {rows.length} row{rows.length !== 1 ? 's' : ''} (Virtualized) · {headers.length}{' '}
          column{headers.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Scroll horizontally to see all columns →
        </span>
      </div>
    </div>
  );
}
