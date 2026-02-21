import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ThemeProvider, CssBaseline, Box, Typography, IconButton,
  InputBase, Badge, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddCircleOutline,
  Assignment,
  Folder,
  BarChart,
  Settings,
  Search,
  SmartToy,
  Notifications,
  ChevronLeft,
  ChevronRight,
  FiberManualRecord,
} from '@mui/icons-material';
import { theme, BLOOM } from './theme';
import Dashboard from './pages/Dashboard';
import SubmissionIntake from './pages/SubmissionIntake';
import UnderwritingWorkbench from './pages/UnderwritingWorkbench';

const HEADER_H = 60;
const SIDEBAR_W = 240;
const SIDEBAR_MINI = 64;

// ── Bloom logo text mark ──────────────────────────────────────────────────────
function BloomLogo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: '8px',
        background: `linear-gradient(135deg, ${BLOOM.blue}, ${BLOOM.blueLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FiberManualRecord sx={{ color: '#fff', fontSize: 14 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: BLOOM.textPrimary, letterSpacing: '-0.3px', fontFamily: '"Roboto Slab", serif' }}>Bloom</Typography>
        <Typography sx={{ fontSize: 17, fontWeight: 400, color: BLOOM.textSecondary, letterSpacing: '-0.3px' }}>Insurance</Typography>
      </Box>
    </Box>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  dividerBefore?: boolean;
}

const NAV: NavItem[] = [
  { label: 'Dashboard',        icon: <DashboardIcon fontSize="small" />,      path: '/dashboard' },
  { label: 'New Submission',   icon: <AddCircleOutline fontSize="small" />,   path: '/intake',     dividerBefore: true },
  { label: 'My Queue',         icon: <Assignment fontSize="small" />,          path: '/workbench' },
  { label: 'All Submissions',  icon: <Folder fontSize="small" />,              path: '/dashboard' },
  { label: 'Analytics',        icon: <BarChart fontSize="small" />,            path: '/dashboard', dividerBefore: true },
  { label: 'Settings',         icon: <Settings fontSize="small" />,            path: '/dashboard' },
];

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarW = sidebarOpen ? SIDEBAR_W : SIDEBAR_MINI;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Fixed Header ─────────────────────────────────────────────── */}
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, height: HEADER_H,
          bgcolor: 'background.paper', borderBottom: `1px solid ${BLOOM.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, zIndex: 400,
        }}>
          {/* Left: logo + app name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => setSidebarOpen((v) => !v)} sx={{ mr: 0.5 }}>
              {sidebarOpen ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
            <BloomLogo />
            <Box sx={{ width: 1, height: 20, bgcolor: BLOOM.border, mx: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: BLOOM.textPrimary }}>
                New Business Assistant
              </Typography>
              <Box sx={{
                fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                background: `linear-gradient(135deg, ${BLOOM.blue}, ${BLOOM.blueLight})`,
                color: '#fff', px: 0.875, py: 0.25, borderRadius: '4px',
              }}>Smart App</Box>
            </Box>
          </Box>

          {/* Right: search + actions + user */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Search */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              bgcolor: BLOOM.canvas, border: `1px solid ${BLOOM.border}`,
              borderRadius: '6px', px: 1.25, py: 0.5, width: 220,
            }}>
              <Search sx={{ fontSize: 16, color: BLOOM.grey }} />
              <InputBase
                placeholder="Search submissions..."
                sx={{ fontSize: '0.8125rem', flex: 1 }}
              />
            </Box>

            {/* AI Chat */}
            <Tooltip title="AI Assistant">
              <IconButton size="small" sx={{
                bgcolor: BLOOM.bluePale, color: BLOOM.blue,
                '&:hover': { bgcolor: BLOOM.blue, color: '#fff' },
              }}>
                <SmartToy fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <IconButton size="small">
              <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', minWidth: 16, height: 16 } }}>
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>

            {/* User avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: `1px solid ${BLOOM.border}` }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '50%',
                bgcolor: BLOOM.blue, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.625rem',
              }}>KW</Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>Karen Walsh</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', lineHeight: 1.2 }}>New Business Analyst</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarW,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: sidebarW,
              top: HEADER_H,
              height: `calc(100vh - ${HEADER_H}px)`,
              borderRight: `1px solid ${BLOOM.border}`,
              bgcolor: 'background.paper',
              overflowX: 'hidden',
              transition: 'width 0.2s ease',
              boxSizing: 'border-box',
            },
          }}
        >
          <List dense sx={{ pt: 1.5, pb: 1 }}>
            {NAV.map((item) => {
              const active = location.pathname === item.path ||
                (item.path === '/dashboard' && location.pathname === '/');
              return (
                <Box key={item.label}>
                  {item.dividerBefore && <Divider sx={{ my: 1 }} />}
                  <Tooltip title={!sidebarOpen ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      selected={active}
                      sx={{
                        mx: 1, borderRadius: '6px', mb: 0.25,
                        minHeight: 36,
                        '&.Mui-selected': {
                          bgcolor: BLOOM.bluePale,
                          color: BLOOM.blue,
                          '& .MuiListItemIcon-root': { color: BLOOM.blue },
                        },
                        '&.Mui-selected:hover': { bgcolor: BLOOM.bluePale },
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: sidebarOpen ? 36 : 'auto',
                        color: active ? BLOOM.blue : BLOOM.grey,
                        justifyContent: 'center',
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {sidebarOpen && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400 }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </Box>
              );
            })}
          </List>
        </Drawer>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <Box sx={{
          flex: 1,
          mt: `${HEADER_H}px`,
          ml: `${sidebarW}px`,
          transition: 'margin-left 0.2s ease',
          overflow: 'auto',
          bgcolor: 'background.default',
          minHeight: `calc(100vh - ${HEADER_H}px)`,
        }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/intake"     element={<SubmissionIntake />} />
            <Route path="/workbench"  element={<UnderwritingWorkbench />} />
            <Route path="/workbench/:id" element={<UnderwritingWorkbench />} />
          </Routes>
        </Box>

      </Box>
    </ThemeProvider>
  );
}
