import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  LinearProgress,
  IconButton,
  Divider,
  useTheme,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Close, Circle, Edit, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { studentAPI, calendarAPI, principalAPI, classroomAPI } from '@/api/client';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';

const STATUS_CONFIG = {
  present: { color: '#43A047', label: 'P' },
  absent: { color: '#E53935', label: 'A' },
  'half-day': { color: '#FB8C00', label: 'H' },
  late: { color: '#1565C0', label: 'L' },
  leave: { color: '#8E24AA', label: 'Le' },
  holiday: { color: '#78909C', label: 'Ho' },
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function StudentPopup({ studentId, open, onClose, onEdit, onToggleStatus }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { selectedYear: topBarSelectedYear } = useOutletContext() || {};
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [selectedAY, setSelectedAY] = useState('');

  useEffect(() => {
    if (open && studentId) {
      setLoading(true);
      studentAPI
        .getFullData(studentId)
        .then((res) => setData(res.data.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, studentId]);

  useEffect(() => {
    if (open) {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      calendarAPI
        .getEvents({ start: start.toISOString(), end: end.toISOString() })
        .then((res) => setEvents(res.data.data || []))
        .catch(() => {});
    }
  }, [open, currentMonth]);

  useEffect(() => {
    if (data?.profile?.classroom?.academicStartDate && data?.profile?.classroom?.academicEndDate) {
      try {
        calendarAPI
          .getEvents({
            start: new Date(data.profile.classroom.academicStartDate).toISOString(),
            end: new Date(data.profile.classroom.academicEndDate).toISOString(),
          })
          .then((res) => setAcademicEvents(res.data.data || []))
          .catch(() => {});
      } catch (err) {}
    }
  }, [data]);

  const toggleMutation = useMutation({
    mutationFn: (profile) =>
      principalAPI.updateStudent(profile._id, {
        isActive: profile.isActive === false ? true : false,
      }),
    onSuccess: () => {
      qc.invalidateQueries(['student-full', studentId]);
      qc.invalidateQueries(['p-students']);
    },
  });

  const { data: classData } = useQuery({
    queryKey: ['classrooms', user?.role],
    queryFn: () =>
      ['principal', 'superadmin'].includes(user?.role)
        ? principalAPI.getClassrooms()
        : classroomAPI.getAll(),
    enabled: !!user?.role,
  });
  const classrooms = classData?.data?.data || [];

  const student = data?.profile;
  const att = data?.attendance;
  const results = data?.results || [];
  const fees = data?.fees;

  const schoolData = typeof user?.institution === 'object' ? user.institution : null;
  const uid = String(student?.userId?._id || student?.userId);

  const enrolledYears = classrooms
    .filter((c) => c.students?.some((s) => String(s._id || s) === uid))
    .map((c) => c.academicYear)
    .filter(Boolean);

  const uniqueYears = Array.from(
    new Set(enrolledYears.length > 0 ? enrolledYears : [student?.academicYear].filter(Boolean)),
  ).sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    if (!open) {
      setSelectedAY(''); // Reset on close
    } else if (data && uniqueYears.length > 0 && !selectedAY) {
      // Prioritize top bar selection if it's valid for the student, otherwise use the latest year.
      if (topBarSelectedYear && uniqueYears.includes(topBarSelectedYear)) {
        setSelectedAY(topBarSelectedYear);
      } else {
        setSelectedAY(uniqueYears[0] || '');
      }
    }
  }, [open, data, uniqueYears, selectedAY, student, topBarSelectedYear]);

  const getYearLabel = (year) => {
    let className = '';

    const enrolledClass = classrooms.find(
      (c) => c.academicYear === year && c.students?.some((s) => String(s._id || s) === uid),
    );

    if (enrolledClass) {
      className = enrolledClass.name || `Grade ${enrolledClass.grade} - ${enrolledClass.section}`;
      // } else if (student?.academicYear === year && student?.classroom) {
      //   className = student.classroom.name || `Grade ${student.classroom.grade} - ${student.classroom.section}`;
      // } else {
      //   const feeForYear = fees?.records?.find(f => f.academicYear === year);
      //   const clsId = feeForYear?.classroom?._id || feeForYear?.classroom;
      //   if (clsId) {
      //     const cls = classrooms.find(c => String(c._id) === String(clsId));
      //     if (cls) className = cls.name || `Grade ${cls.grade} - ${cls.section}`;
      //   }
    }
    return className ? `${year} (${className})` : year;
  };

  if (!open) return null;

  const selectedAYObj = schoolData?.academicYears?.find((ay) => ay.year === selectedAY);

  let filteredAttRecords = att?.records || [];
  if (selectedAYObj?.startDate && selectedAYObj?.endDate) {
    const start = new Date(selectedAYObj.startDate).setHours(0, 0, 0, 0);
    const end = new Date(selectedAYObj.endDate).setHours(23, 59, 59, 999);
    filteredAttRecords = filteredAttRecords.filter((r) => {
      const d = new Date(r.date).getTime();
      return d >= start && d <= end;
    });
  } else if (selectedAY) {
    const startYear = parseInt(selectedAY.split('-')[0]);
    if (!isNaN(startYear)) {
      const start = new Date(startYear, 3, 1).getTime();
      const end = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
      filteredAttRecords = filteredAttRecords.filter((r) => {
        const d = new Date(r.date).getTime();
        return d >= start && d <= end;
      });
    }
  }

  const filteredTotalDays = filteredAttRecords.filter((r) => r.status !== 'holiday').length;
  const filteredPresentDays = filteredAttRecords.filter((r) =>
    ['present', 'half-day', 'late'].includes(r.status),
  ).length;
  const filteredAttPercentage =
    filteredTotalDays > 0 ? Math.round((filteredPresentDays / filteredTotalDays) * 100) : 0;

  const filteredResults = results.filter((r) => !selectedAY || r.exam?.academicYear === selectedAY);
  const filteredFeesRecords =
    fees?.records?.filter((f) => !selectedAY || f.academicYear === selectedAY) || [];
  const filteredTotalExpected = filteredFeesRecords.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const filteredTotalPaid = filteredFeesRecords.reduce(
    (s, f) =>
      s +
      (f.installments?.filter((i) => i.isPaid).reduce((sum, i) => sum + (i.amount || 0), 0) || 0),
    0,
  );
  const filteredTotalDue = filteredTotalExpected - filteredTotalPaid;

  const getWorkingDays = () => {
    const start = selectedAYObj?.startDate || student?.classroom?.academicStartDate;
    const end = selectedAYObj?.endDate || student?.classroom?.academicEndDate;
    if (!start || !end) return null;
    try {
      let startDate = new Date(start);
      let endDate = new Date(end);
      const today = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
      if (endDate > today) endDate = today; // Cap to current date so it counts working days "so far"
      if (startDate > endDate) return null; // Avoid RangeError invalid interval

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.filter((d) => {
        const isSunday = d.getDay() === 0;
        const isHoliday = academicEvents.some((e) => {
          const s = new Date(e.startDate);
          s.setHours(0, 0, 0, 0);
          const en = e.endDate ? new Date(e.endDate) : new Date(s);
          en.setHours(23, 59, 59, 999);
          return d >= s && d <= en && ['holiday', 'weekend'].includes(e.type);
        });
        return !isSunday && !isHoliday;
      }).length;
    } catch (e) {
      return null;
    }
  };
  const totalWorkingDays = getWorkingDays();

  // Build monthly calendar view
  const buildMonthGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    const records = filteredAttRecords;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const rec = records.find((r) => isSameDay(new Date(r.date), date));
      const dayEvents = events.filter((e) => {
        const s = new Date(e.startDate);
        s.setHours(0, 0, 0, 0);
        const en = e.endDate ? new Date(e.endDate) : new Date(s);
        en.setHours(23, 59, 59, 999);
        return date >= s && date <= en;
      });
      const isHoliday = dayEvents.some((e) => ['holiday', 'weekend'].includes(e.type));
      grid.push({ day: d, status: rec?.status || null, date, events: dayEvents, isHoliday });
    }
    return grid;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: { xs: 'calc(100% - 32px)', sm: '90vh' },
          m: { xs: 2, sm: 4 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Student Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {['principal'].includes(user?.role) && data?.profile && onToggleStatus && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    color="success"
                    checked={data.profile.isActive !== false}
                    disabled={toggleMutation.isPending}
                    onChange={() => {
                      if (onToggleStatus) onToggleStatus(data.profile);
                      else if (window.confirm('Change student active status?'))
                        toggleMutation.mutate(data.profile);
                    }}
                  />
                }
                label={
                  <Typography variant="caption" fontWeight={700} sx={{ mr: 1 }}>
                    {data.profile.isActive !== false ? 'Active' : 'Inactive'}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            )}
            {['principal'].includes(user?.role) && onEdit && data?.profile && (
              <IconButton
                onClick={() => onEdit(data.profile)}
                size="small"
                color="primary"
                sx={{ mr: 1, bgcolor: 'primary.50' }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 2 },
                mb: 2,
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'background.default',
                borderRadius: 2,
                alignItems: { xs: 'center', sm: 'center' },
              }}
            >
              <Avatar
                src={student?.userId?.photo}
                sx={{
                  width: { xs: 56, sm: 64 },
                  height: { xs: 56, sm: 64 },
                  fontSize: { xs: 20, sm: 24 },
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                }}
              >
                {student?.userId?.firstName?.[0]}
                {student?.userId?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  {student?.userId?.firstName} {student?.userId?.lastName}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    mt: 0.5,
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                  }}
                >
                  <Chip label={`ID: ${student?.studentId}`} size="small" variant="outlined" />
                  <Chip label={`Roll No: ${student?.rollNumber}`} size="small" variant="outlined" />
                  <Chip label={student?.classroom?.name} size="small" color="primary" />
                </Box>
              </Box>
              <Box
                sx={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: { xs: 'row', sm: 'column' },
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 0 },
                  minWidth: { xs: '100%', sm: 'auto' },
                  borderTop: { xs: '1px solid', sm: 'none' },
                  borderColor: 'divider',
                  pt: { xs: 1.5, sm: 0 },
                  mt: { xs: 0.5, sm: 0 },
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  color={filteredAttPercentage >= 75 ? 'success.main' : 'error.main'}
                  sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' }, lineHeight: 1 }}
                >
                  {filteredAttPercentage || 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Attendance
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 1,
                gap: 1,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1.5, sm: 2 },
                  },
                }}
              >
                <Tab label="Profile" />
                <Tab label="Attendance" />
                <Tab label="Exams" />
                <Tab label="Fees" />
              </Tabs>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedAY || ''}
                  onChange={(e) => setSelectedAY(e.target.value)}
                  label="Academic Year"
                >
                  {uniqueYears.map((y) => (
                    <MenuItem key={y} value={y}>
                      {getYearLabel(y)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Profile Tab */}
            <TabPanel value={tab} index={0}>
              <Grid container spacing={2}>
                {[
                  ['Email', student?.userId?.email],
                  ['Phone', student?.userId?.phone],
                  ['Gender', student?.gender],
                  [
                    'DOB',
                    student?.dateOfBirth
                      ? format(new Date(student.dateOfBirth), 'dd MMM yyyy')
                      : '-',
                  ],
                  ['Blood Group', student?.bloodGroup],
                  [
                    'Admission Date',
                    student?.admissionDate
                      ? format(new Date(student.admissionDate), 'dd MMM yyyy')
                      : '-',
                  ],
                  ['Previous Institution', student?.previousInstitution || '-'],
                  ['Academic Year', student?.academicYear],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {value || '-'}
                    </Typography>
                  </Grid>
                ))}
                {student?.guardians?.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Guardians
                    </Typography>
                    {student.guardians.map((g, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mb: 1,
                          p: 1.5,
                          bgcolor: 'background.default',
                          borderRadius: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {g.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {g.relationship} · {g.phone}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            {/* Attendance Tab */}
            <TabPanel value={tab} index={1}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    mb: 1,
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Overall Attendance
                  </Typography>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography
                      variant="body2"
                      color={filteredAttPercentage >= 75 ? 'success.main' : 'error.main'}
                      fontWeight={700}
                    >
                      {filteredPresentDays}/{filteredTotalDays} marked days ({filteredAttPercentage}
                      %)
                    </Typography>
                    {totalWorkingDays !== null && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {totalWorkingDays} overall working days in selected year
                      </Typography>
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={filteredAttPercentage || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: filteredAttPercentage >= 75 ? 'success.main' : 'error.main',
                    },
                  }}
                />
              </Box>
              {/* Monthly calendar grid */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  mt: { xs: 2, sm: 1 },
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft fontSize="small" />
                </IconButton>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  {format(currentMonth, 'MMMM yyyy')} — Daily View
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight fontSize="small" />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: { xs: 0.5, sm: 1 },
                }}
              >
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <Typography
                    key={d}
                    variant="caption"
                    align="center"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  >
                    {d}
                  </Typography>
                ))}
                {/* offset */}
                {Array.from({
                  length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(),
                }).map((_, i) => (
                  <Box key={`e${i}`} />
                ))}
                {buildMonthGrid().map(({ day, status, isHoliday, events: dayEvents }) => {
                  const hasEvent = dayEvents.length > 0;
                  return (
                    <Box
                      key={day}
                      sx={{
                        aspectRatio: '1',
                        borderRadius: { xs: 1, sm: 1.5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        p: { xs: 0.25, sm: 0.5 },
                        bgcolor: status
                          ? STATUS_CONFIG[status]?.color + '22'
                          : isHoliday
                            ? '#78909C22'
                            : 'background.default',
                        border: `1px solid ${status ? STATUS_CONFIG[status]?.color + '44' : isHoliday ? '#78909C44' : hasEvent ? '#1565C044' : 'transparent'}`,
                        color: status
                          ? STATUS_CONFIG[status]?.color
                          : isHoliday
                            ? '#78909C'
                            : 'text.disabled',
                        cursor: hasEvent ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        sx={{ fontSize: { xs: 9, sm: 12 }, fontWeight: 700, lineHeight: 1 }}
                      >
                        {day}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: { xs: 6, sm: 8 },
                          fontWeight: 700,
                          color: '#1565C0',
                          mt: { xs: 0.2, sm: 0.5 },
                          width: '100%',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hasEvent ? dayEvents.map((e) => e.title).join(', ') : ''}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: v.color }} />
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {k}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#1565C0' }} />
                  <Typography variant="caption">Event</Typography>
                </Box>
              </Box>
            </TabPanel>

            {/* Exams Tab */}
            <TabPanel value={tab} index={2}>
              {filteredResults.length === 0 ? (
                <Typography color="text.secondary">No results available</Typography>
              ) : (
                filteredResults.map((r) => (
                  <Box
                    key={r._id}
                    sx={{
                      mb: 2,
                      p: { xs: 1.5, sm: 2 },
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        mb: 1,
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          fontWeight={700}
                          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                        >
                          {r.exam?.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.exam?.term} · {r.exam?.type}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          textAlign: { xs: 'left', sm: 'right' },
                          display: { xs: 'flex', sm: 'block' },
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={r.overallGrade}
                          size="small"
                          color={r.isPassed ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: { xs: 12, sm: 14 } }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Rank #{r.rank}
                        </Typography>
                      </Box>
                    </Box>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Subject</TableCell>
                            <TableCell align="center">Marks</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {r.subjectMarks?.map((s) => (
                            <TableRow key={s.subjectCode}>
                              <TableCell>{s.subjectName}</TableCell>
                              <TableCell align="center">
                                {s.marksObtained}/{s.maxMarks}
                              </TableCell>
                              {/* <TableCell align="center"><Chip label={s.grade || '-'} size="small" /></TableCell> */}
                              <TableCell align="center">
                                <Chip
                                  label={s.marksObtained / s.maxMarks >= 0.35 ? 'Pass' : 'Fail'}
                                  size="small"
                                  color={s.marksObtained / s.maxMarks >= 0.35 ? 'success' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>
                              <strong>Total</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>
                                {r.totalMarks}/{r.maxTotalMarks} ({r.percentage}%)
                              </strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>GPA: {r.gpa}</strong>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              )}
            </TabPanel>

            {/* Fees Tab */}
            <TabPanel value={tab} index={3}>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, sm: 2 },
                  mb: 2,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minWidth: { xs: '45%', sm: 'auto' },
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'success.main',
                    borderRadius: 2,
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    ₹{filteredTotalPaid.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption">Paid</Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: { xs: '45%', sm: 'auto' },
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'error.main',
                    borderRadius: 2,
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    ₹{filteredTotalDue.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption">Due</Typography>
                </Box>
              </Box>
              {filteredFeesRecords?.map((fee) => (
                <Box
                  key={fee._id}
                  sx={{
                    mb: 2,
                    p: { xs: 1.5, sm: 2 },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
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
                </Box>
              ))}
            </TabPanel>
          </>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No data available
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
