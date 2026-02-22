import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PdfDocumentViewer from '../components/PdfDocumentViewer';
import {
  Box, Typography, Paper, Button, Stepper, Step, StepLabel, Tabs, Tab,
  TextField, MenuItem, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider,
  IconButton,
} from '@mui/material';
import {
  CloudUpload, DeleteOutline, CheckCircle, Warning, Error,
  AutoAwesome, ArrowBack, ArrowForward, PictureAsPdf,
  DescriptionOutlined,
} from '@mui/icons-material';
import { BLOOM } from '../theme';

const STEPS = ['Upload Forms', 'Classify Application', 'Review Extracted Data', 'Review & Submit'];

// ── Demo file ─────────────────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  name: string;
  formType: string;
  size: string;
  date: string;
}

interface ExtractedData {
  // Annuitant / Owner
  fullName: string;
  dob: string;
  gender: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  citizenship: string;
  // Plan & Payment
  planType: string;
  productName: string;
  purchasePayment: string;
  taxYear: string;
  dcaSource: string;
  replacements: string;
  // Riders
  livingBenefitRider: string;
  deathBenefitRider: string;
  // Primary Beneficiary
  primaryBeneficiary: string;
  primaryRelationship: string;
  primaryPct: string;
  primaryDob: string;
  primarySSN: string;
  // Contingent Beneficiary
  contingentBeneficiary: string;
  contingentDob: string;
  // Representative
  repName: string;
  repFirm: string;
  repPhone: string;
  repNPN: string;
  repLicenseId: string;
  dateSigned: string;
}

const DEMO_ACORD: UploadedFile = {
  id: 'demo-1',
  name: 'Document_260218_184853 1 (1) 1.pdf',
  formType: 'Bloom Prime Options — Variable Annuity Application',
  size: '1.4 MB',
  date: '2026-02-18',
};

const DEMO_EXTRACTED: ExtractedData = {
  // Annuitant / Owner
  fullName: 'Sam W Smith',
  dob: '01/01/2000',
  gender: 'Male',
  ssn: '***-**-4433',
  address: '1234 Main St',
  city: 'Anytown',
  state: 'SC',
  zipCode: '29410',
  email: 'Sam@SamSam.com',
  phone: '(555) 333-1233',
  citizenship: 'United States',
  // Plan & Payment
  planType: 'Non-Qualified',
  productName: 'Bloom Prime Options — Variable Annuity',
  purchasePayment: '$100,000',
  taxYear: '2026',
  dcaSource: 'Fixed Account',
  replacements: 'No',
  // Riders
  livingBenefitRider: 'None elected',
  deathBenefitRider: 'None elected',
  // Primary Beneficiary
  primaryBeneficiary: 'John Smith',
  primaryRelationship: 'Spouse',
  primaryPct: '100%',
  primaryDob: '07/01/2001',
  primarySSN: '***-**-1111',
  // Contingent Beneficiary
  contingentBeneficiary: 'Jake James John',
  contingentDob: '03/07/1997',
  // Representative
  repName: 'Mary Ann Blase',
  repFirm: 'Blase Investments',
  repPhone: '(315) 776-1111',
  repNPN: '1234',
  repLicenseId: '8160 PP 4401',
  dateSigned: '02/10/2026',
};

const DOC_TYPE_OPTIONS = ['APS', 'Paramedical Results', 'Financial Statement', 'Blood Profile', 'Other'];

// ── Small sub-components ──────────────────────────────────────────────────────
function FieldRow({
  label,
  value,
  onChange,
  error,
  lowConf,
  confidence,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  lowConf?: boolean;
  confidence?: number;
  required?: boolean;
}) {
  const isLowConf = lowConf || (confidence !== undefined && confidence < 80);
  const confColor = confidence === undefined ? BLOOM.grey
    : confidence >= 90 ? BLOOM.green
    : confidence >= 75 ? BLOOM.orange
    : BLOOM.red;
  const confBg = confidence === undefined ? BLOOM.canvas
    : confidence >= 90 ? BLOOM.greenPale
    : confidence >= 75 ? BLOOM.orangePale
    : BLOOM.redPale;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.375 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {label}{required && <Box component="span" sx={{ color: BLOOM.red, ml: 0.25 }}>*</Box>}
        </Typography>
        {confidence !== undefined && (
          <Chip size="small" label={`${confidence}%`} sx={{
            height: 16, fontSize: '0.5625rem', ml: 0.25,
            bgcolor: confBg, color: confColor,
            '& .MuiChip-label': { px: 0.75, lineHeight: 1 },
          }} />
        )}
        {error && <Error sx={{ fontSize: 13, color: BLOOM.red }} />}
      </Box>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error || (isLowConf ? 'Low confidence — verify' : undefined)}
        FormHelperTextProps={{ sx: { fontSize: '0.6875rem', color: error ? BLOOM.red : BLOOM.orange, mt: 0.25 } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            bgcolor: error ? BLOOM.redPale : isLowConf ? BLOOM.orangePale : 'background.paper',
          },
        }}
      />
    </Box>
  );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function SubmissionIntake() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [acordFiles, setAcordFiles] = useState<UploadedFile[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<UploadedFile[]>([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiComplete, setAiComplete] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dragOverAcord, setDragOverAcord] = useState(false);
  const [dragOverSupporting, setDragOverSupporting] = useState(false);
  const [step3Tab, setStep3Tab] = useState(0);

  const acordInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

  const handleAcordFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    setAcordFiles([{
      id: `upload-${Date.now()}`,
      name: file.name,
      formType: 'ACORD 103 — Life Application',
      size: `${sizeMB} MB`,
      date: new Date().toISOString().split('T')[0],
    }]);
    setAiRunning(true);
    setAiComplete(false);
    setTimeout(() => { setAiRunning(false); setAiComplete(true); }, 2500);
  };

  const handleSupportingFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).map((file, i) => ({
      id: `sup-${Date.now()}-${i}`,
      name: file.name,
      formType: 'Other',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: new Date().toISOString().split('T')[0],
    }));
    setSupportingFiles(prev => [...prev, ...incoming]);
  };

  // Extracted data state
  const [data, setData] = useState<ExtractedData>({
    fullName: '', dob: '', gender: '', ssn: '', address: '', city: '', state: '', zipCode: '',
    email: '', phone: '', citizenship: '',
    planType: '', productName: '', purchasePayment: '', taxYear: '', dcaSource: '', replacements: '',
    livingBenefitRider: '', deathBenefitRider: '',
    primaryBeneficiary: '', primaryRelationship: '', primaryPct: '', primaryDob: '', primarySSN: '',
    contingentBeneficiary: '', contingentDob: '',
    repName: '', repFirm: '', repPhone: '', repNPN: '', repLicenseId: '', dateSigned: '',
  });

  const field = (key: keyof ExtractedData) => ({
    value: data[key],
    onChange: (v: string) => setData((d) => ({ ...d, [key]: v })),
  });

  // Load demo
  const loadDemo = () => {
    setAcordFiles([DEMO_ACORD]);
    setAiRunning(true);
    setTimeout(() => {
      setAiRunning(false);
      setAiComplete(true);
    }, 2500);
  };

  const handleNext = () => {
    if (activeStep === 1 && aiComplete) {
      setData(DEMO_EXTRACTED);
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = () => setSuccessOpen(true);

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate('/workbench/NB-2026-VA-001');
  };

  // ── Step 1: Upload Forms ───────────────────────────────────────────────────
  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Upload Application Forms</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2.5 }}>
        Upload the application forms from the applicant. AI will automatically classify and extract all fields.
      </Typography>

      {/* Demo load chip */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quick demo:</Typography>
        <Chip
          label="Load Sam Smith demo"
          size="small"
          icon={<AutoAwesome sx={{ fontSize: 13 }} />}
          onClick={loadDemo}
          sx={{ bgcolor: BLOOM.bluePale, color: BLOOM.blue, cursor: 'pointer', border: `1px solid ${BLOOM.blue + '44'}` }}
        />
      </Box>

      {/* Drop zone */}
      <input
        ref={acordInputRef}
        type="file"
        accept=".pdf,.PDF"
        style={{ display: 'none' }}
        onChange={(e) => handleAcordFiles(e.target.files)}
      />
      <Paper
        onClick={() => acordInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOverAcord(true); }}
        onDragLeave={() => setDragOverAcord(false)}
        onDrop={(e) => { e.preventDefault(); setDragOverAcord(false); handleAcordFiles(e.dataTransfer.files); }}
        sx={{
          p: 4, textAlign: 'center', cursor: 'pointer',
          border: `2px dashed ${dragOverAcord ? BLOOM.blue : BLOOM.border}`,
          bgcolor: dragOverAcord ? BLOOM.bluePale : BLOOM.canvas,
          transition: 'all 0.15s',
          '&:hover': { borderColor: BLOOM.blue, bgcolor: BLOOM.bluePale },
          mb: 2,
        }}
      >
        <CloudUpload sx={{ fontSize: 40, color: dragOverAcord ? BLOOM.blue : BLOOM.grey, mb: 1 }} />
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Drag &amp; drop application forms here or click to browse</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Life · Annuity · Disability · Long-Term Care · PDF format
        </Typography>
      </Paper>

      {/* AI running indicator */}
      {aiRunning && (
        <Alert
          severity="info"
          icon={<AutoAwesome />}
          sx={{ mb: 2, bgcolor: BLOOM.bluePale, color: BLOOM.blue, border: `1px solid ${BLOOM.blue + '44'}` }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            ✨ AI classification &amp; extraction running — estimated completion 2 min...
          </Typography>
          <LinearProgress sx={{ mt: 1, bgcolor: BLOOM.border, '& .MuiLinearProgress-bar': { bgcolor: BLOOM.blue } }} />
        </Alert>
      )}
      {aiComplete && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Classification complete — application type confirmed. Proceed to review the classification results.
        </Alert>
      )}

      {/* File table */}
      {acordFiles.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['File Name', 'Form Type', 'Size', 'Upload Date', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'text.secondary', bgcolor: BLOOM.canvas }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {acordFiles.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <PictureAsPdf sx={{ fontSize: 16, color: BLOOM.red }} />
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{f.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{f.formType}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>{f.size}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{f.date}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setAcordFiles([])} sx={{ color: BLOOM.red }}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  // ── Step 2: Classify Application ─────────────────────────────────────────
  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.25 }}>Classify Application</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2.5 }}>
        AI has analyzed the uploaded form and identified the application type. Confirm the classification before proceeding to data extraction.
      </Typography>

      {/* Still running */}
      {aiRunning && (
        <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 2, bgcolor: BLOOM.bluePale, color: BLOOM.blue, border: `1px solid ${BLOOM.blue + '44'}` }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>✨ AI classification in progress — analyzing document structure...</Typography>
          <LinearProgress sx={{ mt: 0.75, bgcolor: BLOOM.border, '& .MuiLinearProgress-bar': { bgcolor: BLOOM.blue } }} />
        </Alert>
      )}

      {/* No file uploaded yet */}
      {!aiRunning && !aiComplete && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload application forms in Step 1 to begin classification.
        </Alert>
      )}

      {/* Classification results */}
      {aiComplete && (
        <>
          {/* AI result banner */}
          <Paper sx={{ p: 2, mb: 2.5, borderLeft: `3px solid ${BLOOM.green}`, bgcolor: BLOOM.greenPale }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <AutoAwesome sx={{ fontSize: 16, color: BLOOM.green }} />
              <Typography sx={{ fontWeight: 700, color: BLOOM.green, fontSize: '0.875rem' }}>
                Application Classified — 99% confidence
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
              {([
                ['Document Type', 'Variable Annuity Application'],
                ['Product',       'Bloom Prime Options'],
                ['Issuer',        'Bloom Insurance'],
                ['Applicant',     'Sam W Smith'],
                ['Plan Type',     'Non-Qualified'],
                ['Date Signed',   '02/10/2026'],
              ] as [string, string][]).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: BLOOM.textSecondary, width: 110, flexShrink: 0 }}>{k}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Sections detected */}
          <Paper sx={{ p: 2, mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1.25 }}>
              Sections Detected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                'Annuitant Information', 'Owner Information', 'Beneficiary Designation',
                'Plan Type Selection', 'Initial Purchase Payment', 'Benefit Riders',
                'Dollar Cost Averaging', 'Client Acknowledgements', 'Representative Info',
              ].map((section) => (
                <Chip
                  key={section}
                  label={section}
                  size="small"
                  icon={<CheckCircle sx={{ fontSize: 12 }} />}
                  sx={{
                    fontSize: '0.6875rem', bgcolor: BLOOM.greenPale, color: BLOOM.green,
                    border: `1px solid ${BLOOM.green}44`,
                    '& .MuiChip-icon': { color: BLOOM.green },
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Confirm / override application type */}
          <Paper sx={{ p: 2, mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1.25 }}>
              Confirm Application Type
            </Typography>
            <TextField
              select size="small" defaultValue="Variable Annuity"
              sx={{ width: 280, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
              onChange={() => {}}
            >
              {['Variable Annuity', 'Fixed Annuity', 'Indexed Annuity', 'Term Life', 'Whole Life', 'Universal Life'].map((t) => (
                <MenuItem key={t} value={t} sx={{ fontSize: '0.8125rem' }}>{t}</MenuItem>
              ))}
            </TextField>
          </Paper>

          {/* Supporting documents — compact, optional */}
          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1 }}>
              Supporting Documents <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 400, color: BLOOM.textSecondary, textTransform: 'none', letterSpacing: 0 }}>— optional</Typography>
            </Typography>
            <input
              ref={supportingInputRef}
              type="file"
              accept=".pdf,.PDF,.doc,.docx"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleSupportingFiles(e.target.files)}
            />
            <Box
              onClick={() => supportingInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverSupporting(true); }}
              onDragLeave={() => setDragOverSupporting(false)}
              onDrop={(e) => { e.preventDefault(); setDragOverSupporting(false); handleSupportingFiles(e.dataTransfer.files); }}
              sx={{
                p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: '6px',
                border: `1.5px dashed ${dragOverSupporting ? BLOOM.blue : BLOOM.border}`,
                bgcolor: dragOverSupporting ? BLOOM.bluePale : BLOOM.canvas,
                transition: 'all 0.15s', mb: supportingFiles.length > 0 ? 1.5 : 0,
                '&:hover': { borderColor: BLOOM.blue, bgcolor: BLOOM.bluePale },
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: BLOOM.textSecondary }}>
                Drop APS, paramedical results, or other docs here · <Box component="span" sx={{ color: BLOOM.blue, fontWeight: 600 }}>click to browse</Box>
              </Typography>
            </Box>

            {supportingFiles.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['File Name', 'Type', 'Size', 'Date', ''].map((h) => (
                        <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'text.secondary', bgcolor: BLOOM.canvas }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supportingFiles.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <DescriptionOutlined sx={{ fontSize: 16, color: BLOOM.blue }} />
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{f.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select size="small" value={f.formType} onChange={() => {}}
                            sx={{ width: 180, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.5 } }}
                          >
                            {DOC_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: '0.8125rem' }}>{o}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{f.size}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{f.date}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setSupportingFiles([])} sx={{ color: BLOOM.red }}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );

  // ── Step 3: Review extracted data ─────────────────────────────────────────
  const STEP3_TABS = ['Annuitant / Owner', 'Plan & Payment', 'Riders', 'Beneficiary', 'Representative'];

  const renderStep3 = () => (
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      {/* Left: tabbed form — scrolls independently */}
      <Box sx={{ flex: 1, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', pr: 0.5 }}>

        {/* Header + confidence summary */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ mb: 0.375 }}>Review Extracted Data</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>34 fields extracted ·</Typography>
            <Chip size="small" label="32 confirmed"
              sx={{ height: 18, fontSize: '0.6875rem', bgcolor: BLOOM.greenPale, color: BLOOM.green }} />
            <Chip size="small" label="2 review"
              sx={{ height: 18, fontSize: '0.6875rem', bgcolor: BLOOM.orangePale, color: BLOOM.orange }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>· * required · % = AI confidence</Typography>
          </Box>
        </Box>

        {/* Warning banner */}
        <Alert severity="warning" sx={{ mb: 1.5 }} icon={<Warning />}>
          <Typography sx={{ fontSize: '0.75rem' }}>
            Contingent beneficiary address not provided — follow-up required before issue.
          </Typography>
        </Alert>

        {/* Section tabs */}
        <Box sx={{ borderBottom: `1px solid ${BLOOM.border}`, mb: 2 }}>
          <Tabs
            value={step3Tab}
            onChange={(_, v) => setStep3Tab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              '& .MuiTab-root': { fontSize: '0.75rem', minHeight: 36, py: 0.75, textTransform: 'none' },
              '& .MuiTabs-indicator': { bgcolor: BLOOM.blue },
              '& .Mui-selected': { color: `${BLOOM.blue} !important` },
            }}
          >
            {STEP3_TABS.map((label) => <Tab key={label} label={label} />)}
          </Tabs>
        </Box>

        {/* Tab 0: Annuitant / Owner */}
        {step3Tab === 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
            <FieldRow label="Full Name"      required confidence={99} {...field('fullName')} />
            <FieldRow label="Date of Birth"  required confidence={99} {...field('dob')} />
            <FieldRow label="Gender"         required confidence={99} {...field('gender')} />
            <FieldRow label="SSN (masked)"   required confidence={95} {...field('ssn')} />
            <FieldRow label="Address"        required confidence={98} {...field('address')} />
            <FieldRow label="City"           required confidence={97} {...field('city')} />
            <FieldRow label="State"          required confidence={99} {...field('state')} />
            <FieldRow label="Zip Code"       required confidence={97} {...field('zipCode')} />
            <FieldRow label="Email"                   confidence={88} {...field('email')} />
            <FieldRow label="Phone"                   confidence={92} {...field('phone')} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label="Country of Citizenship" required confidence={99} {...field('citizenship')} />
            </Box>
          </Box>
        )}

        {/* Tab 1: Plan & Payment */}
        {step3Tab === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
            <FieldRow label="Plan Type"      required confidence={99} {...field('planType')} />
            <FieldRow label="Tax Year"                confidence={97} {...field('taxYear')} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label="Product Name" required confidence={99} {...field('productName')} />
            </Box>
            <FieldRow label="Initial Purchase Payment" required confidence={99} {...field('purchasePayment')} />
            <FieldRow label="DCA Source Fund"                   confidence={94} {...field('dcaSource')} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label="Existing Policy Replacements" required confidence={99} {...field('replacements')} />
            </Box>
          </Box>
        )}

        {/* Tab 2: Riders */}
        {step3Tab === 2 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
            <FieldRow label="Living Benefit Rider" confidence={98} {...field('livingBenefitRider')} />
            <FieldRow label="Death Benefit Rider"  confidence={98} {...field('deathBenefitRider')} />
          </Box>
        )}

        {/* Tab 3: Beneficiary */}
        {step3Tab === 3 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
            <FieldRow label="Primary Beneficiary"  required confidence={99} {...field('primaryBeneficiary')} />
            <FieldRow label="Relationship"         required confidence={97} {...field('primaryRelationship')} />
            <FieldRow label="Percentage"           required confidence={99} {...field('primaryPct')} />
            <FieldRow label="Beneficiary DOB"               confidence={96} {...field('primaryDob')} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label="Primary SSN (masked)"        confidence={94} {...field('primarySSN')} />
            </Box>
            <FieldRow label="Contingent Beneficiary" confidence={78} lowConf {...field('contingentBeneficiary')} />
            <FieldRow label="Contingent DOB"         confidence={88}        {...field('contingentDob')} />
          </Box>
        )}

        {/* Tab 4: Representative */}
        {step3Tab === 4 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
            <FieldRow label="Rep Name"       required confidence={97} {...field('repName')} />
            <FieldRow label="Firm"                    confidence={96} {...field('repFirm')} />
            <FieldRow label="Business Phone"          confidence={92} {...field('repPhone')} />
            <FieldRow label="NPN"            required confidence={99} {...field('repNPN')} />
            <FieldRow label="State License"           confidence={95} {...field('repLicenseId')} />
            <FieldRow label="Date Signed"    required confidence={99} {...field('dateSigned')} />
          </Box>
        )}
      </Box>

      {/* Right: Real PDF viewer */}
      <Box sx={{ width: 560, flexShrink: 0, position: 'sticky', top: 24, height: 'calc(100vh - 280px)' }}>
        <PdfDocumentViewer
          pdfUrl="/acord_application.pdf"
          confidenceScore={97}
          fieldsExtracted={34}
          totalFields={35}
        />
      </Box>
    </Box>
  );

  // ── Step 4: Review & Submit ───────────────────────────────────────────────
  const renderStep4 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Review &amp; Submit</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2.5 }}>
        Final review before routing to the underwriting queue.
      </Typography>

      {/* AI Triage result */}
      <Paper sx={{ p: 2, mb: 2.5, borderLeft: `3px solid ${BLOOM.green}`, bgcolor: BLOOM.greenPale }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <AutoAwesome sx={{ fontSize: 18, color: BLOOM.green }} />
          <Typography sx={{ fontWeight: 700, color: BLOOM.green }}>AI Triage Result</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, mb: 0.5 }}>
          ✅ STP Eligible — Straight-Through Processing
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: BLOOM.textSecondary }}>
          Non-qualified annuity, no replacements, all required fields complete. No suitability flags detected.
        </Typography>
      </Paper>

      {/* Checklist */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, mb: 1.25 }}>Submission Checklist</Typography>
        {[
          'Application uploaded and extracted — 97% confidence',
          'All required fields complete — no manual corrections needed',
          'No replacement triggers — suitability review not required',
          'Representative licensing verified — NPN 1234, SC licensed',
        ].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.875 }}>
            <CheckCircle sx={{ fontSize: 16, color: BLOOM.green, flexShrink: 0, mt: 0.125 }} />
            <Typography sx={{ fontSize: '0.8125rem' }}>{item}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
        {[
          {
            title: 'Annuitant / Owner',
            rows: [['Name', data.fullName || 'Sam W Smith'], ['DOB', data.dob || '01/01/2000'], ['Gender', data.gender || 'Male'], ['State', data.state || 'SC']],
          },
          {
            title: 'Plan & Payment',
            rows: [['Product', data.productName || 'Bloom Prime Options — Variable Annuity'], ['Plan Type', data.planType || 'Non-Qualified'], ['Purchase Payment', data.purchasePayment || '$100,000'], ['Tax Year', data.taxYear || '2026']],
          },
          {
            title: 'Riders & Options',
            rows: [['Living Benefit', data.livingBenefitRider || 'None elected'], ['Death Benefit', data.deathBenefitRider || 'None elected'], ['DCA Source', data.dcaSource || 'Fixed Account'], ['Replacements', data.replacements || 'No']],
          },
          {
            title: 'Beneficiary',
            rows: [['Primary', data.primaryBeneficiary || 'John Smith'], ['Relationship', data.primaryRelationship || 'Spouse'], ['%', data.primaryPct || '100%'], ['Contingent', data.contingentBeneficiary || 'Jake James John']],
          },
        ].map((card) => (
          <Paper key={card.title} sx={{ p: 1.75 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: BLOOM.blue, mb: 1 }}>{card.title}</Typography>
            {card.rows.map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', width: 110, flexShrink: 0 }}>{k}</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{v}</Typography>
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
    </Box>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <Box sx={{ p: 3, maxWidth: activeStep === 2 ? 1500 : 1100, mx: 'auto' }}>

      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.25 }}>New Submission — Life &amp; Annuity</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          AI-powered intake · Upload application forms and let AI classify and extract the data for you
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < activeStep}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-completed': { color: BLOOM.green },
                    '&.Mui-active': { color: BLOOM.blue },
                  },
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', fontWeight: activeStep === i ? 700 : 400 }}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step content */}
      <Paper sx={{ p: 3, mb: 2.5, minHeight: 400 }}>
        {steps[activeStep]?.()}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={activeStep === 0 ? () => navigate('/dashboard') : handleBack}
          sx={{ color: BLOOM.textSecondary, borderColor: BLOOM.border }}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" sx={{ color: BLOOM.blue, borderColor: BLOOM.blue }}>
            Save as Draft
          </Button>
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              disabled={activeStep === 0 && acordFiles.length === 0}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleSubmit}
              sx={{ bgcolor: BLOOM.green, '&:hover': { bgcolor: BLOOM.green + 'CC' } }}
            >
              Submit to Underwriting
            </Button>
          )}
        </Box>
      </Box>

      {/* Success dialog */}
      <Dialog open={successOpen} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircle sx={{ color: BLOOM.green, fontSize: 28 }} />
            <Typography variant="h6">Submission Created Successfully</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {[
              ['Submission ID', 'NB-2026-VA-001'],
              ['Applicant', 'Sam W Smith'],
              ['Product', 'Bloom Prime Options — Variable Annuity · $100,000'],
              ['Routing', 'STP Queue — Straight-Through Processing'],
              ['Expected Issue', '1–2 business days'],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', width: 140, flexShrink: 0 }}>{k}</Typography>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{v}</Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="success" sx={{ mt: 2 }}>
            Routed to STP Queue · AI confidence 97% · Expected same-day issue
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleSuccessClose} variant="contained">
            Open Workbench
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
