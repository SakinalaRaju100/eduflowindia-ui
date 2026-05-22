import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { Add, Delete, Edit, Assignment, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { examAPI, principalAPI, classroomAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_EXAM = {
  title: '',
  type: 'unit-test',
  term: 'Term 1',
  status: 'scheduled',
  classroomId: '',
  subjects: [
    {
      subjectName: '',
      subjectCode: '',
      date: '',
      startTime: '09:00',
      endTime: '12:00',
      maxMarks: 100,
      passingMarks: 35,
    },
  ],
};

export default function ExamsAndResults() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const [open, setOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_EXAM);

  const { data: examsData, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examAPI.getAll(),
  });
  const { data: classData } = useQuery({
    queryKey: ['classrooms', user?.role],
    queryFn: () =>
      ['principal', 'superadmin'].includes(user?.role)
        ? principalAPI.getClassrooms()
        : classroomAPI.getAll(),
    enabled: !!user?.role,
  });

  const exams = examsData?.data?.data || [];
  const classes = classData?.data?.data || [];

  const filteredExams = exams.filter((e) => !selectedYear || e.academicYear === selectedYear);

  const filteredClasses = classes.filter((c) => {
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

  const mutation = useMutation({
    mutationFn: async (d) => {
      const payload = {
        ...d,
        classroom: d.classroomId,
        isPublished: d.status === 'announced',
        academicYear: d.academicYear || selectedYear,
      };
      if (editId) return examAPI.update(editId, payload);
      return examAPI.create(payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['exams']);
      const newExamId = editId || res?.data?.data?._id;
      if (
        (form.status === 'evaluation' || form.status === 'announced') &&
        newExamId &&
        evalStudents.length > 0
      ) {
        marksMutation.mutate(newExamId);
      }
      setOpen(false);
      setForm(EMPTY_EXAM);
      setEditId(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });
  const delMutation = useMutation({
    mutationFn: (id) => examAPI.delete(id),
    onSuccess: () => qc.invalidateQueries(['exams']),
  });

  const addSubject = () =>
    setForm((p) => ({
      ...p,
      subjects: [
        ...p.subjects,
        {
          subjectName: '',
          subjectCode: '',
          date: '',
          startTime: '09:00',
          endTime: '12:00',
          maxMarks: 100,
          passingMarks: 35,
        },
      ],
    }));
  const removeSubject = (i) =>
    setForm((p) => ({ ...p, subjects: p.subjects.filter((_, ii) => ii !== i) }));
  const setSubject = (i, k, v) =>
    setForm((p) => {
      const s = [...p.subjects];
      s[i] = { ...s[i], [k]: v };
      return { ...p, subjects: s };
    });

  const handleClassChange = (e) => {
    const cid = e.target.value;
    const selectedClass = classes.find((c) => c._id === cid);
    let newSubjects = [
      {
        subjectName: '',
        subjectCode: '',
        date: '',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 35,
      },
    ];
    if (selectedClass?.subjects?.length > 0) {
      newSubjects = selectedClass.subjects.map((s) => ({
        subjectName: s.name || '',
        subjectCode: s.code || '',
        date: '',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: s.maxMarks || 100,
        passingMarks: Math.round((s.maxMarks || 100) * 0.35) || 35,
      }));
    }
    setForm((p) => ({ ...p, classroomId: cid, subjects: newSubjects }));
  };

  const activeClassroomId = resultsOpen
    ? selectedExam?.classroom?._id || selectedExam?.classroom
    : form.classroomId;
  const activeExamId = resultsOpen ? selectedExam?._id : editId;

  const { data: clsData } = useQuery({
    queryKey: ['classroom', activeClassroomId],
    queryFn: () => classroomAPI.getById(activeClassroomId),
    enabled: !!activeClassroomId,
  });
  const { data: resData } = useQuery({
    queryKey: ['exam-results', activeExamId],
    queryFn: () => examAPI.getResults(activeExamId),
    enabled: !!activeExamId,
  });
  const evalStudents = clsData?.data?.data?.students || [];
  const existingResults = resData?.data?.data || [];

  React.useEffect(() => {
    if (existingResults.length > 0) {
      const m = {};
      existingResults.forEach((r) => {
        m[r.student?._id || r.student] = {};
        r.subjectMarks?.forEach((sm) => {
          m[r.student?._id || r.student][sm.subjectCode] = sm.marksObtained;
        });
      });
      setMarks(m);
    } else {
      setMarks({});
    }
  }, [existingResults]);

  const marksMutation = useMutation({
    mutationFn: (explicitExamId) => {
      const targetExamId = typeof explicitExamId === 'string' ? explicitExamId : activeExamId;
      const targetSubjects = resultsOpen ? selectedExam.subjects : form.subjects;
      const resultsPayload = evalStudents.map((s) => {
        const sm = targetSubjects.map((sub) => ({
          ...sub,
          marksObtained: marks[s._id]?.[sub.subjectCode] || 0,
        }));
        return { studentId: s._id, subjectMarks: sm };
      });
      return examAPI.enterResults(targetExamId, { results: resultsPayload });
    },
    onSuccess: (_, explicitExamId) => {
      qc.invalidateQueries([
        'exam-results',
        typeof explicitExamId === 'string' ? explicitExamId : activeExamId,
      ]);
      if (resultsOpen) {
        setResultsOpen(false);
        setSelectedExam(null);
      }
    },
  });

  const handleOpenResults = (exam) => {
    setSelectedExam(exam);
    setResultsOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditId(exam._id);
    setForm({
      title: exam.title || '',
      type: exam.type || 'unit-test',
      term: exam.term || 'Term 1',
      status: exam.status || (exam.isPublished ? 'announced' : 'scheduled'),
      classroomId: exam.classroom?._id || exam.classroom || '',
      subjects:
        exam.subjects?.length > 0
          ? exam.subjects.map((s) => ({
              ...s,
              date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
              passingMarks: s.passingMarks ?? Math.round((s.maxMarks || 100) * 0.35),
            }))
          : EMPTY_EXAM.subjects,
    });
    setOpen(true);
  };

  const cols = [
    { key: 'title', label: 'Exam Title', minWidth: 160 },
    {
      key: 'classroom.name',
      label: 'Class',
      render: (r) => <Chip label={r.classroom?.name || '—'} size="small" />,
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => <Chip label={r.type} size="small" variant="outlined" />,
    },
    { key: 'term', label: 'Term' },
    {
      key: 'subjects',
      label: 'Subjects',
      render: (r) => <Typography variant="caption">{r.subjects?.length || 0} subjects</Typography>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const st = r.status || (r.isPublished ? 'announced' : 'scheduled');
        const color = st === 'announced' ? 'success' : st === 'evaluation' ? 'warning' : 'default';
        return <Chip label={st.replace('-', ' ').toUpperCase()} size="small" color={color} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (r) => {
        const st = r.status || (r.isPublished ? 'announced' : 'scheduled');
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {st === 'evaluation' && (
              <Tooltip title="Enter Marks">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenResults(r);
                  }}
                >
                  <Assignment fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {st === 'announced' && (
              <Tooltip title="View Results">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenResults(r);
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(r);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this exam?')) delMutation.mutate(r._id);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Exams
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditId(null);
            setForm(EMPTY_EXAM);
            setOpen(true);
          }}
        >
          Schedule Exam
        </Button>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <DataTable
            columns={cols}
            rows={filteredExams}
            loading={isLoading}
            searchKeys={['title', 'classroom.name', 'type']}
            searchPlaceholder="Search exams..."
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Edit Exam' : 'Schedule Exam'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Exam Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Class</InputLabel>
                <Select value={form.classroomId} onChange={handleClassChange} label="Class">
                  {filteredClasses.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  label="Type"
                >
                  {['unit-test', 'mid-term', 'final', 'quiz', 'assignment'].map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Term</InputLabel>
                <Select
                  value={form.term}
                  onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                  label="Term"
                >
                  {['Term 1', 'Term 2', 'Term 3', 'Annual'].map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status || 'scheduled'}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  label="Status"
                >
                  {['scheduled', 'evaluation', 'announced'].map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {form.status === 'scheduled' && (
            <Box sx={{ mt: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Subjects
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
                    {i > 0 && (
                      <IconButton size="small" onClick={() => removeSubject(i)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name"
                        value={s.subjectName}
                        onChange={(e) => setSubject(i, 'subjectName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Code"
                        value={s.subjectCode}
                        onChange={(e) => setSubject(i, 'subjectCode', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Date"
                        InputLabelProps={{ shrink: true }}
                        value={s.date}
                        onChange={(e) => setSubject(i, 'date', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max Marks"
                        value={s.maxMarks}
                        onChange={(e) => setSubject(i, 'maxMarks', +e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3} sm={2}>
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
            </Box>
          )}
          {(form.status === 'evaluation' || form.status === 'announced') && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                {form.status === 'announced' ? 'Exam Results' : 'Enter Marks'}
              </Typography>
              {evalStudents.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No students found in the selected classroom.
                </Alert>
              ) : (
                <Box
                  sx={{
                    overflowX: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'background.paper', minWidth: 150 }}>
                          Student
                        </TableCell>
                        {form.subjects.map((sub) => (
                          <TableCell
                            key={sub.subjectCode}
                            align="center"
                            sx={{ bgcolor: 'background.paper', minWidth: 120 }}
                          >
                            {sub.subjectName || sub.subjectCode} (Max: {sub.maxMarks})
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {evalStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          {form.subjects.map((sub) => (
                            <TableCell key={sub.subjectCode} align="center">
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{
                                  max: sub.maxMarks,
                                  min: 0,
                                  readOnly: form.status === 'announced',
                                }}
                                sx={{ width: 80 }}
                                value={marks[student._id]?.[sub.subjectCode] ?? ''}
                                onChange={(e) =>
                                  setMarks((p) => ({
                                    ...p,
                                    [student._id]: {
                                      ...(p[student._id] || {}),
                                      [sub.subjectCode]: +e.target.value,
                                    },
                                  }))
                                }
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || marksMutation.isPending}
          >
            {mutation.isPending || marksMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : form.status === 'evaluation' ? (
              'Save Exam & Marks'
            ) : editId ? (
              'Update Exam'
            ) : (
              'Schedule Exam'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resultsOpen} onClose={() => setResultsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          {selectedExam?.status === 'announced' || selectedExam?.isPublished
            ? 'Exam Results'
            : 'Enter Marks'}{' '}
          - {selectedExam?.title}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {evalStudents.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography>No students found in this class.</Typography>
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  {selectedExam?.subjects?.map((sub) => (
                    <TableCell key={sub.subjectCode} align="center">
                      {sub.subjectName} (Max: {sub.maxMarks})
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {evalStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    {selectedExam?.subjects?.map((sub) => (
                      <TableCell key={sub.subjectCode} align="center">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{
                            max: sub.maxMarks,
                            min: 0,
                            readOnly:
                              selectedExam?.status === 'announced' || selectedExam?.isPublished,
                          }}
                          sx={{ width: 80 }}
                          value={marks[student._id]?.[sub.subjectCode] ?? ''}
                          onChange={(e) =>
                            setMarks((p) => ({
                              ...p,
                              [student._id]: {
                                ...(p[student._id] || {}),
                                [sub.subjectCode]: +e.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setResultsOpen(false)}>Close</Button>
          {!(selectedExam?.status === 'announced' || selectedExam?.isPublished) && (
            <Button
              variant="contained"
              onClick={() => marksMutation.mutate()}
              disabled={marksMutation.isPending || evalStudents.length === 0}
            >
              {marksMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Save Marks'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
