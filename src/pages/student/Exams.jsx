import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOutletContext, useParams } from 'react-router-dom';

export default function StudentExams() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const targetId = studentId || user?._id;
  const { selectedYear } = useOutletContext() || {};
  const { data, isLoading } = useQuery({
    queryKey: ['student-full', targetId],
    queryFn: () => studentAPI.getFullData(targetId),
    enabled: !!targetId,
  });
  const results = data?.data?.data?.results || [];

  if (isLoading) return <Typography>Loading...</Typography>;

  const filteredResults = results.filter(r => !selectedYear || r.exam?.academicYear === selectedYear);

  const byTerm = filteredResults.reduce((acc, r) => {
    const term = r.exam?.term || 'Unknown';
    if (!acc[term]) acc[term] = [];
    acc[term].push(r);
    return acc;
  }, {});

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Exams & Results</Typography>

      {filteredResults.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No exam results available yet.</Typography>
          </CardContent>
        </Card>
      )}

      {Object.entries(byTerm).map(([term, termResults]) => (
        <Box key={term} sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>{term}</Typography>
          <Grid container spacing={2.5}>
            {termResults.map(r => (
              <Grid item xs={12} lg={6} key={r._id}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{r.exam?.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.exam?.type}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip label={r.overallGrade} size="small" color={r.isPassed ? 'success' : 'error'} sx={{ fontWeight: 800, fontSize: 14, height: 28 }} />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          GPA: {r.gpa} · Rank #{r.rank}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>Overall</Typography>
                        <Typography variant="body2" fontWeight={700} color={r.percentage >= 60 ? 'success.main' : 'error.main'}>
                          {r.totalMarks}/{r.maxTotalMarks} ({r.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={r.percentage || 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': { bgcolor: r.percentage >= 60 ? 'success.main' : 'error.main' } }} />
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Subject</TableCell>
                            <TableCell align="center">Marks</TableCell>
                            {/* <TableCell align="center">Grade</TableCell> */}
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {r.subjectMarks?.map(s => (
                            <TableRow key={s.subjectCode}>
                              <TableCell>{s.subjectName}</TableCell>
                              <TableCell align="center">{s.marksObtained}/{s.maxMarks}{s.passingMarks}</TableCell>
                              {/* <TableCell align="center"><Chip label={s.grade || '—'} size="small" /></TableCell> */}
                              <TableCell align="center">
                                <Chip label={s.marksObtained/s.maxMarks >= 0.35 ? 'Pass' : 'Fail'} size="small" color={s.marksObtained/s.maxMarks >= 0.35 ? 'success' : 'error'} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
