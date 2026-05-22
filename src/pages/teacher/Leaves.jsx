import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress, Chip, Tabs, Tab } from '@mui/material';
import { Add, CheckCircle, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const STATUS_COLOR = { pending:'warning', approved:'success', rejected:'error' };
const EMPTY = { leaveType:'casual', fromDate:'', toDate:'', reason:'' };

export default function TeacherLeaves() {
  const { user } = useAuth(); const qc = useQueryClient();
  const [tab, setTab] = useState(0); const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({ queryKey:['t-leaves'], queryFn:()=>leaveAPI.getAll() });
  const leaves = data?.data?.data || [];
  const myLeaves = leaves.filter(l => l.applicant?._id === user?._id || l.applicant === user?._id);
  const pendingLeaves = leaves.filter(l => l.status === 'pending' && l.applicantRole === 'student');

  const applyMutation = useMutation({
    mutationFn: d => leaveAPI.apply(d),
    onSuccess: () => { qc.invalidateQueries(['t-leaves']); setOpen(false); setForm(EMPTY); setError(''); },
    onError: err => setError(err.response?.data?.message||'Failed'),
  });
  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => leaveAPI.approve(id, { status }),
    onSuccess: () => qc.invalidateQueries(['t-leaves']),
  });

  const myCols = [
    { key:'leaveType', label:'Type', render: r=><Chip label={r.leaveType} size="small" variant="outlined"/> },
    { key:'fromDate', label:'From', render: r=>r.fromDate?format(new Date(r.fromDate),'dd MMM yyyy'):'—' },
    { key:'toDate', label:'To', render: r=>r.toDate?format(new Date(r.toDate),'dd MMM yyyy'):'—' },
    { key:'totalDays', label:'Days' },
    { key:'reason', label:'Reason', minWidth:200 },
    { key:'status', label:'Status', render: r=><Chip label={r.status} size="small" color={STATUS_COLOR[r.status]}/> },
  ];

  const studentCols = [
    { key:'applicant.firstName', label:'Student', render: r=><Typography variant="body2" fontWeight={600}>{r.applicant?.firstName} {r.applicant?.lastName}</Typography> },
    { key:'leaveType', label:'Type', render: r=><Chip label={r.leaveType} size="small" variant="outlined"/> },
    { key:'fromDate', label:'From', render: r=>r.fromDate?format(new Date(r.fromDate),'dd MMM yyyy'):'—' },
    { key:'totalDays', label:'Days' },
    { key:'reason', label:'Reason', minWidth:160 },
    { key:'actions', label:'Actions', sortable:false, render: r => r.status==='pending' ? (
      <Box sx={{display:'flex',gap:0.5}}>
        <Button size="small" color="success" variant="outlined" onClick={()=>approveMutation.mutate({id:r._id,status:'approved'})}>Approve</Button>
        <Button size="small" color="error" variant="outlined" onClick={()=>approveMutation.mutate({id:r._id,status:'rejected'})}>Reject</Button>
      </Box>
    ) : <Chip label={r.status} size="small" color={STATUS_COLOR[r.status]}/> },
  ];

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Typography variant="h5" fontWeight={700}>Leaves</Typography>
        <Button variant="contained" startIcon={<Add/>} onClick={()=>setOpen(true)}>Apply Leave</Button>
      </Box>
      <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2 }}>
        <Tab label={`My Leaves (${myLeaves.length})`}/>
        <Tab label={`Student Requests (${pendingLeaves.length})`}/>
      </Tabs>
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:3 }}>
          {tab===0 && <DataTable columns={myCols} rows={myLeaves} loading={isLoading} searchKeys={['leaveType','reason']} emptyMessage="No leave applications"/>}
          {tab===1 && <DataTable columns={studentCols} rows={pendingLeaves} loading={isLoading} searchKeys={['applicant.firstName','applicant.lastName']} emptyMessage="No pending student leave requests"/>}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Apply for Leave</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small"><InputLabel>Leave Type</InputLabel>
                <Select value={form.leaveType} onChange={e=>setForm(p=>({...p,leaveType:e.target.value}))} label="Leave Type">
                  {['sick','casual','earned','medical','personal','other'].map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="From Date" InputLabelProps={{shrink:true}} value={form.fromDate} onChange={e=>setForm(p=>({...p,fromDate:e.target.value}))}/></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="To Date" InputLabelProps={{shrink:true}} value={form.toDate} onChange={e=>setForm(p=>({...p,toDate:e.target.value}))}/></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={3} value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>applyMutation.mutate(form)} disabled={applyMutation.isPending}>
            {applyMutation.isPending?<CircularProgress size={20} color="inherit"/>:'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
