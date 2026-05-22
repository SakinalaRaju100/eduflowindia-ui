import React, { useMemo } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Divider } from '@mui/material';
import { Class, Assignment, BeachAccess, Message } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { classroomAPI, announcementAPI, leaveAPI } from '@/api/client';
import StatCard from '@/components/common/StatCard';
import { useNavigate, useOutletContext } from 'react-router-dom';
import SchoolBanner from '../../components/common/SchoolBanner';

export default function TeacherDashboard() {
  const { data: cls } = useQuery({ queryKey: ['t-classes'], queryFn: () => classroomAPI.getAll() });
  const { data: anns } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementAPI.getAll(),
  });
  const { data: leaves } = useQuery({ queryKey: ['t-leaves'], queryFn: () => leaveAPI.getAll() });
  const classes = cls?.data?.data || [];
  const announcements = anns?.data?.data || [];
  const leaveList = leaves?.data?.data || [];
  const pendingLeaves = leaveList.filter((l) => l.status === 'pending');
  const navigate = useNavigate();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};

  const filteredAnnouncements = useMemo(() => {
    if (!selectedYear) return announcements;
    return announcements.filter((a) => {
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
  }, [announcements, selectedYear, selectedAcademicYearObject]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
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
  }, [classes, selectedYear, selectedAcademicYearObject]);

  return (
    <Box>
      <SchoolBanner />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid onClick={() => navigate('/teacher/classes')} item xs={6} sm={3}>
          <StatCard
            title="My Classes"
            value={filteredClasses.length}
            icon={<Class />}
            color="#1565C0"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Pending Leaves"
            value={pendingLeaves.length}
            icon={<BeachAccess />}
            color="#A26900"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Student Leave reqquests"
            value={pendingLeaves.length}
            icon={<Assignment />}
            color="#E65100"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Announcements"
            value={filteredAnnouncements.length}
            icon={<Message />}
            color="#6A1B9A"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                My Classes
              </Typography>
              {filteredClasses.map((c, i) => (
                <Box key={c._id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box
                    onClick={() => navigate(`/teacher/classes/${c._id}`)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      p: 1,
                      mx: -1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.students?.length || 0} students · Room {c.roomNumber || '—'}
                      </Typography>
                    </Box>
                    <Chip label={`Grade ${c.grade}`} size="small" color="primary" />
                  </Box>
                </Box>
              ))}
              {filteredClasses.length === 0 && (
                <Typography color="text.secondary">
                  No classes assigned for the selected year
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Announcements
              </Typography>
              {filteredAnnouncements.slice(0, 4).map((a, i) => (
                <Box key={a._id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
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
                      sx={{ flexShrink: 0 }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.content?.slice(0, 80)}...
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              {filteredAnnouncements.length === 0 && (
                <Typography color="text.secondary">
                  No announcements for the selected year
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
