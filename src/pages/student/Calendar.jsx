import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, TextField, Select,
  MenuItem, FormControl, InputLabel, Alert, CircularProgress,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Event } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarAPI, examAPI, studentAPI, leaveAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths, isFuture, isToday } from 'date-fns';
import { useOutletContext, useParams } from 'react-router-dom';

const STATUS_COLORS = {
  present: '#43A047', absent: '#E53935', 'half-day': '#FB8C00',
  late: '#1565C0', leave: '#8E24AA', holiday: '#78909C',
};

export default function StudentCalendar() {
  const { user } = useAuth(); const qc = useQueryClient();
  const { studentId } = useParams();
  const targetId = studentId || user?._id;
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', reason: '' });
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const start = startOfMonth(currentMonth); const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const firstDayOffset = start.getDay();

  const { data: fullData } = useQuery({
    queryKey: ['student-full', targetId],
    queryFn: () => studentAPI.getFullData(targetId),
    enabled: !!targetId,
  });
  const { data: evData } = useQuery({
    queryKey: ['calendar', format(start, 'yyyy-MM')],
    queryFn: () => calendarAPI.getEvents({ start: start.toISOString(), end: end.toISOString() }),
  });
  const { data: exData } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll() });
  const { data: leaveData } = useQuery({ queryKey: ['student-leaves'], queryFn: () => leaveAPI.getAll() });
  const { data: diaryData } = useQuery({
    queryKey: ['diary-student', fullData?.data?.data?.profile?.classroom?._id],
    queryFn: () => studentAPI.getDiaryNotes({ classroomId: fullData?.data?.data?.profile?.classroom?._id }),
    enabled: !!fullData?.data?.data?.profile?.classroom?._id,
  });

  const attRecords = fullData?.data?.data?.attendance?.records || [];
  const events = evData?.data?.data || [];
  const exams = exData?.data?.data || [];
  const leaves = leaveData?.data?.data || [];
  const diaryNotes = diaryData?.data?.data || [];

  const leaveMutation = useMutation({
    mutationFn: d => leaveAPI.apply(d),
    onSuccess: () => { qc.invalidateQueries(['student-leaves']); setLeaveOpen(false); },
  });

  const getDayStatus = (day) => attRecords.find(r => isSameDay(new Date(r.date), day))?.status;
  const getDayEvents = (day) => events.filter(e => { const s = new Date(e.startDate); const en = e.endDate ? new Date(e.endDate) : s; return day >= s && day <= en; });
  const getDayExams = (day) => exams.filter(e => e.subjects?.some(s => s.date && isSameDay(new Date(s.date), day)));
  const getDayLeave = (day) => leaves.find(l => l.status === 'approved' && new Date(l.fromDate) <= day && new Date(l.toDate) >= day);
  const getDayDiaryNotes = (day) => diaryNotes.filter(n => n.date && isSameDay(new Date(n.date), day));

  let filteredAttRecords = attRecords;
  if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate) {
    const sDate = new Date(selectedAcademicYearObject.startDate).setHours(0,0,0,0);
    const eDate = new Date(selectedAcademicYearObject.endDate).setHours(23,59,59,999);
    filteredAttRecords = filteredAttRecords.filter(r => {
      const d = new Date(r.date).getTime();
      return d >= sDate && d <= eDate;
    });
  } else if (selectedYear) {
    const startYear = parseInt(selectedYear.split('-')[0]);
    if (!isNaN(startYear)) {
      const sDate = new Date(startYear, 3, 1).getTime();
      const eDate = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
      filteredAttRecords = filteredAttRecords.filter(r => {
        const d = new Date(r.date).getTime();
        return d >= sDate && d <= eDate;
      });
    }
  }

  const totalDays = filteredAttRecords.filter(r => r.status !== 'holiday').length;
  const presentDays = filteredAttRecords.filter(r => ['present', 'half-day', 'late'].includes(r.status)).length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  useEffect(() => {
    if (!autoOpened && fullData && evData && exData && leaveData && diaryData) {
      setSelectedDay(format(new Date(), 'yyyy-MM-dd'));
      setDayDetailsOpen(true);
      setAutoOpened(true);
    }
  }, [fullData, evData, exData, leaveData, diaryData, autoOpened]);

  const handleDayClick = (day) => {
    setSelectedDay(format(day, 'yyyy-MM-dd'));
    setDayDetailsOpen(true);
  };

  const att = fullData?.data?.data?.attendance;

  // Variables for the selected day in popup
  const selectedDateObj = selectedDay ? new Date(selectedDay + 'T00:00:00') : new Date();
  const selStatus = getDayStatus(selectedDateObj);
  const selEvs = getDayEvents(selectedDateObj);
  const selExs = getDayExams(selectedDateObj);
  const selLeave = getDayLeave(selectedDateObj);
  const selNotes = getDayDiaryNotes(selectedDateObj);
  const selHoliday = selEvs.some(e => e.type === 'holiday' || e.type === 'weekend');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selCanApplyLeave = selectedDay > todayStr && !selHoliday;

  return (
    <Box>
      {/* Attendance summary */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[['Overall %', `${percentage}%`, percentage >= 75 ? '#43A047' : '#E53935'],
          ['Present Days', presentDays, '#43A047'],
          ['Total Days', totalDays, '#1565C0'],
          ['Absent', totalDays - presentDays, '#E53935']].map(([label, value, color]) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Calendar */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></IconButton>
            <Typography variant="h6" fontWeight={700}>{format(currentMonth, 'MMMM yyyy')}</Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></IconButton>
          </Box>
          <Grid container sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Grid item xs={12 / 7} key={d}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" display="block">{d}</Typography>
              </Grid>
            ))}
          </Grid>
          <Grid container>
            {Array.from({ length: firstDayOffset }).map((_, i) => <Grid item xs={12 / 7} key={`e${i}`} sx={{ minHeight: 80 }} />)}
            {days.map(day => {
              const status = getDayStatus(day);
              const dayEvs = getDayEvents(day);
              const dayExs = getDayExams(day);
              const dayLeave = getDayLeave(day);
              const dayNotes = getDayDiaryNotes(day);
              const wknd = day.getDay() === 0;
              const today = isToday(day);
              const future = isFuture(day);
              const isHoliday = dayEvs.some(e => e.type === 'holiday' || e.type === 'weekend');
              const canApplyLeave = future && !isHoliday;
              const statusColor = status ? STATUS_COLORS[status] : null;
              return (
                <Grid item xs={12 / 7} key={day.toISOString()} sx={{ minHeight: 80, p: 0.3 }}>
                  <Box
                    onClick={() => handleDayClick(day)}
                    sx={{
                      height: '100%', minHeight: 76, borderRadius: 1.5, p: 0.5, cursor: 'pointer',
                      bgcolor: today ? 'primary.main' : statusColor ? statusColor + '18' : day.getDay() === 0 ? 'action.hover' : 'transparent',
                      border: `1px solid ${statusColor ? statusColor + '44' : 'transparent'}`,
                      '&:hover': { bgcolor: today ? 'primary.main' : 'action.selected', transform: 'scale(1.02)' },
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                      <Typography variant="caption" fontWeight={today ? 800 : 400}
                        sx={{ color: today ? '#fff' : wknd ? 'error.main' : 'text.primary' }}>
                        {format(day, 'd')}
                      </Typography>
                      {status && !today && (
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography sx={{ fontSize: 8, color: '#fff', fontWeight: 800 }}>
                            {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : status === 'half-day' ? 'H' : 'Le'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {dayEvs.slice(0, 1).map(ev => (
                      <Box key={ev._id} sx={{ bgcolor: ev.color + '22', borderLeft: `2px solid ${ev.color}`, px: 0.4, py: 0.1, borderRadius: 0.5, mb: 0.2 }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 600, color: ev.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</Typography>
                      </Box>
                    ))}
                    {dayExs.slice(0, 1).map((ex, i) => (
                      <Box key={i} sx={{ bgcolor: '#FF6F0022', borderLeft: '2px solid #FF6F00', px: 0.4, py: 0.1, borderRadius: 0.5, mb: 0.2 }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#FF6F00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {ex.title}</Typography>
                      </Box>
                    ))}
                    {dayNotes.slice(0, 1).map((note, i) => (
                      <Box key={i} sx={{ bgcolor: '#00796B22', borderLeft: '2px solid #00796B', px: 0.4, py: 0.1, borderRadius: 0.5, mb: 0.2 }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#00796B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={note.content}>📓 {note.subject || 'Diary Note'}</Typography>
                      </Box>
                    ))}
                    {canApplyLeave && !wknd && (
                      <Typography sx={{ fontSize: 9, color: 'text.disabled', textAlign: 'center' }}>+ leave</Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: v }} />
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{k}</Typography>
          </Box>
        ))}
      </Box>

      {/* Leave history */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Leave History</Typography>
          {leaves.length === 0
            ? <Typography color="text.secondary">No leaves applied</Typography>
            : leaves.map(l => (
                <Box key={l._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{l.leaveType} leave</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {l.fromDate ? format(new Date(l.fromDate), 'dd MMM') : ''} – {l.toDate ? format(new Date(l.toDate), 'dd MMM yyyy') : ''} ({l.totalDays} days)
                    </Typography>
                  </Box>
                  <Chip label={l.status} size="small" color={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning'} />
                </Box>
              ))
          }
        </CardContent>
      </Card>

      {/* Day Details Popup */}
      <Dialog open={dayDetailsOpen} onClose={() => setDayDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          Details for {selectedDay ? format(new Date(selectedDay + 'T00:00:00'), 'dd MMMM yyyy') : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Attendance & Leaves */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Attendance Status</Typography>
              {selStatus ? (
                <Chip label={selStatus} size="small" sx={{ bgcolor: STATUS_COLORS[selStatus] || 'grey.500', color: '#fff', textTransform: 'capitalize', fontWeight: 600 }} />
              ) : <Typography variant="body2" color="text.secondary">Not marked</Typography>}
            </Box>
            {selLeave && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Leave Status</Typography>
                <Chip label={`Approved: ${selLeave.leaveType} leave`} color="success" size="small" sx={{ fontWeight: 600 }} />
              </Box>
            )}
          </Box>

          {/* Events */}
          {selEvs.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Events & Holidays</Typography>
              {selEvs.map(ev => (
                <Box key={ev._id} sx={{ bgcolor: (ev.color || '#1565C0') + '15', borderLeft: `3px solid ${ev.color || '#1565C0'}`, p: 1.5, borderRadius: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={700} color={ev.color || '#1565C0'}>{ev.title}</Typography>
                  {ev.description && <Typography variant="caption" color="text.secondary">{ev.description}</Typography>}
                </Box>
              ))}
            </Box>
          )}

          {/* Exams */}
          {selExs.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Scheduled Exams</Typography>
              {selExs.map(ex => (
                <Box key={ex._id} sx={{ bgcolor: '#FF6F0015', borderLeft: '3px solid #FF6F00', p: 1.5, borderRadius: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#FF6F00">{ex.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{ex.type} • {ex.term}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Diary Notes */}
          {selNotes.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Diary Notes</Typography>
              {selNotes.map(note => (
                <Box key={note._id} sx={{ bgcolor: '#00796B15', borderLeft: '3px solid #00796B', p: 1.5, borderRadius: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#00796B">{note.subject || 'General Note'}</Typography>
                  {note.content && (
                    <Box sx={{ mt: 1, p: 0.5, px: 1, bgcolor: 'success.main', borderRadius: 0.5, display: 'flex' }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>CW: {note.content}</Typography>
                    </Box>
                  )}
                  {note.homework && (
                    <Box sx={{ mt: 1, p: 0.5, px: 1, bgcolor: 'warning.main', borderRadius: 0.5, display: 'flex' }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>HW: {note.homework}</Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {!selStatus && !selLeave && selEvs.length === 0 && selExs.length === 0 && selNotes.length === 0 && (
            <Typography variant="body2" color="text.secondary">No special details scheduled for this day.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDayDetailsOpen(false)} color="inherit">Close</Button>
          {selCanApplyLeave && (
            <Button variant="contained" onClick={() => {
              setDayDetailsOpen(false);
              setLeaveForm(p => ({ ...p, fromDate: selectedDay, toDate: selectedDay }));
              setLeaveOpen(true);
            }}>Apply Leave</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Apply Leave Dialog */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Apply Leave — {selectedDay}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select value={leaveForm.leaveType} onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))} label="Leave Type">
                {['sick', 'casual', 'medical', 'personal', 'other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Reason" multiline rows={3} value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setLeaveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => leaveMutation.mutate({ ...leaveForm, fromDate: selectedDay, toDate: selectedDay })} disabled={leaveMutation.isPending}>
            {leaveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Submit Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
