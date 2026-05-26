import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useOutletContext, useParams } from 'react-router-dom';

export default function StudentProfile() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const targetId = studentId || user?._id;
  const { data, isLoading } = useQuery({
    queryKey: ['student-full', targetId],
    queryFn: () => studentAPI.getFullData(targetId),
    enabled: !!targetId,
  });
  const d = data?.data?.data;
  const profile = d?.profile;
  const att = d?.attendance;
  const results = d?.results || [];

  let filteredAttRecords = att?.records || [];
  if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate) {
    const start = new Date(selectedAcademicYearObject.startDate).setHours(0, 0, 0, 0);
    const end = new Date(selectedAcademicYearObject.endDate).setHours(23, 59, 59, 999);
    filteredAttRecords = filteredAttRecords.filter((r) => {
      const d = new Date(r.date).getTime();
      return d >= start && d <= end;
    });
  } else if (selectedYear) {
    const startYear = parseInt(selectedYear.split('-')[0]);
    if (!isNaN(startYear)) {
      const start = new Date(startYear, 3, 1).getTime();
      const end = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
      filteredAttRecords = filteredAttRecords.filter((r) => {
        const d = new Date(r.date).getTime();
        return d >= start && d <= end;
      });
    }
  }

  const totalDays = filteredAttRecords.filter((r) => r.status !== 'holiday').length;
  const presentDays = filteredAttRecords.filter((r) =>
    ['present', 'half-day', 'late'].includes(r.status),
  ).length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const filteredResults = results.filter(
    (r) => !selectedYear || r.exam?.academicYear === selectedYear,
  );

  if (isLoading)
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading your profile...</Typography>
      </Box>
    );

  const studentUser = profile?.userId || user;

  return (
    <Box>
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar
              src={studentUser?.photo}
              sx={{
                width: 80,
                height: 80,
                fontSize: 28,
                fontWeight: 700,
                bgcolor: 'primary.main',
                border: '4px solid white',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              {studentUser?.firstName?.[0]}
              {studentUser?.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={800}>
                {studentUser?.firstName} {studentUser?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`ID: ${profile?.studentId || '—'}`} size="small" variant="outlined" />
                <Chip
                  label={`Roll No: ${profile?.rollNumber || '—'}`}
                  size="small"
                  variant="outlined"
                />
                <Chip label={profile?.classroom?.name || '—'} size="small" color="primary" />
                <Chip label={profile?.academicYear || '—'} size="small" />
              </Box>
            </Box>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 3,
                minWidth: 110,
              }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                color={percentage >= 75 ? 'success.main' : 'error.main'}
              >
                {percentage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Attendance
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  mt: 0.5,
                  height: 5,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: percentage >= 75 ? 'success.main' : 'error.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {presentDays}/{totalDays} days
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Personal Information
              </Typography>
              {[
                ['Email', studentUser?.email],
                ['Phone', studentUser?.phone || '—'],
                ['Gender', profile?.gender || '—'],
                [
                  'Date of Birth',
                  profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'dd MMM yyyy') : '—',
                ],
                ['Blood Group', profile?.bloodGroup || '—'],
                ['Previous Institution', profile?.previousInstitution || '—'],
                ['Academic Year', profile?.academicYear || '—'],
              ].map(([label, value], i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ my: 0.8 }} />}
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2.5 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Results
              </Typography>
              {filteredResults.length === 0 ? (
                <Typography color="text.secondary">No results yet</Typography>
              ) : (
                filteredResults.slice(0, 4).map((r) => (
                  <Box
                    key={r._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {r.exam?.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.exam?.term} · {r.exam?.type}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={r.overallGrade}
                        size="small"
                        color={r.isPassed ? 'success' : 'error'}
                        sx={{ fontWeight: 800 }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        {r.percentage}% · Rank #{r.rank}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          {profile?.guardians?.length > 0 && (
            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Guardians
                </Typography>
                {profile.guardians.map((g, i) => (
                  <Box
                    key={i}
                    sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2, mb: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      {g.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {g.relationship} · {g.phone}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
