import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, OpenInNew, AutoAwesome,
  AccessTime, Assignment, CheckCircle, Warning,
} from '@mui/icons-material';
import { BLOOM } from '../theme';
import { submissions } from '../data/submissions';
import type { Submission, SubmissionStatus } from '../data/types';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<SubmissionStatus, { bg: string; color: string; label: string }> = {
  'New Submission':      { bg: BLOOM.bluePale,   color: BLOOM.blue,       label: 'New' },
  'Pending Review':      { bg: BLOOM.orangePale, color: BLOOM.orange,     label: 'Pending Review' },
  'In Review':           { bg: BLOOM.bluePale,   color: BLOOM.blue,       label: 'In Review' },
  'Requirements Needed': { bg: BLOOM.redPale,    color: BLOOM.red,        label: 'Req. Needed' },
  'STP Eligible':        { bg: BLOOM.greenPale,  color: BLOOM.lightGreen, label: 'STP Eligible' },
  'Approved':            { bg: BLOOM.greenPale,  color: BLOOM.green,      label: 'Approved' },
  'Declined':            { bg: BLOOM.redPale,    color: BLOOM.red,        label: 'Declined' },
};

const FILTER_TABS = [
  'All', 'New', 'Pending Review', 'Needs Info', 'STP Eligible', 'Approved',
] as const;

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  accentColor: string;
}

function KpiCard({ label, value, delta, up, accentColor }: KpiCardProps) {
  return (
    <Paper sx={{ p: 2, flex: 1, borderLeft: `3px solid ${accentColor}`, minWidth: 180 }}>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums', mb: 0.5, color: BLOOM.textPrimary }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {up
          ? <TrendingUp sx={{ fontSize: 14, color: BLOOM.green }} />
          : <TrendingDown sx={{ fontSize: 14, color: BLOOM.red }} />}
        <Typography sx={{ fontSize: '0.75rem', color: up ? BLOOM.green : BLOOM.red }}>{delta}</Typography>
      </Box>
    </Paper>
  );
}

// ── Risk score bar ────────────────────────────────────────────────────────────
function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? BLOOM.green : score >= 60 ? BLOOM.orange : BLOOM.red;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          width: 56, height: 6, borderRadius: 3, bgcolor: BLOOM.border,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', color: BLOOM.textSecondary, width: 24 }}>
        {score}
      </Typography>
    </Box>
  );
}

// ── SLA chip ──────────────────────────────────────────────────────────────────
function SlaChip({ days }: { days: number }) {
  const color = days > 5 ? BLOOM.blue : days > 2 ? BLOOM.orange : BLOOM.red;
  const bg = days > 5 ? BLOOM.bluePale : days > 2 ? BLOOM.orangePale : BLOOM.redPale;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: bg, color, px: 1, py: 0.25, borderRadius: '12px', width: 'fit-content' }}>
      <AccessTime sx={{ fontSize: 11 }} />
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{days}d</Typography>
    </Box>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filtered = submissions.filter((s) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'New') return s.status === 'New Submission';
    if (activeFilter === 'Pending Review') return s.status === 'Pending Review';
    if (activeFilter === 'Needs Info') return s.status === 'Requirements Needed';
    if (activeFilter === 'STP Eligible') return s.stpEligible;
    if (activeFilter === 'Approved') return s.status === 'Approved';
    return true;
  });

  const stpCount = submissions.filter((s) => s.stpEligible).length;

  return (
    <Box sx={{ p: 3, display: 'flex', gap: 2.5, height: '100%' }}>

      {/* ── Left: main content ─────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>

        {/* Page title */}
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25, color: BLOOM.textPrimary }}>New Business Dashboard</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            Life &amp; Annuity · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>

        {/* KPI Strip */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <KpiCard label="New Submissions"      value="18"     delta="↑ 4 today"            up={true}  accentColor={BLOOM.blue} />
          <KpiCard label="STP Rate"             value="42%"    delta="↑ 6% vs last week"    up={true}  accentColor={BLOOM.green} />
          <KpiCard label="Avg Days to Decision" value="2.8d"   delta="↓ 1.1 days"           up={true}  accentColor={BLOOM.lightGreen} />
          <KpiCard label="On SLA"               value="94%"    delta="+2% vs last week"     up={true}  accentColor={BLOOM.green} />
        </Box>

        {/* Queue table */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filter chips */}
          <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${BLOOM.border}` }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, mr: 1 }}>Submission Queue</Typography>
            {FILTER_TABS.map((f) => (
              <Chip
                key={f}
                label={f}
                size="small"
                onClick={() => setActiveFilter(f)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: activeFilter === f ? BLOOM.blue : 'transparent',
                  color: activeFilter === f ? '#fff' : BLOOM.textSecondary,
                  border: `1px solid ${activeFilter === f ? BLOOM.blue : BLOOM.border}`,
                  '&:hover': { bgcolor: activeFilter === f ? BLOOM.blue : BLOOM.bluePale },
                }}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {filtered.length} submissions
            </Typography>
          </Box>

          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ID', 'Applicant', 'Product', 'Age / Gender', 'Face Amount', 'Priority', 'Status', 'Risk', 'SLA', 'Assigned', ''].map((h) => (
                    <TableCell key={h} sx={{
                      fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.5px', color: 'text.secondary', bgcolor: BLOOM.canvas,
                      py: 1, whiteSpace: 'nowrap',
                    }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s: Submission) => {
                  const sc = STATUS_CFG[s.status];
                  return (
                    <TableRow
                      key={s.id}
                      hover
                      onClick={() => navigate(`/workbench/${s.id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: BLOOM.bluePale + '55' } }}
                    >
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: BLOOM.blue, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {s.id}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>{s.applicantName}</Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{s.state}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.productType}
                        {s.productType.includes('Term') && <Typography component="span" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}> · 20yr</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                        {s.age}{s.gender}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        ${(s.faceAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={s.priority}
                          sx={{
                            bgcolor: s.priority === 'High' ? BLOOM.redPale : s.priority === 'Medium' ? BLOOM.orangePale : BLOOM.greenPale,
                            color: s.priority === 'High' ? BLOOM.red : s.priority === 'Medium' ? BLOOM.orange : BLOOM.green,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={sc.label} sx={{ bgcolor: sc.bg, color: sc.color }} />
                      </TableCell>
                      <TableCell><RiskBar score={s.riskScore} /></TableCell>
                      <TableCell><SlaChip days={s.slaDaysRemaining} /></TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{s.assignedTo}</TableCell>
                      <TableCell>
                        <Tooltip title="Open workbench">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/workbench/${s.id}`); }}>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* ── Right panel: AI Intelligence ──────────────────────────── */}
      <Box sx={{ width: 288, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* STP candidates */}
        <Paper sx={{ p: 2, borderLeft: `3px solid ${BLOOM.green}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <AutoAwesome sx={{ fontSize: 16, color: BLOOM.green }} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: BLOOM.green }}>STP Candidates</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.5 }}>
            {stpCount} cases eligible for straight-through processing
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Clean medical history, within appetite, no referral triggers detected.
          </Typography>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {submissions.filter((s) => s.stpEligible).map((s) => (
              <Box
                key={s.id}
                onClick={() => navigate(`/workbench/${s.id}`)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  bgcolor: BLOOM.greenPale, px: 1.25, py: 0.75, borderRadius: '6px',
                  cursor: 'pointer', '&:hover': { bgcolor: BLOOM.green + '22' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.applicantName}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{s.productType} · ${(s.faceAmount / 1000).toFixed(0)}K</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 16, color: BLOOM.green }} />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* AI Priority */}
        <Paper sx={{ p: 2, borderLeft: `3px solid ${BLOOM.red}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <Warning sx={{ fontSize: 16, color: BLOOM.red }} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: BLOOM.red }}>AI Priority Alert</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, mb: 0.25 }}>James Anderson</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.25 }}>
            Complex medical — Diabetes Type 2. Needs APS + paramedical before rating. SLA: 6 days.
          </Typography>
          <Box
            onClick={() => navigate('/workbench/NB-2026-LA-001')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              color: BLOOM.blue, fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
            }}
          >
            <OpenInNew sx={{ fontSize: 13 }} /> Open Workbench
          </Box>
        </Paper>

        {/* Requirements tracker */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <Assignment sx={{ fontSize: 16, color: BLOOM.blue }} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>Requirements Tracker</Typography>
          </Box>
          {[
            { label: '2 APS outstanding', color: BLOOM.red, bg: BLOOM.redPale },
            { label: '4 parameds scheduled', color: BLOOM.orange, bg: BLOOM.orangePale },
            { label: '3 blood profiles ordered', color: BLOOM.blue, bg: BLOOM.bluePale },
          ].map((r) => (
            <Box key={r.label} sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: r.bg, px: 1.25, py: 0.75, borderRadius: '6px', mb: 0.75,
            }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.75rem', color: r.color, fontWeight: 600 }}>{r.label}</Typography>
            </Box>
          ))}
        </Paper>

        {/* Quick stats */}
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, mb: 1.25 }}>Today's Activity</Typography>
          {[
            { label: 'Applications received', value: '4' },
            { label: 'AI extractions complete', value: '4' },
            { label: 'Cases approved', value: '1' },
            { label: 'Requirements ordered', value: '7' },
          ].map((r) => (
            <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{r.label}</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.value}</Typography>
            </Box>
          ))}
        </Paper>

      </Box>
    </Box>
  );
}
