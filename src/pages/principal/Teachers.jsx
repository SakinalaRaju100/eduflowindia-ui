import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from '@mui/material';
import {
  PersonAdd,
  Close,
  Edit,
  CheckCircle,
  HowToReg,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { principalAPI, salaryAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
  addMonths,
  isToday,
} from 'date-fns';

const EMPTY_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  aadhaarNumber: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  designation: 'Teacher',
  employmentType: 'full-time',
  department: '',
  gender: 'male',
  subjectsExpertise: '',
  joiningDate: '',
  salaryDetails: { baseSalary: '', allowances: '', deductions: '', annualPackage: '' },
};

function TeacherSalariesTab({ teacherId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['salaries', teacherId],
    queryFn: () => salaryAPI.getAll({ teacherId }),
  });
  const salaries = data?.data?.data || [];
  if (isLoading)
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (salaries.length === 0)
    return (
      <Typography color="text.secondary" sx={{ py: 3 }}>
        No salary records found for this teacher.
      </Typography>
    );
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Month/Year</TableCell>
            <TableCell>Base + Allowances</TableCell>
            <TableCell>Deductions</TableCell>
            <TableCell>Net Salary</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {salaries.map((s) => (
            <TableRow key={s._id}>
              <TableCell fontWeight={600}>
                {s.month} {s.year}
              </TableCell>
              <TableCell>₹{(s.baseSalary + (s.allowances || 0)).toLocaleString()}</TableCell>
              <TableCell>₹{(s.deductions || 0).toLocaleString()}</TableCell>
              <TableCell fontWeight={700} color="primary.main">
                ₹{s.netSalary.toLocaleString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={s.status}
                  color={s.status === 'paid' ? 'success' : 'warning'}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TeacherAttendanceTab({ teacherId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const firstDayOffset = start.getDay();

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-attendance', teacherId, format(currentMonth, 'yyyy-MM')],
    queryFn: () => {
      const params = { month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear() };
      if (principalAPI.getTeacherAttendance)
        return principalAPI.getTeacherAttendance(teacherId, params);
      return api.get(`/principal/teachers/${teacherId}/attendance`, { params });
    },
  });

  const records = data?.data?.data?.records || [];
  const getDayStatus = (day) => records.find((r) => isSameDay(new Date(r.date), day))?.status;

  const STATUS_COLORS = {
    present: '#43A047',
    absent: '#E53935',
    'half-day': '#FB8C00',
    late: '#1565C0',
    leave: '#8E24AA',
    holiday: '#78909C',
  };

  if (isLoading)
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700}>
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
          <ChevronRight />
        </IconButton>
      </Box>
      <Grid container sx={{ mb: 1 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Grid item xs={12 / 7} key={d}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              align="center"
              display="block"
            >
              {d}
            </Typography>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={0.5}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <Grid item xs={12 / 7} key={`e${i}`} sx={{ minHeight: 45 }} />
        ))}
        {days.map((day) => {
          const status = getDayStatus(day);
          const statusColor = status ? STATUS_COLORS[status] : null;
          const today = isToday(day);
          return (
            <Grid item xs={12 / 7} key={day.toISOString()} sx={{ minHeight: 45 }}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 45,
                  borderRadius: 1,
                  p: 0.5,
                  bgcolor: today
                    ? 'primary.main'
                    : statusColor
                      ? statusColor + '22'
                      : day.getDay() === 0
                        ? 'action.hover'
                        : 'transparent',
                  border: `1px solid ${statusColor ? statusColor + '66' : 'transparent'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={today ? 800 : 600}
                  sx={{ color: today ? '#fff' : 'text.primary' }}
                >
                  {format(day, 'd')}
                </Typography>
                {status && (
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: statusColor,
                      textTransform: 'capitalize',
                    }}
                  >
                    {status === 'half-day' ? 'H' : status.charAt(0).toUpperCase()}
                  </Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3, justifyContent: 'center' }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: v }} />
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
              {k}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function TeacherAttendanceMarker({ open, onClose, teachers }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: existingData } = useQuery({
    queryKey: ['teachers-attendance-date', date],
    queryFn: () => api.get('/principal/teachers/attendance/bulk', { params: { date } }),
  });

  useEffect(() => {
    if (existingData?.data?.data?.records) {
      const map = {};
      existingData.data.data.records.forEach((r) => {
        map[r.teacherId] = r.status;
      });
      setRecords(map);
    } else setRecords({});
  }, [existingData, date]);

  const STATUS_OPTIONS = [
    { key: 'present', label: 'Present', short: 'P', color: '#43A047', bg: '#E8F5E9' },
    { key: 'absent', label: 'Absent', short: 'A', color: '#E53935', bg: '#FFEBEE' },
    { key: 'half-day', label: 'Half Day', short: 'H', color: '#FB8C00', bg: '#FFF3E0' },
    { key: 'late', label: 'Late', short: 'L', color: '#1565C0', bg: '#E3F2FD' },
    { key: 'leave', label: 'Leave', short: 'Le', color: '#8E24AA', bg: '#F3E5F5' },
  ];

  const mark = (sid, status) =>
    setRecords((p) => ({ ...p, [sid]: p[sid] === status ? null : status }));
  const markAll = (status) => {
    const map = {};
    teachers.forEach((t) => {
      map[t._id] = status;
    });
    setRecords(map);
  };

  const submitAttendance = async () => {
    setSaving(true);
    try {
      const payload = {
        date: new Date(date).toISOString(),
        records: teachers.map((t) => ({ teacherId: t._id, status: records[t._id] || 'absent' })),
      };
      await api.post('/principal/teachers/attendance/bulk', payload);
      qc.invalidateQueries(['p-teachers']);
      qc.invalidateQueries(['teacher-attendance']);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(records).filter((s) =>
    ['present', 'late', 'half-day'].includes(s),
  ).length;
  const markedCount = Object.values(records).filter(Boolean).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>Teachers Attendance</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            type="date"
            size="small"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: new Date().toISOString().split('T')[0] }}
            sx={{ width: 160 }}
          />
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => markAll('present')}
          >
            All Present
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => markAll('absent')}>
            All Absent
          </Button>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip label={`${presentCount} Present`} size="small" color="success" />
            <Chip label={`${teachers.length - presentCount} Absent`} size="small" color="error" />
            <Chip label={`${markedCount}/${teachers.length} Marked`} size="small" color="info" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {teachers.map((teacher, i) => {
            const status = records[teacher._id];
            const opt = STATUS_OPTIONS.find((s) => s.key === status);
            return (
              <Box
                key={teacher._id}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: '1px solid',
                  borderColor: opt ? opt.color + '44' : 'divider',
                  bgcolor: opt ? opt.bg : 'background.paper',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Avatar
                  src={teacher.userId?.photo}
                  sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'success.main' }}
                >
                  {teacher.userId?.firstName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {teacher.userId?.firstName} {teacher.userId?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {teacher.teacherId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {STATUS_OPTIONS.map((s) => (
                    <Tooltip key={s.key} title={s.label}>
                      <Box
                        onClick={() => mark(teacher._id, s.key)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          bgcolor: status === s.key ? s.color : 'transparent',
                          border: `2px solid ${status === s.key ? s.color : '#e0e0e0'}`,
                          color: status === s.key ? '#fff' : s.color,
                          fontWeight: 800,
                          fontSize: 11,
                          transition: 'all 0.1s',
                          '&:hover': { transform: 'scale(1.05)' },
                        }}
                      >
                        {s.short}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submitAttendance} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Submit Attendance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PrincipalTeachers() {
  const qc = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [profileTab, setProfileTab] = useState(0);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [bulkAttendanceOpen, setBulkAttendanceOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { data, isLoading } = useQuery({
    queryKey: ['p-teachers'],
    queryFn: () => principalAPI.getTeachers(),
  });
  const teachers = data?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (d) => {
      const payload = {
        ...d,
        subjectsExpertise:
          typeof d.subjectsExpertise === 'string'
            ? d.subjectsExpertise
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : d.subjectsExpertise,
        salaryDetails: {
          baseSalary: Number(d.salaryDetails?.baseSalary || 0),
          allowances: Number(d.salaryDetails?.allowances || 0),
          deductions: Number(d.salaryDetails?.deductions || 0),
          annualPackage: Number(d.salaryDetails?.annualPackage || 0),
        },
      };
      return editId
        ? principalAPI.updateTeacher(editId, payload)
        : principalAPI.createTeacher(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(['p-teachers']);
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (t) =>
      principalAPI.updateTeacher(t._id, { isActive: t.isActive === false ? true : false }),
    onSuccess: () => {
      qc.invalidateQueries(['p-teachers']);
      setSelectedTeacher(null);
    },
  });

  const handleOpenEdit = (t) => {
    const u = t.userId || {};
    setEditId(t._id);
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      gender: t.gender || 'male',
      aadhaarNumber: t.aadhaarNumber || '',
      bankAccountNumber: t.bankAccountNumber || '',
      bankIfscCode: t.bankIfscCode || '',
      designation: t.designation || '',
      department: t.department || '',
      employmentType: t.employmentType || 'full-time',
      joiningDate: t.joiningDate ? new Date(t.joiningDate).toISOString().split('T')[0] : '',
      subjectsExpertise: t.subjectsExpertise ? t.subjectsExpertise.join(', ') : '',
      salaryDetails: {
        baseSalary: t.salaryDetails?.baseSalary || '',
        allowances: t.salaryDetails?.allowances || '',
        deductions: t.salaryDetails?.deductions || '',
        annualPackage: t.salaryDetails?.annualPackage || '',
      },
    });
    setSelectedTeacher(null);
    setOpen(true);
  };

  const cols = [
    { key: 'teacherId', label: 'ID', minWidth: 100 },
    {
      key: 'userId.firstName',
      label: 'Name',
      minWidth: 180,
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={r.userId?.photo}
            sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'success.main' }}
          >
            {r.userId?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {r.userId?.firstName} {r.userId?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.userId?.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'designation', label: 'Designation' },
    {
      key: 'employmentType',
      label: 'Type',
      render: (r) => <Chip label={r.employmentType} size="small" variant="outlined" />,
    },
    {
      key: 'subjectsExpertise',
      label: 'Subjects',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(r.subjectsExpertise || []).slice(0, 2).map((s) => (
            <Chip key={s} label={s} size="small" />
          ))}
          {r.subjectsExpertise?.length > 2 && (
            <Chip label={`+${r.subjectsExpertise.length - 2}`} size="small" />
          )}
        </Box>
      ),
    },
    {
      key: 'assignedClasses',
      label: 'Classes',
      render: (r) => (
        <Chip label={`${r.assignedClasses?.length || 0} classes`} size="small" color="primary" />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Attendance">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTeacher(r);
                setProfileTab(1);
              }}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Teachers ({teachers.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HowToReg />}
            onClick={() => setBulkAttendanceOpen(true)}
          >
            Mark Attendance
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              setEditId(null);
              setForm(EMPTY_FORM);
              setOpen(true);
            }}
          >
            Add Teacher
          </Button>
        </Box>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <DataTable
            columns={cols}
            rows={teachers}
            loading={isLoading}
            searchKeys={['userId.firstName', 'userId.lastName', 'teacherId', 'designation']}
            searchPlaceholder="Search teachers..."
            onRowClick={(row) => {
              setSelectedTeacher(row);
              setProfileTab(0);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editId ? 'Edit Teacher Details' : 'Add New Teacher'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              ['firstName', 'First Name', 6],
              ['lastName', 'Last Name', 6],
              ['email', 'Email', 6],
              ['phone', 'Mobile Number', 6],
              ['aadhaarNumber', 'Aadhaar Number', 6],
              ['designation', 'Designation', 6],
              ['department', 'Department', 6],
              ['bankAccountNumber', 'Bank Account Number', 6],
              ['bankIfscCode', 'Bank IFSC Code', 6],
            ].map(([k, l, xs]) => (
              <Grid item xs={12} sm={xs} key={k}>
                <TextField
                  fullWidth
                  size="small"
                  label={l}
                  value={form[k] || ''}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  disabled={Boolean(editId) && k === 'email'}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={form.gender || 'male'}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  label="Gender"
                >
                  {['male', 'female', 'other'].map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={form.employmentType}
                  onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
                  label="Employment Type"
                >
                  {['full-time', 'part-time', 'contract'].map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t.replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Joining Date"
                InputLabelProps={{ shrink: true }}
                value={form.joiningDate || ''}
                onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Subjects (comma separated)"
                placeholder="Math, Science"
                value={form.subjectsExpertise || ''}
                onChange={(e) => setForm((p) => ({ ...p, subjectsExpertise: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1, mb: -1 }}>
                Salary Details
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Annual Pkg (₹)"
                value={form.salaryDetails?.annualPackage || ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    salaryDetails: { ...p.salaryDetails, annualPackage: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Base Salary (₹)"
                value={form.salaryDetails?.baseSalary || ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    salaryDetails: { ...p.salaryDetails, baseSalary: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Allowances (₹)"
                value={form.salaryDetails?.allowances || ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    salaryDetails: { ...p.salaryDetails, allowances: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Deductions (₹)"
                value={form.salaryDetails?.deductions || ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    salaryDetails: { ...p.salaryDetails, deductions: e.target.value },
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : editId ? (
              'Update Teacher'
            ) : (
              'Add Teacher'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Profile Details Popup */}
      <Dialog
        open={Boolean(selectedTeacher)}
        onClose={() => setSelectedTeacher(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedTeacher &&
          (() => {
            const u = selectedTeacher.userId || {};
            return (
              <>
                <DialogTitle
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Teacher Profile
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          color="success"
                          checked={selectedTeacher.isActive !== false}
                          onChange={() => {
                            if (window.confirm('Change teacher active status?'))
                              toggleMutation.mutate(selectedTeacher);
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" fontWeight={700} sx={{ mr: 1 }}>
                          {selectedTeacher.isActive !== false ? 'Active' : 'Inactive'}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                    <IconButton
                      onClick={() => handleOpenEdit(selectedTeacher)}
                      size="small"
                      color="primary"
                      sx={{ mr: 1, bgcolor: 'primary.50' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => setSelectedTeacher(null)} size="small">
                      <Close />
                    </IconButton>
                  </Box>
                </DialogTitle>
                <DialogContent dividers>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={u.photo}
                        sx={{
                          width: 100,
                          height: 100,
                          mx: 'auto',
                          mb: 2,
                          fontSize: 40,
                          bgcolor: 'success.main',
                        }}
                      >
                        {u.firstName?.[0]}
                      </Avatar>
                      <Typography variant="h6" fontWeight={700}>
                        {u.firstName} {u.lastName}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {u.email}
                      </Typography>
                      <Chip
                        label={selectedTeacher.designation || 'Teacher'}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Tabs
                        value={profileTab}
                        onChange={(e, v) => setProfileTab(v)}
                        sx={{
                          mb: 2,
                          minHeight: 36,
                          '& .MuiTab-root': { minHeight: 36, fontSize: '0.85rem' },
                        }}
                      >
                        <Tab label="Profile Info" />
                        <Tab label="Attendance Calendar" />
                        <Tab label="Salary Records" />
                      </Tabs>

                      {profileTab === 0 && (
                        <>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="primary"
                            gutterBottom
                          >
                            Personal Information
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Mobile Number
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {u.phone || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Gender
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                textTransform="capitalize"
                              >
                                {selectedTeacher.gender || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Aadhaar Number
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.aadhaarNumber || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Teacher ID
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.teacherId || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Bank Account No
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.bankAccountNumber || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Bank IFSC Code
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.bankIfscCode || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Joining Date
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.joiningDate
                                  ? new Date(selectedTeacher.joiningDate).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="primary"
                            gutterBottom
                          >
                            Academic Details
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Employment Type
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                textTransform="capitalize"
                              >
                                {selectedTeacher.employmentType || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Assigned Classes
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedTeacher.assignedClasses?.length || 0}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                gutterBottom
                              >
                                Subjects Expertise
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {selectedTeacher.subjectsExpertise?.map((s) => (
                                  <Chip key={s} label={s} size="small" />
                                ))}
                                {(!selectedTeacher.subjectsExpertise ||
                                  selectedTeacher.subjectsExpertise.length === 0) && (
                                  <Typography variant="body2" color="text.secondary">
                                    None specified
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                            {selectedTeacher.qualifications?.length > 0 && (
                              <Grid item xs={12}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  gutterBottom
                                >
                                  Qualifications
                                </Typography>
                                {selectedTeacher.qualifications.map((q, i) => (
                                  <Typography key={i} variant="body2" fontWeight={600}>
                                    • {q.degree} from {q.institution} ({q.year})
                                  </Typography>
                                ))}
                              </Grid>
                            )}
                          </Grid>

                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="primary"
                            sx={{ mt: 3 }}
                            gutterBottom
                          >
                            Salary Details
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                Annual Package
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ₹
                                {Number(
                                  selectedTeacher.salaryDetails?.annualPackage || 0,
                                ).toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                Base Salary
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ₹
                                {Number(
                                  selectedTeacher.salaryDetails?.baseSalary || 0,
                                ).toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                Allowances
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ₹
                                {Number(
                                  selectedTeacher.salaryDetails?.allowances || 0,
                                ).toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                Deductions
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ₹
                                {Number(
                                  selectedTeacher.salaryDetails?.deductions || 0,
                                ).toLocaleString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </>
                      )}
                      {profileTab === 1 && <TeacherAttendanceTab teacherId={selectedTeacher._id} />}
                      {profileTab === 2 && <TeacherSalariesTab teacherId={u._id} />}
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setSelectedTeacher(null)}>Close</Button>
                </DialogActions>
              </>
            );
          })()}
      </Dialog>

      {/* Bulk Attendance Marker */}
      <TeacherAttendanceMarker
        open={bulkAttendanceOpen}
        onClose={() => setBulkAttendanceOpen(false)}
        teachers={teachers}
      />
    </Box>
  );
}
