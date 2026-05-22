import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  People,
  Subject,
  Room,
  Schedule,
  DateRange,
  PersonAdd,
  Search,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { classroomAPI, principalAPI } from '@/api/client';
import AttendanceMarker from '@/components/common/AttendanceMarker';
import StudentPopup from '@/components/common/StudentPopup';

export default function PrincipalClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [popupStudent, setPopupStudent] = useState(null);

  const [manageStudentsOpen, setManageStudentsOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['classroom', id],
    queryFn: () => classroomAPI.getById(id),
  });
  const classroom = data?.data?.data;
  const students = classroom?.students || [];

  const { data: stdData } = useQuery({
    queryKey: ['p-students'],
    queryFn: () => principalAPI.getStudents(),
    enabled: manageStudentsOpen,
  });
  const allStudents = stdData?.data?.data || [];

  const { data: clsData } = useQuery({
    queryKey: ['p-classrooms'],
    queryFn: () => principalAPI.getClassrooms(),
    enabled: manageStudentsOpen,
  });
  const allClasses = clsData?.data?.data || [];

  const currentStudentIds = students.map((s) => s._id || s);

  const classFilterOptions = useMemo(() => {
    return allClasses
      .map((c) => {
        const ay = c.academicYear || 'Unknown Year';
        const cid = c._id;
        const cname = c.name || `Grade ${c.grade} - ${c.section}`;
        return { ay, cid, label: `${ay} (${cname})` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allClasses]);

  const filteredAvailableStudents = useMemo(() => {
    let filtered = allStudents;
    if (sourceFilter !== 'all') {
      const [fAy, fCid] = sourceFilter.split('||');
      filtered = filtered.filter((s) => {
        const sAy = s.classroom?.academicYear || s.academicYear || 'Unknown Year';
        return sAy === fAy && String(s.classroom?._id || s.classroom) === String(fCid);
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.toLowerCase().includes(q) ||
          String(s.studentId || '')
            .toLowerCase()
            .includes(q),
      );
    }
    return filtered;
  }, [allStudents, sourceFilter, searchQuery]);

  const visibleIds = useMemo(
    () => filteredAvailableStudents.map((s) => s.userId?._id || s.userId).filter(Boolean),
    [filteredAvailableStudents],
  );
  const selectedVisibleCount = visibleIds.filter((id) => selectedStudentIds.includes(id)).length;
  const isAllVisibleSelected = selectedVisibleCount === visibleIds.length && visibleIds.length > 0;
  const isIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  const handleToggleStudent = (userId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId],
    );
  };

  const handleToggleAll = () => {
    if (isAllVisibleSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const addStudentsMutation = useMutation({
    mutationFn: async () => {
      const addedIds = selectedStudentIds.filter((id) => !currentStudentIds.includes(id));
      const removedIds = currentStudentIds.filter((id) => !selectedStudentIds.includes(id));

      if (addedIds.length === 0 && removedIds.length === 0) return;

      const promises = addedIds.map(async (userId) => {
        const studentProfile = allStudents.find((s) => (s.userId?._id || s.userId) === userId);
        if (studentProfile) {
          // const oldClassroomId = studentProfile.classroom?._id || studentProfile.classroom;
          // if (oldClassroomId && String(oldClassroomId) !== String(id)) {
          //   await api.post(`/classrooms/${oldClassroomId}/students`, { studentIds: [userId], action: 'remove' });
          // }
          return principalAPI.updateStudent(studentProfile._id, {
            classroom: id,
            academicYear: classroom.academicYear,
          });
        }
      });

      removedIds.forEach((userId) => {
        const studentProfile = allStudents.find((s) => (s.userId?._id || s.userId) === userId);
        if (studentProfile)
          promises.push(principalAPI.updateStudent(studentProfile._id, { classroom: null }));
      });

      await Promise.all(promises);

      if (addedIds.length > 0)
        await api.post(`/classrooms/${id}/students`, { studentIds: addedIds, action: 'add' });
      if (removedIds.length > 0)
        await api.post(`/classrooms/${id}/students`, { studentIds: removedIds, action: 'remove' });
    },
    onSuccess: () => {
      qc.invalidateQueries(['classroom', id]);
      qc.invalidateQueries(['p-classrooms']);
      qc.invalidateQueries(['p-students']);
      setManageStudentsOpen(false);
      setSelectedStudentIds([]);
      setSearchQuery('');
      setSourceFilter('all');
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!classroom) return <Typography>Classroom not found</Typography>;

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <IconButton onClick={() => navigate('/principal/classrooms')} sx={{ mt: -0.5 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {classroom.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {classroom.roomNumber && (
                <Chip
                  icon={<Room sx={{ fontSize: 14 }} />}
                  label={`Room ${classroom.roomNumber}`}
                  size="small"
                />
              )}
              <Chip
                icon={<People sx={{ fontSize: 14 }} />}
                label={`${students.length} Students`}
                size="small"
                color="primary"
              />
              <Chip
                icon={<Subject sx={{ fontSize: 14 }} />}
                label={`${classroom.subjects?.length || 0} Subjects`}
                size="small"
              />
              {classroom.classTeacher && (
                <Chip
                  avatar={
                    <Avatar sx={{ width: 18, height: 18, fontSize: 10 }}>
                      {classroom.classTeacher.firstName?.[0]}
                    </Avatar>
                  }
                  label={`${classroom.classTeacher.firstName} ${classroom.classTeacher.lastName}`}
                  size="small"
                  color="success"
                />
              )}
              {(classroom.startTime || classroom.endTime) && (
                <Chip
                  icon={<Schedule sx={{ fontSize: 14 }} />}
                  label={`${classroom.startTime || '—'} to ${classroom.endTime || '—'}`}
                  size="small"
                  color="info"
                />
              )}
              {(classroom.academicStartDate || classroom.academicEndDate) && (
                <Chip
                  icon={<DateRange sx={{ fontSize: 14 }} />}
                  label={`${classroom.academicStartDate ? new Date(classroom.academicStartDate).toLocaleDateString() : '—'} - ${classroom.academicEndDate ? new Date(classroom.academicEndDate).toLocaleDateString() : '—'}`}
                  size="small"
                  color="secondary"
                />
              )}
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              setSelectedStudentIds(currentStudentIds);
              setManageStudentsOpen(true);
            }}
          >
            Manage Students
          </Button>
        </Box>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Attendance
          </Typography>
          <AttendanceMarker classroomId={id} students={students} />
        </CardContent>
      </Card>

      <StudentPopup
        studentId={popupStudent}
        open={Boolean(popupStudent)}
        onClose={() => setPopupStudent(null)}
      />

      <Dialog
        open={manageStudentsOpen}
        onClose={() => {
          setManageStudentsOpen(false);
          setSearchQuery('');
          setSourceFilter('all');
          setSelectedStudentIds([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Manage Students ({filteredAvailableStudents.length})
            <Button size="small" onClick={handleToggleAll}>
              {isAllVisibleSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Filter by Class</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                label="Filter by Class"
              >
                <MenuItem value="all">All Students</MenuItem>
                {classFilterOptions.map((opt) => (
                  <MenuItem key={`${opt.ay}||${opt.cid}`} value={`${opt.ay}||${opt.cid}`}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TableContainer
            sx={{ maxHeight: 450, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllVisibleSelected}
                      indeterminate={isIndeterminate}
                      onChange={handleToggleAll}
                    />
                  </TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>ID / Roll No</TableCell>
                  <TableCell>Current Class</TableCell>
                  <TableCell>Academic Year</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAvailableStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No students available.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAvailableStudents.map((s) => {
                    const uid = s.userId?._id || s.userId;
                    const isChecked = selectedStudentIds.includes(uid);
                    return (
                      <TableRow
                        key={s._id}
                        hover
                        onClick={() => handleToggleStudent(uid)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleStudent(uid);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={s.userId?.photo}
                              sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}
                            >
                              {s.userId?.firstName?.[0]}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {s.userId?.firstName} {s.userId?.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            ID: {s.studentId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Roll: {s.rollNumber || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {s.classroom
                            ? s.classroom.name ||
                              `Grade ${s.classroom.grade} - ${s.classroom.section}`
                            : '—'}
                        </TableCell>
                        <TableCell>{s.classroom?.academicYear || s.academicYear || '—'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setManageStudentsOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => addStudentsMutation.mutate()}
            disabled={addStudentsMutation.isPending}
          >
            {addStudentsMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `Save Changes`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
