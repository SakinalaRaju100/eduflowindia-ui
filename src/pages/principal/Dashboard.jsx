import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import { People, Class, Person, AttachMoney, TrendingUp, School } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api, { principalAPI, attendanceAPI, announcementAPI } from '@/api/client';
import StatCard from '@/components/common/StatCard';
import InstitutionBanner from '@/components/common/InstitutionBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function PrincipalDashboard() {
  const { data: schoolProfile } = useQuery({
    queryKey: ['my-institution'],
    queryFn: () => api.get('/principal/Institution-profile').then((res) => res.data.data),
  });
  const { data: reports } = useQuery({
    queryKey: ['p-reports'],
    queryFn: () => principalAPI.getReports(),
  });
  const { data: attSummary } = useQuery({
    queryKey: ['att-summary'],
    queryFn: () => attendanceAPI.getInstitutionSummary(),
  });
  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementAPI.getAll(),
  });
  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => principalAPI.getClassrooms(),
  });

  const r = reports?.data?.data || {};
  const att = attSummary?.data?.data || {};
  const anns = announcements?.data?.data || [];
  const cls = classrooms?.data?.data || [];
  const navigate = useNavigate();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};

  const filteredClassrooms = useMemo(() => {
    return cls.filter((c) => {
      let matchDates = false;
      if (
        selectedAcademicYearObject?.startDate &&
        selectedAcademicYearObject?.endDate &&
        c.academicStartDate &&
        c.academicEndDate
      ) {
        try {
          const cStart = new Date(c.academicStartDate).setHours(0, 0, 0, 0);
          const cEnd = new Date(c.academicEndDate).setHours(0, 0, 0, 0);
          const sStart = new Date(selectedAcademicYearObject.startDate).setHours(0, 0, 0, 0);
          const sEnd = new Date(selectedAcademicYearObject.endDate).setHours(0, 0, 0, 0);
          matchDates = cStart >= sStart && cEnd <= sEnd;
        } catch (e) {
          /* ignore invalid dates */
        }
      }
      return !selectedYear || c.academicYear === selectedYear || matchDates;
    });
  }, [cls, selectedYear, selectedAcademicYearObject]);

  const filteredAnnouncements = useMemo(() => {
    if (!selectedYear) return anns;
    return anns.filter((a) => {
      if (a.academicYear) return a.academicYear === selectedYear;
      if (!a.createdAt) return true;

      const aDate = new Date(a.createdAt).getTime();
      if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate) {
        const start = new Date(selectedAcademicYearObject.startDate).setHours(0, 0, 0, 0);
        const end = new Date(selectedAcademicYearObject.endDate).setHours(23, 59, 59, 999);
        return aDate >= start && aDate <= end;
      } else {
        const startYear = parseInt(selectedYear.split('-')[0]);
        if (!isNaN(startYear)) {
          const start = new Date(startYear, 3, 1).getTime();
          const end = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
          return aDate >= start && aDate <= end;
        }
        return true;
      }
    });
  }, [anns, selectedYear, selectedAcademicYearObject]);

  const attData = [
    { name: 'Present', value: att.present || 0, color: '#43A047' },
    { name: 'Absent', value: att.absent || 0, color: '#E53935' },
    { name: 'Late', value: att.late || 0, color: '#1565C0' },
    { name: 'Leave', value: att.leave || 0, color: '#8E24AA' },
  ].filter((d) => d.value > 0);

  const classData = filteredClassrooms.map((c) => ({
    name: c.name || `Grade ${c.grade} - ${c.section}`,
    students: c.students?.length || 0,
  }));

  return (
    <Box>
      <InstitutionBanner />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid onClick={() => navigate('/principal/classrooms')} item xs={6} sm={3}>
          <StatCard
            title="Classrooms"
            value={filteredClassrooms.length}
            icon={<Class />}
            color="#6A1B9A"
            loading={!classrooms}
          />
        </Grid>
        <Grid onClick={() => navigate('/principal/teachers')} item xs={6} sm={3}>
          <StatCard
            title="Total Teachers"
            value={r.totalTeachers}
            icon={<Person />}
            color="#2E7D32"
            loading={!reports}
          />
        </Grid>
        <Grid onClick={() => navigate('/principal/students')} item xs={6} sm={3}>
          <StatCard
            title="Total Students"
            value={r.totalStudents}
            icon={<People />}
            color="#1565C0"
            loading={!reports}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Today Present"
            value={att.present || 0}
            subtitle={`of ${att.total || 0} total`}
            icon={<TrendingUp />}
            color="#E65100"
            loading={!attSummary}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Attendance Pie */}
        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Today's Attendance
              </Typography>
              {attData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={attData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {attData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 220,
                  }}
                >
                  <Typography color="text.secondary">No attendance data today</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Classes Bar */}
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Students per Class
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#1565C0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Announcements */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Announcements
              </Typography>
              {filteredAnnouncements.length === 0 ? (
                <Typography color="text.secondary">
                  No announcements for the selected year
                </Typography>
              ) : (
                filteredAnnouncements.slice(0, 5).map((a, i) => (
                  <Box key={a._id}>
                    {i > 0 && <Divider sx={{ my: 1 }} />}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {a.title}
                          </Typography>
                          <Chip
                            label={a.priority}
                            size="small"
                            color={
                              a.priority === 'urgent'
                                ? 'error'
                                : a.priority === 'important'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {a.content?.slice(0, 120)}...
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: 'nowrap', ml: 2 }}
                      >
                        {a.createdAt ? format(new Date(a.createdAt), 'dd MMM') : ''}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
