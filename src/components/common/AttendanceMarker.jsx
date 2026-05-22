import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, TextField, Tooltip, Paper, Badge,
} from '@mui/material';
import { HowToReg } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { attendanceAPI, studentAPI } from '@/api/client';
import { format } from 'date-fns';
import StudentPopup from './StudentPopup';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS = [
  { key: 'present',  label: 'Present',  short: 'P',  color: '#43A047', bg: '#E8F5E9' },
  { key: 'absent',   label: 'Absent',   short: 'A',  color: '#E53935', bg: '#FFEBEE' },
  { key: 'half-day', label: 'Half Day', short: 'H',  color: '#FB8C00', bg: '#FFF3E0' },
  { key: 'late',     label: 'Late',     short: 'L',  color: '#1565C0', bg: '#E3F2FD' },
  { key: 'leave',    label: 'Leave',    short: 'Le', color: '#8E24AA', bg: '#F3E5F5' },
];

export default function AttendanceMarker({ classroomId, students = [] }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [existingAtt, setExistingAtt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [popupStudent, setPopupStudent] = useState(null);
  const [birthdays, setBirthdays] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!classroomId) return;
    setLoading(true);
    attendanceAPI.get(classroomId, date).then(res => {
      const att = res.data.data;
      setExistingAtt(att);
      const map = {};
      (att.records || []).forEach(r => {
        const id = r.studentId?._id || r.studentId;
        if (id) map[id] = r.status;
      });
      setRecords(map);
    }).catch(() => setRecords({})).finally(() => setLoading(false));
  }, [classroomId, date]);

  useEffect(() => {
    if (classroomId) studentAPI.getBirthdays(classroomId).then(r => setBirthdays(r.data.data)).catch(() => {});
  }, [classroomId]);

  const mark = (sid, status) => {
    setRecords(p => ({ ...p, [sid]: p[sid] === status ? null : status }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s._id] = status; });
    setRecords(map);
  };

  const submitAttendance = async () => {
    setSaving(true); setConfirmOpen(false);
    try {
      const recordsArr = students.map(s => ({ studentId: s._id, status: records[s._id] || 'absent' }));
      await attendanceAPI.submit(classroomId, { date, records: recordsArr });
      setExistingAtt(p => ({ ...p, isSubmitted: true }));
      setMsg({ type: 'success', text: 'Attendance submitted successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit' });
    } finally { setSaving(false); }
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const recordsArr = students.map(s => ({ studentId: s._id, status: records[s._id] || 'absent' }));
      await attendanceAPI.save(classroomId, { date, records: recordsArr });
      setMsg({ type: 'success', text: 'Draft saved' });
    } catch (err) { setMsg({ type: 'error', text: 'Failed to save' }); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(records).filter(s => ['present','late','half-day'].includes(s)).length;
  const markedCount = Object.values(records).filter(Boolean).length;

  return (
    <Box>
      {birthdays.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.main', borderRadius: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>🎂 Birthdays:</Typography>
          {birthdays.map(b => (
            <Chip key={b.student?._id} label={`${b.student?.firstName} (${b.isToday ? 'Today' : 'Tomorrow'})`}
              size="small" sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600 }} />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {user?.role === 'principal' ? (
          <TextField type="date" size="small" label="Date" value={date}
            onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }}
            inputProps={{ max: new Date().toISOString().split('T')[0] }} sx={{ width: 160 }} />
        ) : (
          <Chip label={format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        )}
        <Button size="small" variant="outlined" color="success" onClick={() => markAll('present')}>All Present</Button>
        <Button size="small" variant="outlined" color="error" onClick={() => markAll('absent')}>All Absent</Button>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip label={`${presentCount} Present`} size="small" color="success" />
          <Chip label={`${students.length - presentCount} Absent`} size="small" color="error" />
          <Chip label={`${markedCount}/${students.length} Marked`} size="small" color="info" />
        </Box>
      </Box>

      {existingAtt?.isSubmitted && (
        <Alert severity="info" sx={{ mb: 2 }}>Attendance submitted for {format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')}</Alert>
      )}
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {students.map((student, i) => {
            const status = records[student._id];
            const opt = STATUS_OPTIONS.find(s => s.key === status);
            const bday = birthdays.find(b => b.student?._id === student._id);
            return (
              <Paper key={student._id} elevation={0} sx={{
                p: 1.5, display: 'flex', alignItems: 'center', gap: 0.5,
                border: '1px solid', borderColor: opt ? opt.color + '44' : 'divider',
                bgcolor: opt ? opt.bg + (theme.palette.mode === 'dark' ? '22' : '') : 'background.paper',
                borderRadius: 2, transition: 'all 0.15s ease', '&:hover': { boxShadow: 2 },
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                {/* <Badge badgeContent={bday ? '🎂' : 0} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                  <Avatar src={student.photo} sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'primary.main', cursor: 'pointer' }}
                    onClick={() => setPopupStudent(student._id)}>
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </Avatar>
                </Badge> */}
                <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => setPopupStudent(student._id)}>
                  <Typography sx={{ fontSize: { xs: 10, sm: 14 } }} variant="body2" fontWeight={600}>{student.firstName} {student.lastName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  {STATUS_OPTIONS.map(s => (
                    <Tooltip key={s.key} title={s.label}>
                      <Box onClick={() => mark(student._id, s.key)} sx={{
                        width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        bgcolor: status === s.key ? s.color : 'transparent',
                        border: `2px solid ${status === s.key ? s.color : theme.palette.divider}`,
                        color: status === s.key ? '#fff' : s.color,
                        fontWeight: 800, fontSize: 11, transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: s.bg, borderColor: s.color, transform: 'scale(1.1)' },
                      }}>{s.short}</Box>
                    </Tooltip>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {students.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          {!existingAtt?.isSubmitted && (
            <Button variant="outlined" onClick={saveAttendance} disabled={saving}>Save Draft</Button>
          )}
          <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <HowToReg />}>
            {existingAtt?.isSubmitted ? 'Update Attendance' : 'Submit Attendance'}
          </Button>
        </Box>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Submit attendance for <strong>{format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')}</strong>?</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {STATUS_OPTIONS.map(opt => {
              const cnt = Object.values(records).filter(s => s === opt.key).length;
              if (!cnt) return null;
              return <Chip key={opt.key} label={`${opt.label}: ${cnt}`} size="small" sx={{ bgcolor: opt.bg, color: opt.color, fontWeight: 700 }} />;
            })}
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitAttendance}>Confirm & Submit</Button>
        </DialogActions>
      </Dialog>

      <StudentPopup studentId={popupStudent} open={Boolean(popupStudent)} onClose={() => setPopupStudent(null)} />
    </Box>
  );
}
