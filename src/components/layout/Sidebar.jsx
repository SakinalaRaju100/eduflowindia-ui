import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  School,
  People,
  Class,
  Assignment,
  AttachMoney,
  Event,
  Campaign,
  BarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Logout,
  Person,
  CalendarMonth,
  Grade,
  Message,
  BeachAccess,
  HomeWork,
  AdminPanelSettings,
  CorporateFare,
  Payments,
  ContactSupport,
  Home,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 72;

const NAV_CONFIG = {
  superadmin: [
    { label: 'Home', icon: <Home />, path: '/superadmin/home' },
    { label: 'Institutions', icon: <CorporateFare />, path: '/superadmin' },
  ],
  principal: [
    { label: 'Home', icon: <Home />, path: '/principal/home' },
    { label: 'Dashboard', icon: <Dashboard />, path: '/principal' },
    { label: 'Institution Profile', icon: <CorporateFare />, path: '/principal/profile' },
    { label: 'Classrooms', icon: <Class />, path: '/principal/classrooms' },
    { label: 'Students', icon: <People />, path: '/principal/students' },
    { label: 'Teachers', icon: <Person />, path: '/principal/teachers' },
    { label: 'Exams & Results', icon: <Assignment />, path: '/principal/exams' },
    { label: 'Fees', icon: <AttachMoney />, path: '/principal/fees' },
    { label: 'Salaries', icon: <Payments />, path: '/principal/salaries' },
    { label: 'Calendar', icon: <CalendarMonth />, path: '/principal/calendar' },
    { label: 'Leaves', icon: <BeachAccess />, path: '/principal/leaves' },
    { label: 'Announcements', icon: <Campaign />, path: '/principal/announcements' },
    { label: 'Inquiries', icon: <ContactSupport />, path: '/principal/inquiries' },
    // { label: 'Reports', icon: <BarChart />, path: '/principal/reports' },
    { label: 'Settings', icon: <Settings />, path: '/principal/settings' },
  ],
  teacher: [
    { label: 'Home', icon: <Home />, path: '/teacher/home' },
    { label: 'Dashboard', icon: <Dashboard />, path: '/teacher' },
    { label: 'My Classes', icon: <Class />, path: '/teacher/classes' },
    { label: 'Exams & Results', icon: <Assignment />, path: '/teacher/exams' },
    { label: 'Calendar', icon: <CalendarMonth />, path: '/teacher/calendar' },
    { label: 'Leaves', icon: <BeachAccess />, path: '/teacher/leaves' },
    { label: 'Salary Details', icon: <Payments />, path: '/teacher/salaries' },
    { label: 'Messages', icon: <Message />, path: '/teacher/messages' },
  ],
  student: [
    { label: 'Home', icon: <Home />, path: '/student/home' },
    { label: 'Institution', icon: <CorporateFare />, path: '/student/Institution' },
    { label: 'My Profile', icon: <Person />, path: '/student/profile' },
    { label: 'Calendar', icon: <CalendarMonth />, path: '/student/calendar' },
    { label: 'Exams & Results', icon: <Grade />, path: '/student/exams' },
    { label: 'Fees', icon: <AttachMoney />, path: '/student/fees' },
    { label: 'Announcements', icon: <Campaign />, path: '/student/announcements' },
    { label: 'Messages', icon: <Message />, path: '/student/messages' },
  ],
  parent: [
    { label: 'Home', icon: <Home />, path: '/parent/home' },
    { label: 'Institution', icon: <CorporateFare />, path: '/parent/Institution' },
    { label: 'My Children', icon: <HomeWork />, path: '/parent' },
    { label: 'Messages', icon: <Message />, path: '/parent/messages' },
  ],
};

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export default function Sidebar({ open, onToggle, isMobile, onOpenProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  let navItems = NAV_CONFIG[user?.role] || [];

  if (user?.role === 'parent' && location.pathname.includes('/parent/child/')) {
    const studentId = location.pathname.split('/parent/child/')[1].split('/')[0];
    navItems = [
      { label: 'Back to Children', icon: <ChevronLeft />, path: '/parent' },
      {
        label: 'Institution',
        icon: <CorporateFare />,
        path: `/parent/child/${studentId}/Institution`,
      },
      { label: 'Child Profile', icon: <Person />, path: `/parent/child/${studentId}/profile` },
      { label: 'Calendar', icon: <CalendarMonth />, path: `/parent/child/${studentId}/calendar` },
      { label: 'Exams & Results', icon: <Grade />, path: `/parent/child/${studentId}/exams` },
      { label: 'Fees', icon: <AttachMoney />, path: `/parent/child/${studentId}/fees` },
      {
        label: 'Announcements',
        icon: <Campaign />,
        path: `/parent/child/${studentId}/announcements`,
      },
      { label: 'Messages', icon: <Message />, path: `/parent/child/${studentId}/messages` },
    ];
  }
  const [isHovered, setIsHovered] = useState(false);

  const actualOpen = open || isHovered;
  const containerWidth = isMobile ? 0 : open ? DRAWER_WIDTH : MINI_WIDTH;
  const paperWidth = isMobile ? DRAWER_WIDTH : actualOpen ? DRAWER_WIDTH : MINI_WIDTH;
  const isExpanded = isMobile || actualOpen;

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onToggle();
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onToggle}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        onMouseEnter: () => !isMobile && !open && setIsHovered(true),
        onMouseLeave: () => !isMobile && !open && setIsHovered(false),
      }}
      sx={{
        width: containerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: paperWidth,
          overflowX: 'hidden',
          transition: theme.transitions.create(['width', 'box-shadow'], {
            easing: theme.transitions.easing.sharp,
            duration: 250,
          }),
          boxShadow: isHovered && !open ? theme.shadows[8] : 'none',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          px: isExpanded ? 2.5 : 1,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: 72,
        }}
      >
        {isExpanded && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <School sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                sx={{ color: '#fff', lineHeight: 1, fontSize: 13 }}
              >
                EduFlow
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                Management System
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' },
          }}
        >
          {isExpanded ? (
            <ChevronLeft
              sx={{
                fontSize: 20,
                transition: 'transform 0.3s',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          ) : (
            <ChevronRight sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>

      {/* Institution name */}
      {isExpanded && user && user.role !== 'superadmin' && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: 10,
            }}
          >
            Institution
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              mt: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.institution?.name || ''}
          </Typography>
        </Box>
      )}

      {/* Nav Items */}
      <List sx={{ flex: 1, py: 1.5, px: isExpanded ? 1.5 : 0.5 }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/parent' &&
              item.path !== '/' + user?.role &&
              location.pathname.startsWith(item.path));
          return (
            <Tooltip key={item.path} title={!isExpanded ? item.label : ''} placement="right" arrow>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    minHeight: 44,
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    px: isExpanded ? 2 : 'auto',
                    bgcolor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isActive ? 'blur(8px)' : 'none',
                    border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'translateX(2px)' },
                    transition: 'all 0.18s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isExpanded ? 36 : 'auto',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {isExpanded && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13.5,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                      }}
                    />
                  )}
                  {isExpanded && isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#fff',
                        ml: 'auto',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      {/* User profile + logout */}
      {user && (
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: isExpanded ? 2 : 1 }}>
          <Box
            onClick={onOpenProfile}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: isExpanded ? 1.5 : 0,
              cursor: 'pointer',
              p: 1,
              mx: -1,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            <Avatar
              src={user?.photo}
              sx={{
                width: 36,
                height: 36,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.25)',
                border: '2px solid rgba(255,255,255,0.4)',
                flexShrink: 0,
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
            {isExpanded && (
              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 13,
                  }}
                >
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Chip
                  label={ROLE_LABELS[user?.role]}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 9,
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              </Box>
            )}
          </Box>
          <Tooltip title="Logout" placement="right">
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 2,
                justifyContent: isExpanded ? 'flex-start' : 'center',
                px: isExpanded ? 1.5 : 'auto',
                py: 0.8,
                bgcolor: 'rgba(255,80,80,0.12)',
                border: '1px solid rgba(255,80,80,0.15)',
                '&:hover': { bgcolor: 'rgba(255,80,80,0.25)' },
                color: '#FF8A80',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isExpanded ? 32 : 'auto',
                  color: '#FF8A80',
                  '& .MuiSvgIcon-root': { fontSize: 18 },
                }}
              >
                <Logout />
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      )}
    </Drawer>
  );
}
