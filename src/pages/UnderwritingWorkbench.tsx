import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Tabs, Tab, Button,
  LinearProgress, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, IconButton,
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, FiberManualRecord,
  AutoAwesome, AccessTime, Assignment, Warning,
  AddComment, Escalator, LocalHospital, OpenInNew,
  ArrowBack,
} from '@mui/icons-material';
import { BLOOM } from '../theme';
import { submissions, getSubmission } from '../data/submissions';
import type { Submission, WorkflowStage } from '../data/types';

// ── Workflow stage icon ───────────────────────────────────────────────────────
function StageIcon({ status }: { status: WorkflowStage['status'] }) {
  if (status === 'complete') return <CheckCircle sx={{ fontSize: 18, color: BLOOM.green }} />;
  if (status === 'current')  return <FiberManualRecord sx={{ fontSize: 18, color: BLOOM.blue }} />;
  if (status === 'blocked')  return <Warning sx={{ fontSize: 18, color: BLOOM.red }} />;
  if (status === 'waived')   return <RadioButtonUnchecked sx={{ fontSize: 18, color: BLOOM.grey }} />;
  return <RadioButtonUnchecked sx={{ fontSize: 18, color: BLOOM.border }} />;
}

// ── Workflow sidebar ──────────────────────────────────────────────────────────
function WorkflowPanel({ sub }: { sub: Submission }) {
  const priorityColor = sub.priority === 'High' ? BLOOM.red : sub.priority === 'Medium' ? BLOOM.orange : BLOOM.green;
  const priorityBg    = sub.priority === 'High' ? BLOOM.redPale : sub.priority === 'Medium' ? BLOOM.orangePale : BLOOM.greenPale;
  const slaColor      = sub.slaDaysRemaining > 5 ? BLOOM.blue : sub.slaDaysRemaining > 2 ? BLOOM.orange : BLOOM.red;
  const slaBg         = sub.slaDaysRemaining > 5 ? BLOOM.bluePale : sub.slaDaysRemaining > 2 ? BLOOM.orangePale : BLOOM.redPale;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>

      {/* Applicant header */}
      <Paper sx={{ p: 2, borderTop: `3px solid ${priorityColor}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>{sub.applicantName}</Typography>
          <Chip size="small" label={sub.priority} sx={{ bgcolor: priorityBg, color: priorityColor }} />
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
          {sub.age}{sub.gender} · {sub.state} · {sub.occupation}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: BLOOM.textPrimary }}>
          {sub.productType} · ${sub.faceAmount.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
          {sub.id}
        </Typography>
      </Paper>

      {/* SLA timer */}
      <Paper sx={{ p: 1.75, bgcolor: slaBg, border: `1px solid ${slaColor + '44'}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <AccessTime sx={{ fontSize: 16, color: slaColor }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: slaColor }}>SLA Timer</Typography>
        </Box>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: slaColor, fontVariantNumeric: 'tabular-nums' }}>
          {sub.slaDaysRemaining} days remaining
        </Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Due {sub.slaDate}</Typography>
      </Paper>

      {/* Mortality risk */}
      <Paper sx={{ p: 1.75 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1 }}>
          Mortality Risk Score
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.75 }}>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: sub.riskScore >= 80 ? BLOOM.green : sub.riskScore >= 60 ? BLOOM.orange : BLOOM.red }}>
            {sub.riskScore}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}> / 100</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={sub.riskScore}
          sx={{
            height: 8, borderRadius: 4, bgcolor: BLOOM.border,
            '& .MuiLinearProgress-bar': {
              bgcolor: sub.riskScore >= 80 ? BLOOM.green : sub.riskScore >= 60 ? BLOOM.orange : BLOOM.red,
              borderRadius: 4,
            },
          }}
        />
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.5 }}>
          {sub.riskScore >= 80 ? 'Low Risk' : sub.riskScore >= 60 ? 'Moderate Risk' : 'Elevated Risk'}
        </Typography>
      </Paper>

      {/* Workflow stages */}
      <Paper sx={{ p: 1.75, flex: 1 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1.25 }}>
          Workflow Progress
        </Typography>
        {sub.workflowStages.map((stage, i) => (
          <Box key={stage.name} sx={{ display: 'flex', gap: 1.25, mb: i < sub.workflowStages.length - 1 ? 0 : 0, position: 'relative' }}>
            {/* Connector line */}
            {i < sub.workflowStages.length - 1 && (
              <Box sx={{
                position: 'absolute', left: 8.5, top: 20, width: 1, height: 28,
                bgcolor: stage.status === 'complete' ? BLOOM.green + '44' : BLOOM.border,
              }} />
            )}
            <Box sx={{ flexShrink: 0, mt: 0.125 }}>
              <StageIcon status={stage.status} />
            </Box>
            <Box sx={{ pb: 1.75 }}>
              <Typography sx={{
                fontSize: '0.75rem',
                fontWeight: stage.status === 'current' ? 700 : 400,
                color: stage.status === 'pending' ? BLOOM.grey : BLOOM.textPrimary,
              }}>
                {stage.name}
              </Typography>
              {stage.date && (
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{stage.date}</Typography>
              )}
              {stage.note && (
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: stage.status === 'current' ? BLOOM.blue : BLOOM.grey }}>
                  {stage.note}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Quick actions */}
      <Paper sx={{ p: 1.75 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            { icon: <Assignment fontSize="small" />, label: 'Order Requirements' },
            { icon: <LocalHospital fontSize="small" />, label: 'Request APS' },
            { icon: <Escalator fontSize="small" />, label: 'Escalate' },
            { icon: <AddComment fontSize="small" />, label: 'Add Note' },
          ].map((a) => (
            <Button
              key={a.label}
              variant="outlined"
              size="small"
              startIcon={a.icon}
              fullWidth
              sx={{ justifyContent: 'flex-start', color: BLOOM.blue, borderColor: BLOOM.border, fontSize: '0.75rem' }}
            >
              {a.label}
            </Button>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ sub }: { sub: Submission }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* AI Medical Brief */}
      <Paper sx={{ p: 2, borderLeft: `3px solid ${BLOOM.blue}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
          <AutoAwesome sx={{ fontSize: 16, color: BLOOM.blue }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: BLOOM.blue }}>AI Medical Brief</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
          {sub.medicalNotes || 'No medical history noted. Clean application.'}
        </Typography>
      </Paper>

      {/* Routing decision */}
      <Paper sx={{ p: 2, bgcolor: BLOOM.orangePale, borderLeft: `3px solid ${BLOOM.orange}` }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: BLOOM.orange, mb: 0.75 }}>
          Routing Decision
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', mb: 0.25 }}>{sub.routingDecision}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{sub.routingReason}</Typography>
      </Paper>

      {/* Requirements checklist */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Requirements Checklist</Typography>
        {sub.supportingDocs.length === 0 ? (
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>No requirements — STP pathway</Typography>
        ) : (
          sub.supportingDocs.map((doc) => {
            const statusColor =
              doc.status === 'Received' ? BLOOM.green :
              doc.status === 'Ordered' || doc.status === 'Scheduled' ? BLOOM.blue :
              doc.status === 'Waived' ? BLOOM.grey : BLOOM.orange;
            return (
              <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.875 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {doc.status === 'Received'
                    ? <CheckCircle sx={{ fontSize: 15, color: BLOOM.green }} />
                    : <RadioButtonUnchecked sx={{ fontSize: 15, color: statusColor }} />}
                  <Typography sx={{ fontSize: '0.8125rem' }}>{doc.name}</Typography>
                </Box>
                <Chip size="small" label={doc.status} sx={{ bgcolor: statusColor + '22', color: statusColor, fontSize: '0.6875rem' }} />
              </Box>
            );
          })
        )}
      </Paper>

      {/* Comparable cases */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Comparable Cases</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Profile', 'Age/Gender', 'Face', 'Medical', 'Final Class', 'Premium/Mo'].map((h) => (
                <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'text.secondary', bgcolor: BLOOM.canvas, py: 0.75 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ['Similar T2D', '36M', '$500K', 'Diabetes A1C 7.1', 'Standard +50', '$182'],
              ['Similar T2D', '40M', '$500K', 'Diabetes A1C 7.8', 'Standard +75', '$218'],
              ['Similar T2D', '38M', '$450K', 'Diabetes A1C 6.9', 'Standard +25', '$158'],
            ].map((row, i) => (
              <TableRow key={i} hover>
                {row.map((cell, j) => (
                  <TableCell key={j} sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', py: 0.75 }}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────
function DocumentsTab({ sub }: { sub: Submission }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sub.acordForms.map((form) => (
        <Paper key={form.formNumber} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>{form.formNumber} — {form.formName}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{form.fileName}</Typography>
            </Box>
            <Chip
              size="small"
              label={`${form.confidenceScore}% confidence`}
              sx={{ bgcolor: form.confidenceScore >= 90 ? BLOOM.greenPale : BLOOM.orangePale, color: form.confidenceScore >= 90 ? BLOOM.green : BLOOM.orange }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Fields Extracted</Typography>
              <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{form.fieldsExtracted} / {form.totalFields}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Extraction Time</Typography>
              <Typography sx={{ fontWeight: 700 }}>{form.extractionTime}</Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(form.fieldsExtracted / form.totalFields) * 100}
            sx={{
              mt: 1.5, height: 6, borderRadius: 3, bgcolor: BLOOM.border,
              '& .MuiLinearProgress-bar': { bgcolor: BLOOM.green, borderRadius: 3 },
            }}
          />
        </Paper>
      ))}

      {sub.supportingDocs.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Supporting Documents</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Document', 'Type', 'Status', 'Received'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'text.secondary', bgcolor: BLOOM.canvas }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sub.supportingDocs.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{doc.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{doc.type}</TableCell>
                  <TableCell>
                    <Chip size="small" label={doc.status} sx={{
                      bgcolor: doc.status === 'Received' ? BLOOM.greenPale : doc.status === 'Ordered' ? BLOOM.bluePale : BLOOM.orangePale,
                      color: doc.status === 'Received' ? BLOOM.green : doc.status === 'Ordered' ? BLOOM.blue : BLOOM.orange,
                    }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{doc.receivedDate || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {sub.supportingDocs.some((d) => d.status === 'Pending') && (
        <Paper sx={{ p: 2, bgcolor: BLOOM.orangePale, borderLeft: `3px solid ${BLOOM.orange}` }}>
          <Typography sx={{ fontWeight: 700, color: BLOOM.orange, fontSize: '0.8125rem' }}>Missing Requirements</Typography>
          <Typography sx={{ fontSize: '0.75rem', mt: 0.5 }}>
            One or more required documents are still pending. Case cannot proceed to rating until received.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

// ── Mortality & Pricing tab ───────────────────────────────────────────────────
function MortalityTab({ sub }: { sub: Submission }) {
  const ratePerThousand = sub.riskScore >= 80 ? 1.12 : sub.riskScore >= 60 ? 1.85 : 2.60;
  const monthlyPremium  = (sub.faceAmount / 1000) * ratePerThousand;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Table class */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.5 }}>Table Class Recommendation</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, bgcolor: BLOOM.bluePale, p: 1.75, borderRadius: '6px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.5 }}>AI Recommendation</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: BLOOM.blue }}>{sub.tableClass || 'Standard +50'}</Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}>AI Confidence: 79%</Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: BLOOM.canvas, p: 1.75, borderRadius: '6px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.5 }}>Manual Suggestion</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: BLOOM.grey }}>Standard +25</Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}>Pending APS review</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Premium calculation */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.5 }}>Premium Calculation</Typography>
        {[
          ['Face Amount', `$${sub.faceAmount.toLocaleString()}`],
          ['Rate per $1,000', `$${ratePerThousand.toFixed(2)}`],
          ['Monthly Premium', `$${monthlyPremium.toFixed(2)}`],
          ['Annual Premium', `$${(monthlyPremium * 12).toFixed(2)}`],
        ].map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: `1px solid ${BLOOM.border}` }}>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{k}</Typography>
            <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.9375rem' }}>{v}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Comparable cases */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Comparable Cases — Pricing Reference</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Profile', 'Table Class', 'Rate/$1K', 'Mo. Premium', 'Outcome'].map((h) => (
                <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'text.secondary', bgcolor: BLOOM.canvas }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ['T2D, 36M, $500K', 'Standard +50', '$1.85', '$185/mo', 'Placed'],
              ['T2D, 40M, $500K', 'Standard +75', '$2.20', '$218/mo', 'Placed'],
              ['T2D, 38M, $450K', 'Standard +25', '$1.58', '$142/mo', 'Placed'],
            ].map((row, i) => (
              <TableRow key={i} hover>
                {row.map((cell, j) => (
                  <TableCell key={j} sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', py: 0.75 }}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

// ── Guidelines tab ────────────────────────────────────────────────────────────
function GuidelinesTab({ sub }: { sub: Submission }) {
  const triggers = [
    { label: `Age ${sub.age} within table`, pass: sub.age < 60 },
    { label: 'Diabetes Type 2 → referral required', pass: !sub.medicalNotes?.includes('Diabetes') },
    { label: 'Non-tobacco user', pass: true },
    { label: `Face amount $${sub.faceAmount.toLocaleString()} within simplified issue limit`, pass: sub.faceAmount <= 1000000 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Product appetite */}
      <Paper sx={{ p: 2, borderLeft: `3px solid ${BLOOM.green}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1 }}>Product Appetite</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 16, color: BLOOM.green, mt: 0.125 }} />
          <Typography sx={{ fontSize: '0.8125rem' }}>
            Within appetite — {sub.productType} up to $1M simplified issue, $5M fully underwritten.
          </Typography>
        </Box>
      </Paper>

      {/* Referral triggers */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Referral Triggers</Typography>
        {triggers.map((t) => (
          <Box key={t.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.875 }}>
            {t.pass
              ? <CheckCircle sx={{ fontSize: 15, color: BLOOM.green, mt: 0.125, flexShrink: 0 }} />
              : <Warning sx={{ fontSize: 15, color: BLOOM.orange, mt: 0.125, flexShrink: 0 }} />}
            <Typography sx={{ fontSize: '0.8125rem', color: t.pass ? BLOOM.textPrimary : BLOOM.orange }}>
              {t.label}
            </Typography>
          </Box>
        ))}
      </Paper>

      {/* Required exams */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Required Exams — Age/Amount Band</Typography>
        {[
          { exam: 'Paramedical Exam', required: true,  note: 'Required: Age 35–49, $250K+' },
          { exam: 'Blood Profile',    required: true,  note: 'Required: Age 35+, $500K+' },
          { exam: 'Urine Analysis',   required: true,  note: 'Required: Age 35+, $500K+' },
          { exam: 'EKG',              required: false, note: 'Not required: Age < 45' },
          { exam: 'Stress Test',      required: false, note: 'Not required: No cardiac history' },
        ].map((e) => (
          <Box key={e.exam} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {e.required
                ? <CheckCircle sx={{ fontSize: 14, color: BLOOM.blue }} />
                : <RadioButtonUnchecked sx={{ fontSize: 14, color: BLOOM.grey }} />}
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: e.required ? 600 : 400 }}>{e.exam}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{e.note}</Typography>
          </Box>
        ))}
      </Paper>

      {/* State compliance */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1 }}>State Filing Compliance — {sub.state}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 15, color: BLOOM.green }} />
          <Typography sx={{ fontSize: '0.8125rem' }}>
            {sub.productType} filed and approved in {sub.state}. No state-specific exclusions.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// ── AI Insights + Activity right panel ───────────────────────────────────────
function InsightsPanel({ sub }: { sub: Submission }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* AI Insights */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
          <AutoAwesome sx={{ fontSize: 16, color: BLOOM.blue }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>AI Insights</Typography>
        </Box>
        {sub.aiInsights.map((insight) => (
          <Paper
            key={insight.id}
            sx={{
              p: 1.5, mb: 1,
              bgcolor: insight.severity === 'critical' ? BLOOM.redPale : insight.severity === 'warning' ? BLOOM.orangePale : BLOOM.bluePale,
              borderLeft: `3px solid ${insight.severity === 'critical' ? BLOOM.red : insight.severity === 'warning' ? BLOOM.orange : BLOOM.blue}`,
              border: 'none',
            }}
          >
            <Typography sx={{
              fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
              color: insight.severity === 'critical' ? BLOOM.red : insight.severity === 'warning' ? BLOOM.orange : BLOOM.blue,
              mb: 0.375, letterSpacing: '0.3px',
            }}>
              {insight.category}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>{insight.message}</Typography>
            {insight.action && (
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: BLOOM.blue, mt: 0.5 }}>
                → {insight.action}
              </Typography>
            )}
          </Paper>
        ))}
      </Paper>

      {/* Activity log */}
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1.25 }}>Activity Log</Typography>
        {sub.activityLog.map((entry, i) => (
          <Box key={entry.id} sx={{ display: 'flex', gap: 1, mb: i < sub.activityLog.length - 1 ? 1.25 : 0, position: 'relative' }}>
            {i < sub.activityLog.length - 1 && (
              <Box sx={{ position: 'absolute', left: 5.5, top: 14, width: 1, height: 'calc(100% + 4px)', bgcolor: BLOOM.border }} />
            )}
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: BLOOM.blue, flexShrink: 0, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 }}>{entry.action}</Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{entry.timestamp}</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: BLOOM.grey }}>·</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{entry.actor}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

// ── Main Workbench ────────────────────────────────────────────────────────────
export default function UnderwritingWorkbench() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Default to James Anderson if no id or not found
  const sub: Submission = (id ? getSubmission(id) : undefined) ?? submissions[0];

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left sidebar: workflow ──────────────────────────────── */}
      <Box sx={{
        width: 280, flexShrink: 0, borderRight: `1px solid ${BLOOM.border}`,
        p: 2, overflow: 'auto', bgcolor: 'background.paper',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Tooltip title="Back to dashboard">
            <IconButton size="small" onClick={() => navigate('/dashboard')}>
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Workbench</Typography>
        </Box>
        <WorkflowPanel sub={sub} />
      </Box>

      {/* ── Center: tabs ────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Tab bar */}
        <Box sx={{ px: 3, pt: 2, pb: 0, borderBottom: `1px solid ${BLOOM.border}`, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{sub.applicantName}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {sub.id} · {sub.productType} · ${sub.faceAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<OpenInNew sx={{ fontSize: 14 }} />} sx={{ color: BLOOM.blue, borderColor: BLOOM.blue }}>
                View Forms
              </Button>
              <Button variant="contained" size="small">
                Make Decision
              </Button>
            </Box>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ '& .MuiTabs-indicator': { bgcolor: BLOOM.blue } }}
          >
            {['Overview', 'Documents', 'Mortality & Pricing', 'Guidelines'].map((label) => (
              <Tab key={label} label={label} sx={{ fontSize: '0.8125rem' }} />
            ))}
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {activeTab === 0 && <OverviewTab sub={sub} />}
          {activeTab === 1 && <DocumentsTab sub={sub} />}
          {activeTab === 2 && <MortalityTab sub={sub} />}
          {activeTab === 3 && <GuidelinesTab sub={sub} />}
        </Box>
      </Box>

      {/* ── Right panel: AI Insights ─────────────────────────────── */}
      <Box sx={{
        width: 288, flexShrink: 0, borderLeft: `1px solid ${BLOOM.border}`,
        p: 2, overflow: 'auto', bgcolor: 'background.paper',
      }}>
        <InsightsPanel sub={sub} />
      </Box>

      {/* Submission selector bar */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 280, right: 288,
        bgcolor: 'background.paper', borderTop: `1px solid ${BLOOM.border}`,
        px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
      }}>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mr: 0.5 }}>Switch case:</Typography>
        {submissions.map((s) => (
          <Chip
            key={s.id}
            label={`${s.applicantName.split(' ')[1]} · ${s.id.split('-').slice(-1)}`}
            size="small"
            onClick={() => navigate(`/workbench/${s.id}`)}
            sx={{
              cursor: 'pointer',
              bgcolor: s.id === sub.id ? BLOOM.blue : 'transparent',
              color: s.id === sub.id ? '#fff' : BLOOM.textSecondary,
              border: `1px solid ${s.id === sub.id ? BLOOM.blue : BLOOM.border}`,
              fontSize: '0.6875rem',
            }}
          />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', fontStyle: 'italic' }}>
          {submissions.length} submissions total
        </Typography>
      </Box>
    </Box>
  );
}
