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
