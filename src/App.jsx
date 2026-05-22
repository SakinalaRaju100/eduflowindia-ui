import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { buildTheme } from '@/theme/themes';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/layout/AppShell';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// SuperAdmin
import SADashboard from '@/pages/superadmin/Dashboard';

// Principal
import PrincipalDashboard from '@/pages/principal/Dashboard';
import PrincipalClassrooms from '@/pages/principal/Classrooms';
import PrincipalClassroomDetail from '@/pages/principal/ClassroomDetail';
import PrincipalStudents from '@/pages/principal/Students';
import PrincipalTeachers from '@/pages/principal/Teachers';
import PrincipalExams from '@/pages/principal/Exams';
import PrincipalFees from '@/pages/principal/Fees';
import PrincipalSalaries from '@/pages/principal/Salaries';
import PrincipalCalendar from '@/pages/principal/Calendar';
import PrincipalLeaves from '@/pages/principal/Leaves';
import PrincipalAnnouncements from '@/pages/principal/Announcements';
import PrincipalReports from '@/pages/principal/Reports';
import PrincipalSettings from '@/pages/principal/Settings';

// Teacher
import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherClasses from '@/pages/teacher/Classes';
import TeacherClassroomDetail from '@/pages/teacher/ClassroomDetail';
import TeacherExams from '@/pages/teacher/Exams';
import TeacherCalendar from '@/pages/teacher/Calendar';
import TeacherLeaves from '@/pages/teacher/Leaves';
import TeacherMessages from '@/pages/teacher/Messages';
import TeacherSalaries from './pages/teacher/Salaries';


// Student
import StudentProfile from '@/pages/student/Profile';
import StudentCalendar from '@/pages/student/Calendar';
import StudentExams from '@/pages/student/Exams';
import StudentFees from '@/pages/student/Fees';
import StudentAnnouncements from '@/pages/student/Announcements';
import StudentMessages from '@/pages/student/Messages';

// Parent
import ParentDashboard from '@/pages/parent/Dashboard';
import ParentMessages from '@/pages/parent/Messages';
import SchoolInfo from './components/common/SchoolInfo';

const ROLE_HOME = {
  superadmin: '/superadmin',
  principal: '/principal',
  teacher: '/teacher',
  student: '/student/profile',
  parent: '/parent',
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  if (user.isFirstLogin) return <Navigate to="/change-password" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  const hasTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken');

  if (loading && hasTokens) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  return <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const hasTokens = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken');

  if (loading && hasTokens) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (user) {
    if (user.isFirstLogin) return <Navigate to="/change-password" replace />;
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }
  return children;
};

export default function App() {
  const { user } = useAuth();
  const theme = useMemo(() =>
    buildTheme(user?.preferences?.themeColor || 'blue', user?.preferences?.theme || 'light'),
    [user?.preferences?.themeColor, user?.preferences?.theme]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* SuperAdmin */}
        <Route path="/superadmin" element={<ProtectedRoute roles={['superadmin']}><AppShell /></ProtectedRoute>}>
          <Route index element={<SADashboard />} />
        </Route>

        {/* Principal */}
        <Route path="/principal" element={<ProtectedRoute roles={['principal']}><AppShell /></ProtectedRoute>}>
          <Route index element={<PrincipalDashboard />} />
          <Route path="classrooms" element={<PrincipalClassrooms />} />
          <Route path="classrooms/:id" element={<PrincipalClassroomDetail />} />
          <Route path="students" element={<PrincipalStudents />} />
          <Route path="teachers" element={<PrincipalTeachers />} />
          <Route path="exams" element={<PrincipalExams />} />
          <Route path="fees" element={<PrincipalFees />} />
          <Route path="salaries" element={<PrincipalSalaries />} />
          <Route path="calendar" element={<PrincipalCalendar />} />
          <Route path="leaves" element={<PrincipalLeaves />} />
          <Route path="announcements" element={<PrincipalAnnouncements />} />
          <Route path="reports" element={<PrincipalReports />} />
          <Route path="settings" element={<PrincipalSettings />} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><AppShell /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="classes/:id" element={<TeacherClassroomDetail />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="calendar" element={<TeacherCalendar />} />
          <Route path="leaves" element={<TeacherLeaves />} />
          <Route path="salaries" element={<TeacherSalaries />} />
          <Route path="messages" element={<TeacherMessages />} />
        </Route>

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><AppShell /></ProtectedRoute>}>
          <Route path="profile" element={<StudentProfile />} />
          <Route path="school" element={<SchoolInfo />} />
          <Route path="calendar" element={<StudentCalendar />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="messages" element={<StudentMessages />} />
        </Route>

        {/* Parent */}
        <Route path="/parent" element={<ProtectedRoute roles={['parent']}><AppShell /></ProtectedRoute>}>
          <Route index element={<ParentDashboard />} />
          <Route path="school" element={<SchoolInfo />} />
          <Route path="child/:studentId" element={<Navigate to="profile" replace />} />
          <Route path="child/:studentId/profile" element={<StudentProfile />} />
          <Route path="child/:studentId/school" element={<SchoolInfo />} />
          <Route path="child/:studentId/calendar" element={<StudentCalendar />} />
          <Route path="child/:studentId/exams" element={<StudentExams />} />
          <Route path="child/:studentId/fees" element={<StudentFees />} />
          <Route path="child/:studentId/announcements" element={<StudentAnnouncements />} />
          <Route path="child/:studentId/messages" element={<StudentMessages />} />
          <Route path="messages" element={<ParentMessages />} />
        </Route>

      {/* Public School Profile */}
      <Route path="/:schoolUniqueId" element={<SchoolInfo />} />

      {/* Root Redirect */}
      <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
