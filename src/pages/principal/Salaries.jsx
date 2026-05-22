import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress, Chip, IconButton, Tooltip, Avatar } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryAPI, principalAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import { format } from 'date-fns';

const EMPTY_FORM = { teacher: '', month: format(new Date(), 'MMMM'), year: new Date().getFullYear(), baseSalary: 0, allowances: 0, deductions: 0, status: 'paid', paymentMode: 'bank_transfer' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PrincipalSalaries() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: salData, isLoading: sLoading } = useQuery({ queryKey: ['salaries'], queryFn: () => salaryAPI.getAll() });
  const { data: tData, isLoading: tLoading } = useQuery({ queryKey: ['p-teachers'], queryFn: () => principalAPI.getTeachers() });
  
  const salaries = salData?.data?.data || [];
  const teachers = tData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (d) => editId ? salaryAPI.update(editId, d) : salaryAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries(['salaries']);
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save salary record'),
  });

  const delMutation = useMutation({
    mutationFn: (id) => salaryAPI.delete(id),
    onSuccess: () => qc.invalidateQueries(['salaries']),
  });

  const handleOpenEdit = (sal) => {
    setEditId(sal._id);
    setForm({
      teacher: sal.teacher?._id || sal.teacher || '',
      month: sal.month, year: sal.year,
      baseSalary: sal.baseSalary, allowances: sal.allowances || 0, deductions: sal.deductions || 0,
      status: sal.status, paymentMode: sal.paymentMode || 'bank_transfer'
    });
    setOpen(true);
  };

  const cols = [
    { key: 'teacher.firstName', label: 'Teacher', render: r => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={r.teacher?.photo} sx={{ width: 32, height: 32, bgcolor: 'success.main', fontSize: 13, fontWeight: 700 }}>
          {r.teacher?.firstName?.[0]}{r.teacher?.lastName?.[0]}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={700}>{r.teacher?.firstName} {r.teacher?.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{r.teacher?.email}</Typography>
        </Box>
      </Box>
    )},
    { key: 'period', label: 'Period', render: r => <Typography variant="body2" fontWeight={600}>{r.month} {r.year}</Typography> },
    { key: 'baseSalary', label: 'Base', render: r => `₹${r.baseSalary?.toLocaleString()}` },
    { key: 'netSalary', label: 'Net Salary', render: r => <Typography variant="body2" color="primary" fontWeight={800}>₹{r.netSalary?.toLocaleString()}</Typography> },
    { key: 'status', label: 'Status', render: r => <Chip label={r.status} size="small" color={r.status === 'paid' ? 'success' : 'warning'} sx={{ textTransform: 'capitalize', fontWeight: 600 }} /> },
    { key: 'paymentDate', label: 'Paid On', render: r => <Typography variant="caption" color="text.secondary">{r.paymentDate ? format(new Date(r.paymentDate), 'dd MMM yyyy') : '—'}</Typography> },
    { key: 'actions', label: 'Actions', sortable: false, render: r => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Edit / Pay">
          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(r); }}><Edit fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this salary record?')) delMutation.mutate(r._id); }}><Delete fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
    )}
  ];

  const computedNet = Number(form.baseSalary || 0) + Number(form.allowances || 0) - Number(form.deductions || 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Teacher Salaries</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm(EMPTY_FORM); setOpen(true); }}>Process Salary</Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <DataTable columns={cols} rows={salaries} loading={sLoading || tLoading} searchKeys={['teacher.firstName', 'teacher.lastName', 'month', 'year']} searchPlaceholder="Search by teacher or month..." />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Edit Salary Record' : 'Process New Salary'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Teacher</InputLabel>
                <Select value={form.teacher} onChange={e => {
                  const tId = e.target.value;
                  const selectedT = teachers.find(t => t.userId?._id === tId);
                  setForm(p => ({ ...p, teacher: tId, baseSalary: selectedT?.salaryDetails?.baseSalary || 0, allowances: selectedT?.salaryDetails?.allowances || 0, deductions: selectedT?.salaryDetails?.deductions || 0 }));
                }} label="Select Teacher" disabled={!!editId}>
                  {teachers.map(t => t.userId && <MenuItem key={t.userId._id} value={t.userId._id}>{t.userId.firstName} {t.userId.lastName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} label="Month" disabled={!!editId}>
                  {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="number" label="Year" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} disabled={!!editId} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1, mb: -1 }}>Financial Details</Typography>
            </Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Base Salary (₹)" value={form.baseSalary} onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth size="small" type="number" label="Allowances (₹)" value={form.allowances} onChange={e => setForm(p => ({ ...p, allowances: e.target.value }))} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth size="small" type="number" label="Deductions (₹)" value={form.deductions} onChange={e => setForm(p => ({ ...p, deductions: e.target.value }))} /></Grid>
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700}>Calculated Net Salary:</Typography>
                <Typography variant="h6" fontWeight={800} color="primary">₹{computedNet.toLocaleString()}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))} label="Payment Mode">
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} label="Payment Status">
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.teacher || !form.baseSalary}>{mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Salary'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}