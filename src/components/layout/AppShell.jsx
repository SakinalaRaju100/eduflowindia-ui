import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '@/contexts/AuthContext';
import UserProfilePopup from '@/components/common/UserProfilePopup';

const PAGE_TITLES = {
  '/superadmin': 'Schools Management',
  '/principal': 'Dashboard',
  '/principal/profile': 'School Profile',
  '/principal/classrooms': 'Classrooms',
  '/principal/students': 'Students',
  '/principal/teachers': 'Teachers',
  '/principal/exams': 'Examinations',
  '/principal/fees': 'Fee Management',
  '/principal/salaries': 'Teacher Salaries',
  '/principal/calendar': 'School Calendar',
  '/principal/leaves': 'Leave Management',
  '/principal/announcements': 'Announcements',
  '/principal/reports': 'Reports & Analytics',
  '/principal/settings': 'Settings',
  '/teacher': 'Dashboard',
  '/teacher/classes': 'My Classes',
  '/teacher/exams': 'Exams',
  '/teacher/calendar': 'Calendar',
  '/teacher/leaves': 'Leave Management',
  '/teacher/salaries': 'My Salary Details',
  '/teacher/messages': 'Messages',
  '/student/profile': 'My Profile',
  '/student/school': 'School Info',
  '/student/calendar': 'My Calendar',
  '/student/exams': 'Exams & Results',
  '/student/fees': 'Fee Details',
  '/student/announcements': 'Announcements',
  '/student/messages': 'Messages',
  '/parent': 'My Children',
  '/parent/school': 'School Info',
  '/parent/child/:id/school': 'School Info',
  '/parent/child/:id/profile': 'Child Profile',
  '/parent/child/:id/calendar': 'Child Calendar',
  '/parent/child/:id/exams': 'Child Exams & Results',
  '/parent/child/:id/fees': 'Child Fee Details',
  '/parent/child/:id/announcements': 'Announcements',
  '/parent/child/:id/messages': 'Messages',
  '/parent/messages': 'Messages',
};

const MINI_WIDTH = 72;
const FULL_WIDTH = 260;

export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAcademicYearObject, setSelectedAcademicYearObject] = useState(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile]);

  const handleYearChange = (year, obj) => {
    setSelectedYear(year);
    if (obj) setSelectedAcademicYearObject(obj);
  };

  const drawerWidth = isMobile ? 0 : sidebarOpen ? FULL_WIDTH : MINI_WIDTH;

  // Find matching page title
  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => {
      const regexPath = path.replace(/:[^\s/]+/g, '([a-zA-Z0-9_-]+)');
      if (new RegExp(`^${regexPath}$`).test(location.pathname)) return true;
      if (location.pathname.includes('/classrooms/') && path === '/principal/classrooms')
        return true;
      if (location.pathname.includes('/classes/') && path === '/teacher/classes') return true;
      return location.pathname === path;
    })?.[1] || 'EduFlow';

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        isMobile={isMobile}
        onOpenProfile={() => setProfilePopupOpen(true)}
      />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ml: 0,
          transition: 'margin 0.25s ease',
        }}
      >
        <TopBar
          drawerWidth={drawerWidth}
          pageTitle={pageTitle}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          isMobile={isMobile}
          onYearChange={handleYearChange}
          onOpenProfile={() => setProfilePopupOpen(true)}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            mt: '64px',
            p: { xs: 0, md: 1 },
            // p: 0,
            bgcolor: 'background.default',
          }}
        >
          <Outlet context={{ selectedYear, selectedAcademicYearObject }} />
        </Box>
      </Box>
      <UserProfilePopup open={profilePopupOpen} onClose={() => setProfilePopupOpen(false)} />
    </Box>
  );
}
