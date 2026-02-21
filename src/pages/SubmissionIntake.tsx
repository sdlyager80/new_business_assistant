import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Stepper, Step, StepLabel,
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

const STEPS = ['Upload ACORD Forms', 'Supporting Documents', 'Review AI-Extracted Data', 'Review & Submit'];

// ── Demo file ─────────────────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  name: string;
  formType: string;
  size: string;
  date: string;
}

interface ExtractedData {
  fullName: string;
  dob: string;
  gender: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  occupation: string;
  annualIncome: string;
  productType: string;
  faceAmount: string;
  benefitPeriod: string;
  premiumMode: string;
  riders: string;
  preExisting: string;
  medications: string;
  hospitalizations: string;
  surgeries: string;
  familyHistory: string;
  tobacco: string;
  alcohol: string;
  hazardous: string;
  foreignTravel: string;
  primaryBeneficiary: string;
  primaryRelationship: string;
  primaryPct: string;
  primaryDob: string;
  contingentBeneficiary: string;
}

const DEMO_ACORD: UploadedFile = {
  id: 'demo-1',
  name: 'ACORD_103_Rodriguez_Maria.pdf',
  formType: 'ACORD 103 — Life Application',
  size: '1.2 MB',
  date: '2026-02-22',
};

const DEMO_EXTRACTED: ExtractedData = {
  fullName: 'Maria Rodriguez',
  dob: '1990-03-15',
  gender: 'Female',
  ssn: '***-**-4521',
  address: '2847 Sunset Blvd',
  city: 'Miami',
  state: 'FL',
  zipCode: '33101',
  occupation: 'Registered Nurse',
  annualIncome: '$72,000',
  productType: 'Term Life — 20 Year',
  faceAmount: '$500,000',
  benefitPeriod: '20 Years',
  premiumMode: 'Monthly',
  riders: 'Waiver of Premium',
  preExisting: 'None',
  medications: 'None',
  hospitalizations: 'None',
  surgeries: 'None',
  familyHistory: 'Father — Hypertension (controlled)',
  tobacco: 'Never',
  alcohol: 'Social (< 5 drinks/week)',
  hazardous: 'None disclosed',
  foreignTravel: 'None in past 12 months',
  primaryBeneficiary: 'Carlos Rodriguez',
  primaryRelationship: 'Spouse',
  primaryPct: '100%',
  primaryDob: '1988-06-20',
  contingentBeneficiary: 'Elena Rodriguez (Daughter)',
};

const DOC_TYPE_OPTIONS = ['APS', 'Paramedical Results', 'Financial Statement', 'Blood Profile', 'Other'];

// ── Small sub-components ──────────────────────────────────────────────────────
function FieldRow({
  label,
  value,
  onChange,
  error,
  lowConf,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  lowConf?: boolean;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.375 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</Typography>
        {error && <Error sx={{ fontSize: 13, color: BLOOM.red }} />}
        {!error && lowConf && <Warning sx={{ fontSize: 13, color: BLOOM.orange }} />}
      </Box>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error || (lowConf ? 'Low confidence — verify' : undefined)}
        FormHelperTextProps={{ sx: { fontSize: '0.6875rem', color: error ? BLOOM.red : BLOOM.orange, mt: 0.25 } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            bgcolor: error ? BLOOM.redPale : lowConf ? BLOOM.orangePale : 'background.paper',
          },
        }}
      />
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.75px', color: BLOOM.blue, mt: 2, mb: 1,
      pb: 0.5, borderBottom: `1px solid ${BLOOM.border}`,
    }}>{children}</Typography>
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

  // Extracted data state
  const [data, setData] = useState<ExtractedData>({
    fullName: '', dob: '', gender: '', ssn: '', address: '', city: '', state: '', zipCode: '',
    occupation: '', annualIncome: '', productType: '', faceAmount: '', benefitPeriod: '',
    premiumMode: '', riders: '', preExisting: '', medications: '', hospitalizations: '',
    surgeries: '', familyHistory: '', tobacco: '', alcohol: '', hazardous: '',
    foreignTravel: '', primaryBeneficiary: '', primaryRelationship: '', primaryPct: '',
    primaryDob: '', contingentBeneficiary: '',
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
    navigate('/workbench/NB-2026-LA-002');
  };

  // ── Step 1: Upload ACORD ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Upload Insurance Application Forms</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2.5 }}>
        Upload the ACORD forms from the applicant. AI will automatically extract and pre-fill all fields.
      </Typography>

      {/* Demo load chip */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quick demo:</Typography>
        <Chip
          label="Load Maria Rodriguez demo"
          size="small"
          icon={<AutoAwesome sx={{ fontSize: 13 }} />}
          onClick={loadDemo}
          sx={{ bgcolor: BLOOM.bluePale, color: BLOOM.blue, cursor: 'pointer', border: `1px solid ${BLOOM.blue + '44'}` }}
        />
      </Box>

      {/* Drop zone */}
      <Paper sx={{
        p: 4, textAlign: 'center', bgcolor: BLOOM.canvas,
        border: `2px dashed ${BLOOM.border}`, cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { borderColor: BLOOM.blue, bgcolor: BLOOM.bluePale },
        mb: 2,
      }}>
        <CloudUpload sx={{ fontSize: 40, color: BLOOM.grey, mb: 1 }} />
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Drag &amp; drop ACORD forms here or click to browse</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Supported: ACORD 103 (Life Application) · ACORD 104 (Life Supplement) · ACORD 65 (Annuity Application)
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
            ✨ AI extraction running on ACORD 103 — estimated completion 2 min...
          </Typography>
          <LinearProgress sx={{ mt: 1, bgcolor: BLOOM.border, '& .MuiLinearProgress-bar': { bgcolor: BLOOM.blue } }} />
        </Alert>
      )}
      {aiComplete && (
        <Alert severity="success" sx={{ mb: 2 }}>
          AI extraction complete — 91 of 92 fields extracted with 98% confidence.
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

  // ── Step 2: Supporting docs ───────────────────────────────────────────────
  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Upload Supporting Documents</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 2 }}>
        Upload APS, paramedical results, and other supporting documents while AI continues processing the ACORD form.
      </Typography>

      {aiRunning && (
        <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 2, bgcolor: BLOOM.bluePale, color: BLOOM.blue, border: `1px solid ${BLOOM.blue + '44'}` }}>
          ✨ AI extraction running on ACORD 103 — estimated completion 2 min...
          <LinearProgress sx={{ mt: 0.75, bgcolor: BLOOM.border, '& .MuiLinearProgress-bar': { bgcolor: BLOOM.blue } }} />
        </Alert>
      )}
      {aiComplete && (
        <Alert severity="success" sx={{ mb: 2 }}>AI extraction complete — ready to review on next step.</Alert>
      )}

      {/* Drop zone */}
      <Paper sx={{
        p: 4, textAlign: 'center', bgcolor: BLOOM.canvas,
        border: `2px dashed ${BLOOM.border}`, cursor: 'pointer',
        transition: 'all 0.15s', mb: 2,
        '&:hover': { borderColor: BLOOM.blue, bgcolor: BLOOM.bluePale },
      }}>
        <CloudUpload sx={{ fontSize: 40, color: BLOOM.grey, mb: 1 }} />
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Upload Supporting Documents</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          APS · Paramedical Results · Financial Statements · Blood Profile · Other
        </Typography>
      </Paper>

      {/* Demo: add a supporting doc */}
      <Box sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DescriptionOutlined />}
          onClick={() => setSupportingFiles([{ id: 'sup-1', name: 'APS_Rodriguez_DrSmith.pdf', formType: 'APS', size: '0.8 MB', date: '2026-02-22' }])}
          sx={{ color: BLOOM.blue, borderColor: BLOOM.blue }}
        >
          + Add demo APS
        </Button>
      </Box>

      {supportingFiles.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['File Name', 'Type', 'Size', 'Date', 'Action'].map((h) => (
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
                      select size="small" value={f.formType}
                      onChange={() => {}}
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
    </Box>
  );

  // ── Step 3: Review extracted data ─────────────────────────────────────────
  const renderStep3 = () => (
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      {/* Left: editable form */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 0.25 }}>Review AI-Extracted Data</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            Review and correct any fields. Red = validation error · Orange = low AI confidence.
          </Typography>
        </Box>

        {/* Validation errors banner */}
        <Alert severity="error" sx={{ mb: 1.5 }} icon={<Error />}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>1 validation error found</Typography>
          <Typography sx={{ fontSize: '0.75rem' }}>
            DOB inconsistency — application shows 1990-03-15 but ID shows 1990-05-13. Please verify.
          </Typography>
        </Alert>
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          <Typography sx={{ fontSize: '0.75rem' }}>
            Income field — unable to clearly extract from document. Manual entry required.
          </Typography>
        </Alert>

        {/* Proposed Insured */}
        <SectionTitle>1. Proposed Insured</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
          <FieldRow label="Full Name"      {...field('fullName')} />
          <FieldRow label="Date of Birth"  {...field('dob')} error="DOB inconsistency — verify against ID" />
          <FieldRow label="Gender"         {...field('gender')} />
          <FieldRow label="SSN (masked)"   {...field('ssn')} />
          <FieldRow label="Address"        {...field('address')} />
          <FieldRow label="City"           {...field('city')} />
          <FieldRow label="State"          {...field('state')} />
          <FieldRow label="Zip Code"       {...field('zipCode')} />
          <FieldRow label="Occupation"     {...field('occupation')} />
          <FieldRow label="Annual Income"  {...field('annualIncome')} lowConf />
        </Box>

        {/* Coverage */}
        <SectionTitle>2. Coverage Requested</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
          <FieldRow label="Product Type"   {...field('productType')} />
          <FieldRow label="Face Amount"    {...field('faceAmount')} />
          <FieldRow label="Benefit Period" {...field('benefitPeriod')} />
          <FieldRow label="Premium Mode"   {...field('premiumMode')} />
          <Box sx={{ gridColumn: '1 / -1' }}>
            <FieldRow label="Riders" {...field('riders')} />
          </Box>
        </Box>

        {/* Medical */}
        <SectionTitle>3. Medical History</SectionTitle>
        <FieldRow label="Pre-Existing Conditions" {...field('preExisting')} />
        <FieldRow label="Current Medications"     {...field('medications')} />
        <FieldRow label="Hospitalizations"        {...field('hospitalizations')} />
        <FieldRow label="Surgeries"               {...field('surgeries')} />
        <FieldRow label="Family History"          {...field('familyHistory')} />

        {/* Lifestyle */}
        <SectionTitle>4. Lifestyle</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
          <FieldRow label="Tobacco Use"          {...field('tobacco')} />
          <FieldRow label="Alcohol Consumption"  {...field('alcohol')} />
          <FieldRow label="Hazardous Activities" {...field('hazardous')} />
          <FieldRow label="Foreign Travel"       {...field('foreignTravel')} />
        </Box>

        {/* Beneficiary */}
        <SectionTitle>5. Beneficiary</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 2 }}>
          <FieldRow label="Primary Beneficiary"  {...field('primaryBeneficiary')} />
          <FieldRow label="Relationship"         {...field('primaryRelationship')} />
          <FieldRow label="Percentage"           {...field('primaryPct')} />
          <FieldRow label="Beneficiary DOB"      {...field('primaryDob')} />
        </Box>
        <FieldRow label="Contingent Beneficiary" {...field('contingentBeneficiary')} />
      </Box>

      {/* Right: "PDF source" mock */}
      <Box sx={{ width: 260, flexShrink: 0 }}>
        <Paper sx={{ p: 1.5, bgcolor: BLOOM.canvas, position: 'sticky', top: 0 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 1, color: BLOOM.textSecondary }}>SOURCE DOCUMENT</Typography>
          <Box sx={{ bgcolor: '#fff', border: `1px solid ${BLOOM.border}`, borderRadius: '6px', p: 1.5, minHeight: 340 }}>
            <Box sx={{ fontSize: '0.625rem', fontWeight: 700, textAlign: 'center', mb: 1.5, pb: 0.75, borderBottom: `1px solid ${BLOOM.border}` }}>
              ACORD 103 — LIFE APPLICATION
            </Box>
            {Object.entries({
              'Full Name': 'Maria Rodriguez',
              'Date of Birth': '03/15/1990',
              Gender: 'Female',
              SSN: '***-**-4521',
              Occupation: 'Registered Nurse',
              'Face Amount': '$500,000',
              'Product': 'Term Life 20yr',
              'Tobacco': 'Never',
            }).map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 0.5, mb: 0.75, alignItems: 'flex-start' }}>
                <Box sx={{ bgcolor: BLOOM.bluePale, border: `1px solid ${BLOOM.blue + '44'}`, borderRadius: '3px', px: 0.5, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.5625rem', color: BLOOM.blue, fontWeight: 600 }}>{k}</Typography>
                  <Typography sx={{ fontSize: '0.625rem', fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px solid ${BLOOM.border}` }}>
              <Typography sx={{ fontSize: '0.5625rem', color: 'text.secondary' }}>
                Confidence: <strong style={{ color: BLOOM.green }}>98%</strong> · 91/92 fields extracted
              </Typography>
            </Box>
          </Box>
        </Paper>
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
          Clean medical history, within appetite, no referral triggers detected. Expected table class: Preferred Plus.
        </Typography>
      </Paper>

      {/* Checklist */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, mb: 1.25 }}>Submission Checklist</Typography>
        {[
          'ACORD 103 uploaded and extracted (98% confidence)',
          'Required fields complete — 1 field manually corrected (DOB)',
          'No referral triggers — STP pathway confirmed',
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
            title: 'Proposed Insured',
            rows: [['Name', data.fullName || 'Maria Rodriguez'], ['DOB', data.dob || '1990-05-13'], ['Gender', data.gender || 'Female'], ['Occupation', data.occupation || 'Registered Nurse']],
          },
          {
            title: 'Coverage Requested',
            rows: [['Product', data.productType || 'Term Life — 20 Year'], ['Face Amount', data.faceAmount || '$500,000'], ['Premium Mode', data.premiumMode || 'Monthly'], ['Riders', data.riders || 'Waiver of Premium']],
          },
          {
            title: 'Medical & Lifestyle',
            rows: [['Pre-existing', data.preExisting || 'None'], ['Medications', data.medications || 'None'], ['Tobacco', data.tobacco || 'Never'], ['Alcohol', data.alcohol || 'Social']],
          },
          {
            title: 'Beneficiary',
            rows: [['Primary', data.primaryBeneficiary || 'Carlos Rodriguez'], ['Relationship', data.primaryRelationship || 'Spouse'], ['%', data.primaryPct || '100%'], ['Contingent', data.contingentBeneficiary || 'Elena Rodriguez']],
          },
        ].map((card) => (
          <Paper key={card.title} sx={{ p: 1.75 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: BLOOM.blue, mb: 1 }}>{card.title}</Typography>
            {card.rows.map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', width: 100, flexShrink: 0 }}>{k}</Typography>
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
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>

      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.25 }}>New Submission — Life &amp; Annuity</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          AI-powered intake · Upload ACORD forms and let AI extract the data for you
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
              ['Submission ID', 'NB-2026-LA-006'],
              ['Applicant', 'Maria Rodriguez'],
              ['Product', 'Term Life — 20 Year · $500,000'],
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
            Routed to STP Queue · AI confidence 98% · Expected same-day issue
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
