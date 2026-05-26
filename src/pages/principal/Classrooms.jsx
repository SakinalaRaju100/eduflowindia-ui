import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Delete, Edit, FileCopy } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { principalAPI } from '@/api/client';
import ClassroomCard from '@/components/common/ClassroomCard';
import { useAuth } from '@/contexts/AuthContext';
import moment from 'moment';

const EMPTY = {
  name: '',
  academicYear: '',
  grade: '',
  section: 'A',
  roomNumber: '',
  capacity: 40,
  description: '',
  classTeacher: '',
  defaultFees: 0,
  startTime: '09:00',
  endTime: '16:00',
  academicStartDate: '',
  academicEndDate: '',
  subjects: [
    { name: 'Mathematics', code: 'MATH', maxMarks: 100, passingMarks: 35 },
    { name: 'English', code: 'ENG', maxMarks: 100, passingMarks: 35 },
    { name: 'Science', code: 'SCI', maxMarks: 100, passingMarks: 35 },
    { name: 'Social Studies', code: 'SS', maxMarks: 100, passingMarks: 35 },
  ],
};

export default function PrincipalClassrooms() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const [editId, setEditId] = useState(null);
  // const [cloneOpen, setCloneOpen] = useState(false);
  // const [cloneSourceYear, setCloneSourceYear] = useState('');
  // const [cloneSourceClassId, setCloneSourceClassId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['p-classrooms'],
    queryFn: () => principalAPI.getClassrooms(),
  });
  const classrooms = data?.data?.data || [];
  const { data: teachersData } = useQuery({
    queryKey: ['p-teachers'],
    queryFn: () => principalAPI.getTeachers(),
  });
  const teachers = teachersData?.data?.data || [];
  console.log('selectedAcademicYearObject :>> ', selectedAcademicYearObject);

  const academicYears = user?.institution?.academicYears || [
    { year: '2022-2023', startDate: '2022-04-01', endDate: '2023-03-31', isCurrent: false },
    { year: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: true },
  ];

  const filteredClassrooms = classrooms.filter((c) => {
    let matchDates = false;
    if (
      selectedAcademicYearObject?.startDate &&
      selectedAcademicYearObject?.endDate &&
      c.academicStartDate &&
      c.academicEndDate
    ) {
      try {
        const cStart = moment(c.academicStartDate);
        const cEnd = moment(c.academicEndDate);
        const sStart = moment(selectedAcademicYearObject.startDate);
        const sEnd = moment(selectedAcademicYearObject.endDate);
        matchDates = cStart.isSameOrAfter(sStart, 'day') && cEnd.isSameOrBefore(sEnd, 'day');
      } catch (e) {
        /* ignore invalid dates */
      }
    }
    return matchDates;
  });

  // const uniqueYears = Array.from(new Set(classrooms.map(c => c.academicYear).filter(Boolean)));
  // const cloneableClasses = classrooms.filter(c => c.academicYear === cloneSourceYear);

  // const handleCloneSubmit = () => {
  //   const sourceClass = classrooms.find(c => c._id === cloneSourceClassId);
  //   if (!sourceClass) return;

  //   const payload = {
  //     grade: sourceClass.grade || '',
  //     section: sourceClass.section || '',
  //     roomNumber: sourceClass.roomNumber || '',
  //     capacity: sourceClass.capacity || 40,
  //     description: sourceClass.description || '',
  //     defaultFees: sourceClass.defaultFees || 0,
  //     classTeacher: sourceClass.classTeacher?._id || sourceClass.classTeacher || '',
  //     startTime: sourceClass.startTime || '09:00',
  //     endTime: sourceClass.endTime || '16:00',
  //     academicStartDate: selectedAcademicYearObject?.startDate ? new Date(selectedAcademicYearObject.startDate).toISOString().split('T')[0] : '',
  //     academicEndDate: selectedAcademicYearObject?.endDate ? new Date(selectedAcademicYearObject.endDate).toISOString().split('T')[0] : '',
  //     subjects: sourceClass.subjects?.length > 0 ? sourceClass.subjects.map(s => ({
  //       name: s.name, code: s.code, maxMarks: s.maxMarks, passingMarks: s.passingMarks
  //     })) : EMPTY.subjects,
  //     academicYear: selectedYear
  //   };

  //   // mutation.mutate(payload, {
  //   //   onSuccess: () => { setCloneOpen(false); setCloneSourceYear(''); setCloneSourceClassId(''); }
  //   // });
  // };

  const mutation = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, academicYear: d.academicYear || selectedYear };
      return editId
        ? principalAPI.updateClassroom(editId, payload)
        : principalAPI.createClassroom(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(['p-classrooms']);
      setOpen(false);
      setForm(EMPTY);
      setEditId(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });

  const addSubject = () =>
    setForm((p) => ({
      ...p,
      subjects: [...p.subjects, { name: '', code: '', maxMarks: 100, passingMarks: 35 }],
    }));
  const removeSubject = (i) =>
    setForm((p) => ({ ...p, subjects: p.subjects.filter((_, ii) => ii !== i) }));
  const setSubject = (i, k, v) =>
    setForm((p) => {
      const s = [...p.subjects];
      s[i] = { ...s[i], [k]: v };
      return { ...p, subjects: s };
    });

  const handleOpenEdit = (e, c) => {
    e.stopPropagation();
    setEditId(c._id);
    setForm({
      name: c.name || '',
      academicYear: c.academicYear || '',
      grade: c.grade || '',
      section: c.section || '',
      roomNumber: c.roomNumber || '',
      capacity: c.capacity || 40,
      description: c.description || '',
      defaultFees: c.defaultFees || 0,
      classTeacher: c.classTeacher?._id || c.classTeacher || '',
      startTime: c.startTime || '09:00',
      endTime: c.endTime || '16:00',
      academicStartDate: c.academicStartDate
        ? new Date(c.academicStartDate).toISOString().split('T')[0]
        : '',
      academicEndDate: c.academicEndDate
        ? new Date(c.academicEndDate).toISOString().split('T')[0]
        : '',
      subjects: c.subjects?.length > 0 ? c.subjects : EMPTY.subjects,
    });
    setOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Classrooms
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* <Button variant="outlined" startIcon={<FileCopy/>} onClick={() => { setEditId(null); setCloneOpen(true); setCloneSourceYear(''); setCloneSourceClassId(''); }}>Clone Class</Button> */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditId(null);
              setForm({ ...EMPTY, academicYear: selectedYear || '' });
              setOpen(true);
            }}
          >
            New Classroom
          </Button>
        </Box>
      </Box>
      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={2.5}>
          {filteredClassrooms.map((c) => (
            // {classrooms.map(c => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <Box sx={{ position: 'relative' }}>
                <ClassroomCard
                  classroom={c}
                  onClick={() => navigate(`/principal/classrooms/${c._id}`)}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenEdit(e, c)}
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          ))}
          {filteredClassrooms.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No classrooms found for the selected academic year.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editId ? 'Edit Classroom' : 'Create New Classroom'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Grade (e.g. 10)"
                value={form.grade}
                onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Section (e.g. A)"
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                fullWidth
                size="small"
                label="Classroom Name (e.g. Grade 10A)"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Room Number"
                value={form.roomNumber}
                onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Capacity"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: +e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Class Teacher</InputLabel>
                <Select
                  value={form.classTeacher}
                  onChange={(e) => setForm((p) => ({ ...p, classTeacher: e.target.value }))}
                  label="Class Teacher"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {teachers.map(
                    (t) =>
                      t.userId && (
                        <MenuItem key={t.userId._id} value={t.userId._id}>
                          {t.userId.firstName} {t.userId.lastName}
                        </MenuItem>
                      ),
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Default Annual Fees (₹)"
                value={form.defaultFees}
                onChange={(e) => setForm((p) => ({ ...p, defaultFees: +e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="time"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="time"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={form.academicYear || ''}
                  onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                  label="Academic Year"
                >
                  {academicYears.map((ay) => (
                    <MenuItem key={ay.year} value={ay.year}>
                      {ay.year} {ay.isCurrent ? '(Current)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Academic Start Date"
                InputLabelProps={{ shrink: true }}
                value={form.academicStartDate}
                onChange={(e) => setForm((p) => ({ ...p, academicStartDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Academic End Date"
                InputLabelProps={{ shrink: true }}
                value={form.academicEndDate}
                onChange={(e) => setForm((p) => ({ ...p, academicEndDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  mt: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Subjects ({form.subjects.length})
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={addSubject}>
                  Add Subject
                </Button>
              </Box>
              {form.subjects.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" fontWeight={700}>
                      Subject {i + 1}
                    </Typography>
                    <IconButton size="small" onClick={() => removeSubject(i)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Subject Name"
                        value={s.name}
                        onChange={(e) => setSubject(i, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Code"
                        value={s.code}
                        onChange={(e) => setSubject(i, 'code', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2.5}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max Marks"
                        value={s.maxMarks}
                        onChange={(e) => setSubject(i, 'maxMarks', +e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2.5}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Pass Marks"
                        value={s.passingMarks}
                        onChange={(e) => setSubject(i, 'passingMarks', +e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Grid>
          </Grid>
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
                'Update Classroom'
              ) : (
                'Create Classroom'
              )}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* <Dialog open={cloneOpen} onClose={()=>setCloneOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Clone Classroom</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            This will copy the classroom details, subjects, and settings from a previous academic year into the currently selected year (<strong>{selectedYear || 'Current'}</strong>).
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Source Academic Year</InputLabel>
                <Select value={cloneSourceYear} onChange={e => { setCloneSourceYear(e.target.value); setCloneSourceClassId(''); }} label="Source Academic Year">
                  {academicYears.map(ay => <MenuItem key={ay.year} value={ay.year}>{ay.year} {ay.isCurrent ? '(Current)' : ''}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" disabled={!cloneSourceYear}>
                <InputLabel>Source Classroom</InputLabel>
                <Select value={cloneSourceClassId} onChange={e => setCloneSourceClassId(e.target.value)} label="Source Classroom">
                  {cloneableClasses.map(c => <MenuItem key={c._id} value={c._id}>{c.name || `Grade ${c.grade} - ${c.section}`}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={()=>setCloneOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCloneSubmit} disabled={!cloneSourceClassId || mutation.isPending}>
            {mutation.isPending && cloneSourceClassId ? <CircularProgress size={20} color="inherit"/> : 'Clone'}
          </Button>
        </DialogActions>
        
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit"/> : (editId ? 'Update Classroom' : 'Create Classroom')}
          </Button>
        </DialogActions>
        </DialogContent>
      </Dialog> */}
    </Box>
  );
}
