import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Button,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Tooltip,
  FormControl,
  Select,
} from '@mui/material';
import {
  Notifications,
  Brightness4,
  Brightness7,
  KeyboardArrowDown,
  Person,
  Lock,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { classroomAPI } from '@/api/client';

const ROLE_COLORS = {
  superadmin: '#6A1B9A',
  principal: '#1565C0',
  teacher: '#2E7D32',
  student: '#E65100',
  parent: '#00695C',
};

export default function TopBar({
  drawerWidth,
  pageTitle,
  onToggleSidebar,
  isMobile,
  onYearChange,
  onOpenProfile,
}) {
  const { user, logout, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  // console.log('user :>> ', user);

  const [schoolData, setInstitutionData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    // Check if institution is populated as an object, otherwise it's just an ID string.
    if (user?.institution && typeof user.institution === 'object') {
      setInstitutionData(user.institution);
      const currentAyObj = user.institution.academicYears?.find((ay) => ay.isCurrent);
      const currentAy = currentAyObj?.year;
      if (currentAy) {
        setSelectedYear(currentAy);
        if (onYearChange) onYearChange(currentAy, currentAyObj);
      } else if (user.institution.currentAcademicYear) {
        setSelectedYear(user.institution.currentAcademicYear);
        const fallbackObj = user.institution.academicYears?.find(
          (ay) => ay.year === user.institution.currentAcademicYear,
        );
        if (onYearChange) onYearChange(user.institution.currentAcademicYear, fallbackObj);
      }
    } else if (user?.institution && typeof user.institution === 'string') {
      console.warn(
        "Institution is just an ID. Make sure to use .populate('institution') in your backend Auth controller!",
      );
    }
  }, [user]);

  const isParent = user?.role === 'parent';
  const matchChild = location.pathname.match(/\/parent\/child\/([^\/]+)/);
  const selectedChildId = matchChild ? matchChild[1] : null;
  const targetStudentId = user?.role === 'student' ? user._id : selectedChildId;

  const { data: clsData } = useQuery({
    queryKey: ['my-classrooms', user?.role, targetStudentId],
    queryFn: () => classroomAPI.getAll(),
    enabled: user?.role === 'student' || (isParent && !!selectedChildId),
  });
  const allClasses = clsData?.data?.data || [];

  const academicYears = schoolData?.academicYears || [
    { year: '2022-2023', startDate: '2022-04-01', endDate: '2023-03-31', isCurrent: false },
    { year: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: true },
  ];

  const currentYear =
    schoolData?.currentAcademicYear ||
    academicYears.find((ay) => ay.isCurrent)?.year ||
    '2024-2025';

  const isYearDropdownDisabled = isParent && !selectedChildId;
  const showYearDropdown = !!user && user.role !== 'superadmin';
  // const showYearDropdown = user?.role == 'principal';

  const toggleMode = () => {
    const newMode = theme.palette.mode === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: newMode });
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['left', 'width'], {
          duration: 250,
          easing: theme.transitions.easing.sharp,
        }),
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: 2, sm: 3 } }}
      >
        {/* Page Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton onClick={onToggleSidebar} edge="start" sx={{ mr: 1.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
              {pageTitle || 'Dashboard'}
            </Typography>

            <Typography
              variant="caption"
              fontWeight={700}
              fontSize={{ xs: 9, md: 12 }}
              color="text.secondary"
            >
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>

        {/* Right Side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showYearDropdown && user && (
            <FormControl size="small" sx={{ minWidth: 130, mr: { xs: 0, sm: 1 } }}>
              <Select
                value={selectedYear}
                onChange={(e, child) => {
                  const ayObj = JSON.parse(child.props['data-ay']);
                  // console.log('selectedAcademicYearObject :>> ', ayObj);
                  setSelectedYear(e.target.value);
                  if (onYearChange) onYearChange(e.target.value, ayObj);
                }}
                disabled={isYearDropdownDisabled}
                sx={{
                  height: 32,
                  fontSize: 13,
                  fontWeight: 600,
                  bgcolor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSelect-select': { py: 0.5, px: 1.5, pr: '32px' },
                }}
              >
                {user?.role === 'student' || (isParent && selectedChildId)
                  ? allClasses
                      .filter((c) =>
                        c.students?.some((s) => String(s._id || s) === String(targetStudentId)),
                      )
                      .map((c) => {
                        const ay = c.academicYear || 'Unknown';
                        const cname = c.name || `Grade ${c.grade} - ${c.section}`;
                        const ayObj = {
                          year: ay,
                          startDate: c.academicStartDate,
                          endDate: c.academicEndDate,
                        };
                        return (
                          <MenuItem
                            key={c._id}
                            value={ay}
                            sx={{ fontSize: 13 }}
                            data-ay={JSON.stringify(ayObj)}
                          >
                            {ay} ({cname})
                          </MenuItem>
                        );
                      })
                  : academicYears.map((ay) => (
                      <MenuItem
                        key={ay.year}
                        value={ay.year}
                        sx={{ fontSize: 13 }}
                        data-ay={JSON.stringify(ay)}
                      >
                        {ay.year} {ay.isCurrent ? '(Current)' : ''}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          )}

          <Tooltip title={`Switch to ${theme.palette.mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleMode} size="small">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* <IconButton size="small">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton> */}

          {user ? (
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1.5,
                py: 0.8,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': { bgcolor: theme.palette.action.hover },
                transition: 'all 0.15s ease',
              }}
            >
              <Avatar
                src={user?.photo}
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: ROLE_COLORS[user?.role],
                }}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Chip
                  label={user?.role?.toUpperCase()}
                  size="small"
                  sx={{
                    height: 14,
                    fontSize: 9,
                    fontWeight: 700,
                    bgcolor: `${ROLE_COLORS[user?.role]}15`,
                    color: ROLE_COLORS[user?.role],
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              startIcon={<Lock />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onOpenProfile();
          }}
        >
          <Person sx={{ mr: 1.5, fontSize: 18 }} /> My Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate('/change-password');
          }}
        >
          <Lock sx={{ mr: 1.5, fontSize: 18 }} /> Change Password
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
          }}
          sx={{ color: 'error.main' }}
        >
          <Logout sx={{ mr: 1.5, fontSize: 18 }} /> Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
