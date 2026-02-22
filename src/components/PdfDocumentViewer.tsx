import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Box, Typography, IconButton, Chip, Tooltip, CircularProgress,
} from '@mui/material';
import {
  NavigateBefore, NavigateNext, ZoomIn, ZoomOut, AutoAwesome, Layers, LayersClear,
} from '@mui/icons-material';
import { BLOOM } from '../theme';

// Use Vite's import.meta.url so the worker is bundled/resolved correctly
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ── AI field highlight annotations (approximate positions for ACORD-style form)
// Positions are % of rendered page width/height — adjust to match actual document.
interface FieldAnnotation {
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
  page?: number; // if undefined, shown on all pages
}

const ANNOTATIONS: FieldAnnotation[] = [
  // ── Section 1: Proposed Insured ─────────────────────────────────────────────
  { label: 'Full Name',           top: 13.0, left: 5,  width: 35, height: 2.8, color: BLOOM.blue },
  { label: 'Date of Birth ⚠',    top: 13.0, left: 42, width: 22, height: 2.8, color: BLOOM.red   },
  { label: 'Gender',              top: 13.0, left: 66, width: 18, height: 2.8, color: BLOOM.blue },
  { label: 'SSN',                 top: 18.5, left: 5,  width: 28, height: 2.8, color: BLOOM.blue },
  { label: 'Address',             top: 23.0, left: 5,  width: 55, height: 2.8, color: BLOOM.blue },
  { label: 'Occupation',          top: 28.5, left: 5,  width: 38, height: 2.8, color: BLOOM.blue },
  { label: 'Annual Income ◐',    top: 28.5, left: 46, width: 30, height: 2.8, color: BLOOM.orange },
  // ── Section 2: Coverage ─────────────────────────────────────────────────────
  { label: 'Product Type',        top: 40.0, left: 5,  width: 30, height: 2.8, color: BLOOM.blue },
  { label: 'Face Amount',         top: 40.0, left: 38, width: 25, height: 2.8, color: BLOOM.blue },
  { label: 'Premium Mode',        top: 45.0, left: 5,  width: 28, height: 2.8, color: BLOOM.blue },
  // ── Section 3: Medical ──────────────────────────────────────────────────────
  { label: 'Pre-existing Cond.',  top: 55.0, left: 5,  width: 50, height: 2.8, color: BLOOM.blue },
  { label: 'Tobacco Use',         top: 63.0, left: 5,  width: 25, height: 2.8, color: BLOOM.blue },
  // ── Section 4: Beneficiary ──────────────────────────────────────────────────
  { label: 'Primary Beneficiary', top: 74.0, left: 5,  width: 42, height: 2.8, color: BLOOM.blue },
];

interface Props {
  pdfUrl: string;
  confidenceScore?: number;
  fieldsExtracted?: number;
  totalFields?: number;
}

export default function PdfDocumentViewer({
  pdfUrl,
  confidenceScore = 98,
  fieldsExtracted = 91,
  totalFields = 92,
}: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [showHighlights, setShowHighlights] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Base render width — fills the panel nicely at 1x zoom
  const BASE_WIDTH = 490;

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setLoadError(true);
  }, []);

  const pageAnnotations = ANNOTATIONS.filter(a => !a.page || a.page === pageNumber);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${BLOOM.border}`,
    }}>

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 1.5, py: 0.875,
        bgcolor: BLOOM.canvas,
        display: 'flex', alignItems: 'center', gap: 1,
        borderBottom: `1px solid ${BLOOM.border}`,
        flexShrink: 0,
      }}>
        <Typography sx={{
          fontSize: '0.6875rem', fontWeight: 700, color: BLOOM.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1,
        }}>
          Source Document
        </Typography>
        <Chip
          icon={<AutoAwesome sx={{ fontSize: 11 }} />}
          label={`${confidenceScore}% confidence · ${fieldsExtracted}/${totalFields} fields`}
          size="small"
          sx={{
            fontSize: '0.5625rem', bgcolor: BLOOM.greenPale, color: BLOOM.green,
            border: `1px solid ${BLOOM.green}44`, height: 20,
            '& .MuiChip-icon': { color: BLOOM.green },
          }}
        />
        <Tooltip title={showHighlights ? 'Hide AI field highlights' : 'Show AI field highlights'}>
          <IconButton
            size="small"
            onClick={() => setShowHighlights(h => !h)}
            sx={{ color: showHighlights ? BLOOM.blue : BLOOM.grey, p: 0.5 }}
          >
            {showHighlights
              ? <Layers sx={{ fontSize: 16 }} />
              : <LayersClear sx={{ fontSize: 16 }} />
            }
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Page navigation + zoom ──────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 1.5, py: 0.375,
        bgcolor: '#fff',
        borderBottom: `1px solid ${BLOOM.border}`,
        flexShrink: 0,
      }}>
        {/* Pagination */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            sx={{ p: 0.375 }}
          >
            <NavigateBefore sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 78, textAlign: 'center' }}>
            {numPages ? `Page ${pageNumber} of ${numPages}` : '—'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPageNumber(p => Math.min(numPages ?? 1, p + 1))}
            disabled={pageNumber >= (numPages ?? 1)}
            sx={{ p: 0.375 }}
          >
            <NavigateNext sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Zoom */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton size="small" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)))} sx={{ p: 0.375 }}>
            <ZoomOut sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 44, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton size="small" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))} sx={{ p: 0.375 }}>
            <ZoomIn sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── PDF canvas area ─────────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        bgcolor: '#525659',
        display: 'flex',
        justifyContent: 'center',
        py: 2,
        px: 1,
      }}>
        {/* Loading state (before document mounts) */}
        {loading && !loadError && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, pt: 8 }}>
            <CircularProgress size={28} sx={{ color: BLOOM.blue }} />
            <Typography sx={{ fontSize: '0.8125rem', color: '#ccc' }}>Loading document…</Typography>
          </Box>
        )}

        {loadError && (
          <Box sx={{ pt: 8, px: 3, textAlign: 'center', color: '#ccc' }}>
            <Typography sx={{ fontSize: '0.8125rem' }}>Unable to load document.</Typography>
            <Typography sx={{ fontSize: '0.75rem', mt: 0.5, opacity: 0.7 }}>
              Ensure the PDF is served from the public folder.
            </Typography>
          </Box>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
        >
          <Box sx={{
            position: 'relative',
            display: 'inline-block',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            <Page
              pageNumber={pageNumber}
              width={Math.round(BASE_WIDTH * zoom)}
              renderTextLayer
              renderAnnotationLayer
            />

            {/* AI field highlight overlays */}
            {showHighlights && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {pageAnnotations.map((ann) => (
                  <Box
                    key={ann.label}
                    sx={{
                      position: 'absolute',
                      top: `${ann.top}%`,
                      left: `${ann.left}%`,
                      width: `${ann.width}%`,
                      height: `${ann.height}%`,
                      border: `1.5px solid ${ann.color}`,
                      borderRadius: '3px',
                      bgcolor: `${ann.color}18`,
                    }}
                  >
                    <Typography sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: 'translateY(-100%)',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      color: '#fff',
                      bgcolor: ann.color,
                      px: 0.5,
                      py: 0.125,
                      borderRadius: '2px 2px 2px 0',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                    }}>
                      {ann.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Document>
      </Box>

      {/* ── Highlight legend ────────────────────────────────────────────────── */}
      {showHighlights && (
        <Box sx={{
          px: 1.5, py: 0.75,
          bgcolor: BLOOM.canvas,
          borderTop: `1px solid ${BLOOM.border}`,
          display: 'flex', gap: 2, flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {[
            { color: BLOOM.blue,   label: 'Extracted — high confidence' },
            { color: BLOOM.orange, label: 'Low confidence — review' },
            { color: BLOOM.red,    label: 'Validation error' },
          ].map(({ color, label }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, border: `2px solid ${color}`, borderRadius: '2px', bgcolor: `${color}18`, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.5625rem', color: BLOOM.textSecondary }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
