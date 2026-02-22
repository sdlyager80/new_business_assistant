import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Box, Typography, IconButton, Chip, Tooltip, CircularProgress,
} from '@mui/material';
import {
  NavigateBefore, NavigateNext, ZoomIn, ZoomOut, AutoAwesome, Layers, LayersClear,
  MyLocation, ContentCopy,
} from '@mui/icons-material';
import { BLOOM } from '../theme';

// Use Vite's import.meta.url so the worker is bundled/resolved correctly
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ── AI field highlight annotations
// Coordinates derived from OCR at 150 DPI, converted to % of page (612×792 pts).
// Formula: left=x0/612*100, top=y0/792*100, width=(x1-x0)/612*100, height min 2.0%
interface FieldAnnotation {
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
  page?: number;
}

const H = 2.0; // minimum box height %

const ANNOTATIONS: FieldAnnotation[] = [
  // ── Page 1 · Annuitant ────────────────────────────────────────────────────
  { label: 'First Name',     page: 1, top: 25.4, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Middle',         page: 1, top: 27.1, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Last Name',      page: 1, top: 28.9, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Address',        page: 1, top: 30.7, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'City',           page: 1, top: 32.4, left: 19.6, width: 16.3, height: H, color: BLOOM.blue },
  { label: 'State',          page: 1, top: 32.4, left: 36.3, width:  7.0, height: H, color: BLOOM.blue },
  { label: 'Zip',            page: 1, top: 32.4, left: 43.6, width: 10.3, height: H, color: BLOOM.blue },
  { label: 'SSN',            page: 1, top: 34.2, left: 19.6, width: 26.1, height: H, color: BLOOM.blue },
  { label: 'Gender ✓',       page: 1, top: 34.2, left: 46.1, width:  2.1, height: H, color: BLOOM.blue },
  { label: 'DOB',            page: 1, top: 25.4, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Citizenship',    page: 1, top: 27.1, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Email',          page: 1, top: 32.4, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Phone',          page: 1, top: 34.2, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  // ── Page 1 · Owner ────────────────────────────────────────────────────────
  { label: 'Owner First',    page: 1, top: 48.6, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Owner Middle',   page: 1, top: 50.4, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Owner Last',     page: 1, top: 52.1, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Owner Address',  page: 1, top: 53.9, left: 19.6, width: 24.5, height: H, color: BLOOM.blue },
  { label: 'Owner City',     page: 1, top: 55.7, left: 19.6, width: 16.3, height: H, color: BLOOM.blue },
  { label: 'Owner State',    page: 1, top: 55.7, left: 36.3, width:  7.0, height: H, color: BLOOM.blue },
  { label: 'Owner Zip',      page: 1, top: 55.7, left: 43.6, width: 10.3, height: H, color: BLOOM.blue },
  { label: 'Owner SSN',      page: 1, top: 57.4, left: 19.6, width: 26.1, height: H, color: BLOOM.blue },
  { label: 'Owner DOB',      page: 1, top: 50.4, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Owner Email',    page: 1, top: 55.7, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Owner Phone',    page: 1, top: 57.4, left: 70.3, width: 21.2, height: H, color: BLOOM.blue },
  // ── Page 2 · Primary Beneficiary ─────────────────────────────────────────
  { label: 'Primary ✓',      page: 2, top: 22.2, left: 10.6, width:  2.1, height: H, color: BLOOM.blue },
  { label: '100%',           page: 2, top: 22.2, left: 37.6, width:  6.5, height: H, color: BLOOM.blue },
  { label: 'Bene First',     page: 2, top: 24.0, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Bene Middle',    page: 2, top: 25.8, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Bene Last',      page: 2, top: 27.5, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Bene SSN',       page: 2, top: 29.3, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Bene DOB',       page: 2, top: 31.1, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Bene Address',   page: 2, top: 24.0, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  { label: 'Bene City',      page: 2, top: 25.8, left: 60.5, width: 21.2, height: H, color: BLOOM.blue },
  { label: 'Relationship',   page: 2, top: 29.3, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  { label: 'Phone',          page: 2, top: 31.1, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  // ── Page 2 · Contingent Beneficiary ──────────────────────────────────────
  { label: 'Contingent ✓',   page: 2, top: 33.5, left: 21.2, width:  2.1, height: H, color: BLOOM.blue },
  { label: 'Cont. First',    page: 2, top: 35.2, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Cont. Middle',   page: 2, top: 37.0, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Cont. Last',     page: 2, top: 38.8, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Cont. SSN',      page: 2, top: 40.5, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Cont. DOB',      page: 2, top: 42.3, left: 19.6, width: 27.8, height: H, color: BLOOM.orange },
  // ── Page 2 · Plan Type ────────────────────────────────────────────────────
  { label: 'Non-Qualified ✓',page: 2, top: 63.8, left: 10.6, width:  2.1, height: H, color: BLOOM.blue },
  // ── Page 3 · Replacements ─────────────────────────────────────────────────
  { label: 'No ✓',           page: 3, top: 13.9, left: 57.5, width:  2.1, height: H, color: BLOOM.blue },
  { label: 'No ✓',           page: 3, top: 15.7, left: 57.5, width:  2.1, height: H, color: BLOOM.blue },
  // ── Page 3 · Initial Purchase Payment ────────────────────────────────────
  { label: '$100,000',       page: 3, top: 27.8, left: 11.4, width: 18.0, height: H, color: BLOOM.blue },
  { label: 'Contribution ✓', page: 3, top: 27.8, left: 29.9, width:  2.1, height: H, color: BLOOM.blue },
  { label: 'Tax Year 2026',  page: 3, top: 27.8, left: 40.0, width:  7.4, height: H, color: BLOOM.blue },
  // ── Page 4 · DCA ──────────────────────────────────────────────────────────
  { label: 'Fixed Acct ✓',   page: 4, top: 22.7, left: 35.1, width:  2.1, height: H, color: BLOOM.blue },
  // ── Page 8 · Representative ───────────────────────────────────────────────
  { label: 'Rep First',      page: 8, top: 36.6, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Rep Middle',     page: 8, top: 38.4, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Rep Last',       page: 8, top: 40.2, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'Firm',           page: 8, top: 41.9, left: 19.6, width: 37.6, height: H, color: BLOOM.blue },
  { label: 'Phone',          page: 8, top: 43.7, left: 19.6, width: 27.8, height: H, color: BLOOM.blue },
  { label: 'NPN',            page: 8, top: 36.6, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  { label: 'State License',  page: 8, top: 38.4, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  { label: 'Acct Number',    page: 8, top: 40.2, left: 60.5, width: 31.0, height: H, color: BLOOM.blue },
  { label: 'Commission %',   page: 8, top: 41.9, left: 60.5, width:  8.2, height: H, color: BLOOM.blue },
  { label: 'Date Signed',    page: 8, top: 47.3, left: 65.4, width: 26.1, height: 2.3, color: BLOOM.blue },
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
  const [calibrating, setCalibrating] = useState(false);
  const [hoverPct, setHoverPct] = useState<{ x: number; y: number } | null>(null);
  const [pinnedPoints, setPinnedPoints] = useState<Array<{ x: number; y: number; page: number }>>([]);
  const pageBoxRef = useRef<HTMLDivElement>(null);

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

  // ── Calibration helpers ─────────────────────────────────────────────────────
  const getPct = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = pageBoxRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: +((e.clientX - rect.left) / rect.width * 100).toFixed(1),
      y: +((e.clientY - rect.top)  / rect.height * 100).toFixed(1),
    };
  };

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!calibrating) return;
    setHoverPct(getPct(e));
  };

  const handlePageMouseLeave = () => setHoverPct(null);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!calibrating) return;
    const pct = getPct(e);
    if (!pct) return;
    const point = { ...pct, page: pageNumber };
    setPinnedPoints(prev => [...prev.slice(-19), point]);
    console.log(`📍 Page ${pageNumber}  x:${pct.x}%  y:${pct.y}%`);
  };

  const copyPinned = () => {
    const text = pinnedPoints.map(p => `p${p.page} x:${p.x}% y:${p.y}%`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

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
        <Tooltip title={calibrating ? 'Exit coordinate calibration' : 'Calibrate annotation positions'}>
          <IconButton
            size="small"
            onClick={() => { setCalibrating(c => !c); setPinnedPoints([]); }}
            sx={{
              color: calibrating ? '#fff' : BLOOM.grey,
              bgcolor: calibrating ? BLOOM.orange : 'transparent',
              p: 0.5,
              '&:hover': { bgcolor: calibrating ? BLOOM.orange + 'CC' : undefined },
            }}
          >
            <MyLocation sx={{ fontSize: 16 }} />
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
          <Box
            ref={pageBoxRef}
            onMouseMove={handlePageMouseMove}
            onMouseLeave={handlePageMouseLeave}
            onClick={handlePageClick}
            sx={{
              position: 'relative',
              display: 'inline-block',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              cursor: calibrating ? 'crosshair' : 'default',
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={Math.round(BASE_WIDTH * zoom)}
              renderTextLayer
              renderAnnotationLayer
            />

            {/* AI field highlight overlays */}
            {showHighlights && !calibrating && (
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

            {/* Calibration: live crosshair + coordinate badge */}
            {calibrating && hoverPct && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Crosshair lines */}
                <Box sx={{ position: 'absolute', top: `${hoverPct.y}%`, left: 0, right: 0, height: '1px', bgcolor: BLOOM.orange + 'AA' }} />
                <Box sx={{ position: 'absolute', left: `${hoverPct.x}%`, top: 0, bottom: 0, width: '1px', bgcolor: BLOOM.orange + 'AA' }} />
                {/* Coordinate badge — flips side if near right edge */}
                <Box sx={{
                  position: 'absolute',
                  top: `${hoverPct.y}%`,
                  left: hoverPct.x < 70 ? `${hoverPct.x + 1}%` : undefined,
                  right: hoverPct.x >= 70 ? `${100 - hoverPct.x + 1}%` : undefined,
                  transform: 'translateY(-100%)',
                  bgcolor: BLOOM.orange,
                  color: '#fff',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                }}>
                  x:{hoverPct.x}% y:{hoverPct.y}%
                </Box>
              </Box>
            )}

            {/* Calibration: pinned click markers */}
            {calibrating && pinnedPoints.filter(p => p.page === pageNumber).map((p, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                top: `${p.y}%`,
                left: `${p.x}%`,
                width: 8, height: 8,
                bgcolor: BLOOM.orange,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                boxShadow: '0 0 0 2px #fff',
              }} />
            ))}
          </Box>
        </Document>
      </Box>

      {/* ── Calibration status bar ─────────────────────────────────────────── */}
      {calibrating && (
        <Box sx={{
          px: 1.5, py: 0.75,
          bgcolor: BLOOM.orangePale,
          borderTop: `1px solid ${BLOOM.orange}44`,
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: BLOOM.orange, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Calibration Mode — hover to read coordinates · click to pin
            </Typography>
            {pinnedPoints.length > 0 && (
              <Tooltip title="Copy all pinned points to clipboard">
                <IconButton size="small" onClick={copyPinned} sx={{ p: 0.25, color: BLOOM.orange }}>
                  <ContentCopy sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {hoverPct && (
            <Typography sx={{ fontSize: '0.625rem', color: BLOOM.orange, fontFamily: 'monospace' }}>
              ▶ page {pageNumber}  x:{hoverPct.x}%  y:{hoverPct.y}%
            </Typography>
          )}
          {pinnedPoints.length > 0 && (
            <Box sx={{ mt: 0.5, maxHeight: 80, overflowY: 'auto' }}>
              {pinnedPoints.map((p, i) => (
                <Typography key={i} sx={{ fontSize: '0.5625rem', color: BLOOM.textSecondary, fontFamily: 'monospace', lineHeight: 1.6 }}>
                  {String(i + 1).padStart(2, '0')}  p{p.page}  x:{p.x}%  y:{p.y}%
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Highlight legend ────────────────────────────────────────────────── */}
      {showHighlights && !calibrating && (
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
