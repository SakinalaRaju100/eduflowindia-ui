import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI, messageAPI } from '@/api/client';
import { format } from 'date-fns';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function ParentChildProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', content: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['student-full-parent', studentId],
    queryFn: () => studentAPI.getFullData(studentId),
    enabled: !!studentId,
  });
  const d = data?.data?.data;
  const profile = d?.profile;
  const att = d?.attendance;
  const results = d?.results || [];
  const fees = d?.fees;

  const msgMutation = useMutation({
    mutationFn: (body) => messageAPI.send(body),
    onSuccess: () => {
      qc.invalidateQueries(['messages']);
      setMsgOpen(false);
      setMsgForm({ subject: '', content: '' });
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!profile) return <Typography>Student not found</Typography>;

  const teacherId = profile?.classroom?.classTeacher;

  const STATUS_COLORS = {
    present: '#43A047',
    absent: '#E53935',
    'half-day': '#FB8C00',
    late: '#1565C0',
    leave: '#8E24AA',
  };

  const buildMonthGrid = () => {
    if (!att?.records) return [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const rec = att.records.find(
        (r) => new Date(r.date).getDate() === day && new Date(r.date).getMonth() === now.getMonth(),
      );
      return { day, status: rec?.status || null };
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/parent')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {profile?.userId?.firstName} {profile?.userId?.lastName}
        </Typography>
      </Box>

      {/* Header */}
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar
              src={profile?.userId?.photo}
              sx={{ width: 72, height: 72, fontSize: 24, fontWeight: 700, bgcolor: 'primary.main' }}
            >
              {profile?.userId?.firstName?.[0]}
              {profile?.userId?.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {profile?.userId?.firstName} {profile?.userId?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={`ID: ${profile?.studentId}`} size="small" variant="outlined" />
                <Chip label={`Roll: ${profile?.rollNumber}`} size="small" variant="outlined" />
                <Chip label={profile?.classroom?.name} size="small" color="primary" />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
              <Typography
                variant="h3"
                fontWeight={800}
                color={att?.percentage >= 75 ? 'success.main' : 'error.main'}
              >
                {att?.percentage || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Attendance
              </Typography>
              <LinearProgress
                variant="determinate"
                value={att?.percentage || 0}
                sx={{ mt: 0.5, height: 5, borderRadius: 3 }}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<Send />}
              onClick={() => setMsgOpen(true)}
              size="small"
            >
              Message Teacher
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
        <Tab label="Attendance" />
        <Tab label="Results" />
        <Tab label="Fees" />
      </Tabs>

      {/* Attendance */}
      <TabPanel value={tab} index={0}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {format(new Date(), 'MMMM yyyy')} Attendance
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 2 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Typography
                  key={d}
                  variant="caption"
                  align="center"
                  fontWeight={700}
                  color="text.secondary"
                >
                  {d}
                </Typography>
              ))}
              {Array.from({
                length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay(),
              }).map((_, i) => (
                <Box key={`e${i}`} />
              ))}
              {buildMonthGrid().map(({ day, status }) => (
                <Box
                  key={day}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: status ? STATUS_COLORS[status] + '22' : 'background.default',
                    border: `1px solid ${status ? STATUS_COLORS[status] + '44' : 'transparent'}`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: status ? STATUS_COLORS[status] : 'text.disabled',
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_COLORS).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: v }} />
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {k}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Results */}
      <TabPanel value={tab} index={1}>
        {results.length === 0 ? (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No results available</Typography>
            </CardContent>
          </Card>
        ) : (
          results.map((r) => (
            <Card
              key={r._id}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography fontWeight={700}>{r.exam?.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.exam?.term}
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="center">Marks</TableCell>
                        <TableCell align="center">Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {r.subjectMarks?.map((s) => (
                        <TableRow key={s.subjectCode}>
                          <TableCell>{s.subjectName}</TableCell>
                          <TableCell align="center">
                            {s.marksObtained}/{s.maxMarks}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={s.grade || '—'}
                              size="small"
                              color={s.isPassed ? 'success' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))
        )}
      </TabPanel>

      {/* Fees */}
      <TabPanel value={tab} index={2}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h5" fontWeight={800} color="success.main">
                ₹{fees?.totalPaid?.toLocaleString() || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Paid
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h5" fontWeight={800} color="error.main">
                ₹{fees?.totalDue?.toLocaleString() || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Due
              </Typography>
            </Card>
          </Grid>
        </Grid>
        {fees?.records?.map((fee) => (
          <Card
            key={fee._id}
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight={700}>{fee.feeType}</Typography>
                <Chip
                  label={fee.status}
                  size="small"
                  color={
                    fee.status === 'paid'
                      ? 'success'
                      : fee.status === 'overdue'
                        ? 'error'
                        : 'warning'
                  }
                />
              </Box>
              {fee.installments?.map((inst) => (
                <Box
                  key={inst.installmentNo}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">Installment {inst.installmentNo}</Typography>
                  <Typography variant="body2">₹{inst.amount?.toLocaleString()}</Typography>
                  <Chip
                    label={inst.isPaid ? 'Paid' : 'Due'}
                    size="small"
                    color={inst.isPaid ? 'success' : 'default'}
                    sx={{ height: 20 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      {/* Message Teacher Dialog */}
      <Dialog open={msgOpen} onClose={() => setMsgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Message Class Teacher</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              size="small"
              label="Subject"
              value={msgForm.subject}
              onChange={(e) => setMsgForm((p) => ({ ...p, subject: e.target.value }))}
            />
            <TextField
              size="small"
              label="Message"
              multiline
              rows={4}
              value={msgForm.content}
              onChange={(e) => setMsgForm((p) => ({ ...p, content: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setMsgOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => msgMutation.mutate({ ...msgForm, to: teacherId, studentRef: studentId })}
            disabled={!msgForm.content || msgMutation.isPending}
          >
            {msgMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Send Message'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
