import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Table,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import {
  AccountBalanceWallet,
  RequestQuote,
  Gavel,
  CheckCircle,
  Add,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { feeAPI, principalAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import StatCard from '@/components/common/StatCard';
import StudentPopup from '@/components/common/StudentPopup';
import { format, isPast } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function PrincipalFees() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { selectedYear } = useOutletContext() || {};
  const [ayFilter, setAyFilter] = useState(selectedYear || 'all');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [popupStudent, setPopupStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentMode: 'cash', receiptNo: '' });
  const [confirmCollect, setConfirmCollect] = useState(null);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    assignTo: 'classroom',
    classroom: '',
    student: '',
    feeType: '',
    academicYear: selectedYear || '',
    installments: [{ amount: 0, dueDate: '' }],
  });

  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: () => feeAPI.getAll(),
  });
  const { data: clsData, isLoading: clsLoading } = useQuery({
    queryKey: ['p-classrooms'],
    queryFn: () => principalAPI.getClassrooms(),
  });
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['p-students'],
    queryFn: () => principalAPI.getStudents(),
  });

  const allFees = feesData?.data?.data || [];
  const classrooms = clsData?.data?.data || [];
  const students = studentsData?.data?.data || [];

  const academicYears = user?.institution?.academicYears || [
    { year: '2022-2023', startDate: '2022-04-01', endDate: '2023-03-31', isCurrent: false },
    { year: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: true },
  ];

  useEffect(() => {
    if (selectedYear) setAyFilter(selectedYear);
  }, [selectedYear]);

  const uniqueYears = Array.from(
    new Set(
      [
        ...allFees.map((f) => f.academicYear),
        ...classrooms.map((c) => c.academicYear),
        selectedYear,
      ].filter(Boolean),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(
      (c) => ayFilter === 'all' || !c.academicYear || c.academicYear === ayFilter,
    );
  }, [classrooms, ayFilter]);

  useEffect(() => {
    if (classFilter !== 'all' && !filteredClassrooms.some((c) => c._id === classFilter)) {
      setClassFilter('all');
    }
  }, [filteredClassrooms, classFilter]);

  const studentFeeData = useMemo(() => {
    let data = students;

    if (ayFilter !== 'all') {
      data = data.filter((s) => {
        const studentUserId = s.userId?._id || s.userId;
        const hasFeesInYear = allFees.some(
          (f) => (f.student?._id || f.student) === studentUserId && f.academicYear === ayFilter,
        );
        return s.academicYear === ayFilter || hasFeesInYear;
      });
    }

    if (classFilter !== 'all') {
      data = data.filter((s) => (s.classroom?._id || s.classroom) === classFilter);
    }

    return data.map((sp) => {
      const studentUserId = sp.userId?._id || sp.userId;
      let studentFees = allFees.filter((f) => (f.student?._id || f.student) === studentUserId);

      if (ayFilter !== 'all') {
        studentFees = studentFees.filter((f) => f.academicYear === ayFilter);
      }

      let totalExpected = 0;
      let totalCollected = 0;
      let totalOverdue = 0;
      let hasOverdue = false;

      studentFees.forEach((f) => {
        totalExpected += f.totalAmount || 0;
        const paid =
          f.installments?.filter((i) => i.isPaid).reduce((s, i) => s + (i.amount || 0), 0) || 0;
        totalCollected += paid;

        const overdue =
          f.installments
            ?.filter((i) => !i.isPaid && i.dueDate && isPast(new Date(i.dueDate)))
            .reduce((s, i) => s + (i.amount || 0), 0) || 0;
        totalOverdue += overdue;
        if (overdue > 0) hasOverdue = true;
      });

      const totalDue = totalExpected - totalCollected;
      const status =
        totalExpected === 0
          ? 'No Fees'
          : totalDue === 0
            ? 'Paid'
            : hasOverdue
              ? 'Overdue'
              : 'Pending';

      return {
        ...sp,
        studentFees,
        totalExpected,
        totalCollected,
        totalDue,
        totalOverdue,
        status,
      };
    });
  }, [students, allFees, classFilter, ayFilter]);

  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalOverdue = 0;

    studentFeeData.forEach((s) => {
      totalExpected += s.totalExpected || 0;
      totalCollected += s.totalCollected || 0;
      totalOverdue += s.totalOverdue || 0;
    });

    return {
      totalExpected,
      totalCollected,
      totalDue: totalExpected - totalCollected,
      totalOverdue,
    };
  }, [studentFeeData]);

  const collectMutation = useMutation({
    mutationFn: ({ feeId, installmentNo }) =>
      feeAPI.collectInstallment(feeId, { installmentNo, ...paymentForm }),
    onSuccess: () => {
      qc.invalidateQueries(['fees']);
      setPaymentForm({ paymentMode: 'cash', receiptNo: '' });
      setConfirmCollect(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to collect payment'),
  });

  const handleAddInst = () =>
    setCreateForm((p) => ({ ...p, installments: [...p.installments, { amount: 0, dueDate: '' }] }));
  const handleRemoveInst = (i) =>
    setCreateForm((p) => ({ ...p, installments: p.installments.filter((_, idx) => idx !== i) }));
  const handleInstChange = (i, field, val) =>
    setCreateForm((p) => {
      const insts = [...p.installments];
      insts[i][field] = val;
      return { ...p, installments: insts };
    });
  const computedTotal = createForm.installments.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0,
  );

  const createMutation = useMutation({
    mutationFn: (payload) => feeAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries(['fees']);
      setCreateOpen(false);
      setCreateForm({
        assignTo: 'classroom',
        classroom: '',
        student: '',
        feeType: '',
        academicYear: selectedYear || '',
        installments: [{ amount: 0, dueDate: '' }],
      });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create fee'),
  });

  const handleCreateSubmit = () => {
    const payload = { ...createForm, totalAmount: computedTotal };
    if (payload.assignTo === 'student') {
      const selectedStudent = students.find((s) => (s.userId?._id || s.userId) === payload.student);
      payload.classroom = selectedStudent?.classroom?._id || selectedStudent?.classroom;
    }
    createMutation.mutate(payload);
  };

  const cols = [
    {
      key: 'userId.firstName',
      label: 'Student',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={r.userId?.photo}
            sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {r.userId?.firstName?.[0]}
            {r.userId?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {r.userId?.firstName} {r.userId?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.userId?.email || 'No email'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'classroom.name',
      label: 'Class',
      render: (r) => <Chip label={r.classroom?.name || '—'} size="small" />,
    },
    {
      key: 'totalExpected',
      label: 'Total Fees',
      render: (r) => (
        <Typography variant="body2" fontWeight={700}>
          ₹{(r.totalExpected || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      key: 'paid',
      label: 'Collection Status',
      render: (r) => {
        return (
          <Box>
            <Typography variant="caption" color="success.main" fontWeight={700} display="block">
              ₹{(r.totalCollected || 0).toLocaleString()} Paid
            </Typography>
            {r.totalDue > 0 && (
              <Typography variant="caption" color="error.main" fontWeight={700}>
                ₹{r.totalDue.toLocaleString()} Due
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const color =
          r.status === 'Paid'
            ? 'success'
            : r.status === 'Overdue'
              ? 'error'
              : r.status === 'No Fees'
                ? 'default'
                : 'warning';
        return (
          <Chip
            label={r.status}
            size="small"
            color={color}
            sx={{ fontWeight: 700, fontSize: 11 }}
          />
        );
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (r) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStudentId(r._id);
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  const currentStudent = selectedStudentId
    ? studentFeeData.find((s) => s._id === selectedStudentId)
    : null;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Fees & Payments
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Academic Year</InputLabel>
            <Select value={ayFilter} onChange={(e) => setAyFilter(e.target.value)} label="Academic Year">
              <MenuItem value="all">All Years</MenuItem>
              {uniqueYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl> */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Class</InputLabel>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              label="Filter by Class"
            >
              <MenuItem value="all">All Classes</MenuItem>
              {filteredClassrooms.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setCreateForm((p) => ({ ...p, academicYear: selectedYear || '' }));
              setCreateOpen(true);
            }}
          >
            Create Fee
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expected"
            value={`₹${stats.totalExpected.toLocaleString()}`}
            icon={<AccountBalanceWallet />}
            color="#1565C0"
            loading={feesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Collected"
            value={`₹${stats.totalCollected.toLocaleString()}`}
            icon={<CheckCircle />}
            color="#2E7D32"
            loading={feesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Outstanding Due"
            value={`₹${stats.totalDue.toLocaleString()}`}
            icon={<RequestQuote />}
            color="#E65100"
            loading={feesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Amount"
            value={`₹${stats.totalOverdue.toLocaleString()}`}
            icon={<Gavel />}
            color="#C62828"
            loading={feesLoading}
          />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <DataTable
              columns={cols}
              rows={studentFeeData}
              loading={feesLoading || clsLoading || studentsLoading}
              searchKeys={['userId.firstName', 'userId.lastName', 'userId.email', 'studentId']}
              searchPlaceholder="Search student name, email, or ID..."
              emptyMessage="No students found."
              onRowClick={(row) => setPopupStudent(row.userId?._id || row.userId)}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Manage Fee Dialog */}
      <Dialog
        open={Boolean(currentStudent)}
        onClose={() => setSelectedStudentId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Manage Fee Collection</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Avatar
              src={currentStudent?.userId?.photo}
              sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}
            >
              {currentStudent?.userId?.firstName?.[0]}
              {currentStudent?.userId?.lastName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {currentStudent?.userId?.firstName} {currentStudent?.userId?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentStudent?.classroom?.name} • ID: {currentStudent?.studentId}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" fontWeight={800} color="primary">
                ₹{(currentStudent?.totalExpected || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Expected
              </Typography>
            </Box>
          </Box>

          {currentStudent?.studentFees?.length === 0 ? (
            <Typography color="text.secondary">No fee records found for this student.</Typography>
          ) : (
            currentStudent?.studentFees?.map((fee) => (
              <Box key={fee._id} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {fee.feeType} — Total: ₹{fee.totalAmount?.toLocaleString()}
                </Typography>
                <TableContainer
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.paper' }}>
                        <TableCell>
                          <strong>Installment</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Due Date</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Amount</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Status</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Action</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fee.installments?.map((inst) => {
                        const isOverdue =
                          !inst.isPaid && inst.dueDate && isPast(new Date(inst.dueDate));
                        return (
                          <TableRow key={inst.installmentNo}>
                            <TableCell>#{inst.installmentNo}</TableCell>
                            <TableCell
                              sx={{
                                color: isOverdue ? 'error.main' : 'inherit',
                                fontWeight: isOverdue ? 600 : 400,
                              }}
                            >
                              {inst.dueDate ? format(new Date(inst.dueDate), 'dd MMM yyyy') : '—'}
                            </TableCell>
                            <TableCell align="right" fontWeight={600}>
                              ₹{inst.amount?.toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={inst.isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                                size="small"
                                color={inst.isPaid ? 'success' : isOverdue ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {inst.isPaid ? (
                                <Typography variant="caption" color="text.secondary">
                                  Paid on{' '}
                                  {inst.paidDate
                                    ? format(new Date(inst.paidDate), 'dd MMM yyyy')
                                    : '—'}
                                </Typography>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() =>
                                    setConfirmCollect({
                                      feeId: fee._id,
                                      installmentNo: inst.installmentNo,
                                      amount: inst.amount,
                                      feeType: fee.feeType,
                                    })
                                  }
                                >
                                  Collect
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedStudentId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reused Student Details popup */}
      <StudentPopup
        studentId={popupStudent}
        open={Boolean(popupStudent)}
        onClose={() => setPopupStudent(null)}
      />

      <Dialog
        open={Boolean(confirmCollect)}
        onClose={() => setConfirmCollect(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Confirm Payment</DialogTitle>
        <DialogContent dividers>
          <Typography mb={2}>
            Collect <strong>₹{confirmCollect?.amount?.toLocaleString()}</strong> for{' '}
            <strong>{confirmCollect?.feeType}</strong> (Installment #{confirmCollect?.installmentNo}
            )?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMode: e.target.value }))}
                  label="Payment Mode"
                >
                  {['cash', 'online', 'cheque', 'dd'].map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Receipt / Reference No. (Optional)"
                value={paymentForm.receiptNo}
                onChange={(e) => setPaymentForm((p) => ({ ...p, receiptNo: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmCollect(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={collectMutation.isPending}
            onClick={() =>
              collectMutation.mutate({
                feeId: confirmCollect.feeId,
                installmentNo: confirmCollect.installmentNo,
              })
            }
          >
            {collectMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Fee Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Create New Fee</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={createForm.assignTo}
                  label="Assign To"
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      assignTo: e.target.value,
                      classroom: '',
                      student: '',
                    }))
                  }
                >
                  <MenuItem value="classroom">Entire Classroom</MenuItem>
                  <MenuItem value="student">Individual Student</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {createForm.assignTo === 'classroom' ? (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Classroom</InputLabel>
                  <Select
                    value={createForm.classroom}
                    label="Classroom"
                    onChange={(e) => setCreateForm((p) => ({ ...p, classroom: e.target.value }))}
                  >
                    {filteredClassrooms.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Student</InputLabel>
                  <Select
                    value={createForm.student}
                    label="Student"
                    onChange={(e) => setCreateForm((p) => ({ ...p, student: e.target.value }))}
                  >
                    {studentFeeData.map((s) => (
                      <MenuItem key={s.userId?._id || s.userId} value={s.userId?._id || s.userId}>
                        {s.userId?.firstName} {s.userId?.lastName} ({s.studentId})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Fee Type (e.g. Tuition, Transport)"
                value={createForm.feeType}
                onChange={(e) => setCreateForm((p) => ({ ...p, feeType: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={createForm.academicYear}
                  label="Academic Year"
                  onChange={(e) => setCreateForm((p) => ({ ...p, academicYear: e.target.value }))}
                >
                  {academicYears.map((ay) => (
                    <MenuItem key={ay.year} value={ay.year}>
                      {ay.year} {ay.isCurrent ? '(Current)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  mt: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Installments
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddInst}>
                  Add Installment
                </Button>
              </Box>
              {createForm.installments.map((inst, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{ width: 30, fontWeight: 700, color: 'text.secondary' }}
                  >
                    #{i + 1}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Amount (₹)"
                    value={inst.amount}
                    onChange={(e) => handleInstChange(i, 'amount', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Due Date"
                    InputLabelProps={{ shrink: true }}
                    value={inst.dueDate}
                    onChange={(e) => handleInstChange(i, 'dueDate', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveInst(i)}
                    disabled={createForm.installments.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Total Amount: ₹{computedTotal.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={
              createMutation.isPending ||
              !createForm.feeType ||
              (!createForm.classroom && !createForm.student)
            }
          >
            {createMutation.isPending ? 'Creating...' : 'Create Fee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
