import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Avatar, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel, Tooltip } from '@mui/material';
import { Add, Edit, Delete, School, People } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import StatCard from '@/components/common/StatCard';

const EMPTY = { schoolUniqueId:'', name:'', email:'', phone:'', website:'', affiliationBoard:'CBSE', affiliationNumber:'', address:{street:'',city:'',state:'',country:'India',pincode:''}, principalFirstName:'', principalLastName:'', principalEmail:'', principalPhone:'', schoolMotive:'', keypoints:'', successStories:[] };

const generateSchoolId = (schoolName) => {
  if (!schoolName) return '';
  return schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export default function SADashboard() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [editSchool, setEditSchool] = useState(null); const [form, setForm] = useState(EMPTY); const [error, setError] = useState('');
  const { data: sd, isLoading } = useQuery({ queryKey:['schools'], queryFn:()=>superadminAPI.getSchools() });
  const { data: statsData } = useQuery({ queryKey:['sa-stats'], queryFn:()=>superadminAPI.getStats() });
  const schools = sd?.data?.data || []; const stats = statsData?.data?.data || {};

  const isIdTaken = Boolean(form.schoolUniqueId && schools.some(s => s.schoolUniqueId === form.schoolUniqueId && s._id !== editSchool?._id));

  const mutation = useMutation({
    mutationFn: d => editSchool ? superadminAPI.updateSchool(editSchool._id, d) : superadminAPI.createSchool(d),
    onSuccess: () => { qc.invalidateQueries(['schools']); qc.invalidateQueries(['sa-stats']); setOpen(false); setForm(EMPTY); setEditSchool(null); setError(''); },
    onError: err => setError(err.response?.data?.message || 'Failed'),
  });
  const delMutation = useMutation({ mutationFn: id => superadminAPI.deleteSchool(id), onSuccess: () => qc.invalidateQueries(['schools']) });

  const setF = (path, val) => {
    const keys = path.split('.');
    setForm(p => { 
      const n = { ...p }; 
      if (keys.length === 1) {
        if (path === 'schoolUniqueId') val = val.toUpperCase();
        n[keys[0]] = val; 
        // Auto-generate the School ID only when creating a new school and typing the name
        if (path === 'name' && !editSchool) n.schoolUniqueId = generateSchoolId(val);
      } 
      else n[keys[0]] = { ...n[keys[0]], [keys[1]]: val }; 
      return n; 
    });
  };

  const openEdit = s => { setEditSchool(s); setForm({...EMPTY,...s,address:{...EMPTY.address,...s.address}, successStories: s.successStories || []}); setOpen(true); };

  const addStory = () => setForm(p=>({...p, successStories:[...(p.successStories||[]),{name:'',text:'',color:'#1565C0'}]}));
  const removeStory = i => setForm(p=>({...p, successStories:p.successStories.filter((_,ii)=>ii!==i)}));
  const setStory = (i,k,v) => setForm(p=>{ const s=[...(p.successStories||[])]; s[i]={...s[i],[k]:v}; return {...p,successStories:s}; });

  const cols = [
    { key:'name', label:'School', minWidth:200, render: r => <Box sx={{display:'flex',alignItems:'center',gap:1.5}}><Avatar sx={{width:32,height:32,bgcolor:'primary.main',fontSize:13,fontWeight:700}}>{r.name?.[0]}</Avatar><Box><Typography variant="body2" fontWeight={700}>{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box></Box> },
    { key:'affiliationBoard', label:'Board', render: r => <Chip label={r.affiliationBoard} size="small" variant="outlined" /> },
    { key:'principalId', label:'Principal', render: r => r.principalId ? `${r.principalId.firstName} ${r.principalId.lastName}` : '—' },
    { key:'address.city', label:'City', render: r => r.address?.city||'—' },
    { key:'currentAcademicYear', label:'Year' },
    { key:'isActive', label:'Status', render: r => <Chip label={r.isActive?'Active':'Inactive'} size="small" color={r.isActive?'success':'default'} /> },
    { key:'actions', label:'Actions', sortable:false, render: r => (
      <Box sx={{display:'flex',gap:0.5}}>
        <Tooltip title="Edit"><IconButton size="small" onClick={e=>{e.stopPropagation();openEdit(r);}}><Edit fontSize="small"/></IconButton></Tooltip>
        <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={e=>{e.stopPropagation();if(window.confirm('Deactivate?')) delMutation.mutate(r._id);}}><Delete fontSize="small"/></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <Box>
      <Grid container spacing={2.5} sx={{ mb:3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Total Schools" value={stats.totalSchools} icon={<School/>} color="#1565C0" loading={!statsData} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Active Schools" value={stats.activeSchools} icon={<School/>} color="#2E7D32" loading={!statsData} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Total Users" value={stats.totalUsers} icon={<People/>} color="#6A1B9A" loading={!statsData} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Inactive" value={(stats.totalSchools||0)-(stats.activeSchools||0)} icon={<School/>} color="#E65100" loading={!statsData} /></Grid>
      </Grid>
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:3 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
            <Typography variant="h6" fontWeight={700}>All Schools</Typography>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>{setEditSchool(null);setForm(EMPTY);setError('');setOpen(true);}}>Register New School</Button>
          </Box>
          <DataTable columns={cols} rows={schools} loading={isLoading} searchKeys={['name','email','address.city']} searchPlaceholder="Search schools..." />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editSchool?'Edit School':'Register New School'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt:1 }}>School Information</Typography>
          <Grid container spacing={2}>
            {[['name','School Name',12],['schoolUniqueId','Unique School ID',12],['email','School Email',6],['phone','Phone',6],['website','Website',6],['affiliationNumber','Affiliation Number',6]].map(([k,l,xs]) => (
              <Grid item xs={12} sm={xs} key={k}>
                <TextField 
                  fullWidth 
                  size="small" 
                  label={l} 
                  value={form[k]||''} 
                  onChange={e=>setF(k,e.target.value)} 
                  disabled={k === 'schoolUniqueId' && Boolean(editSchool)}
                  error={k === 'schoolUniqueId' && isIdTaken}
                  FormHelperTextProps={{ sx: { color: k === 'schoolUniqueId' && form.schoolUniqueId && !isIdTaken && !editSchool ? 'success.main' : undefined, fontWeight: k === 'schoolUniqueId' ? 600 : 400 } }}
                  helperText={k === 'schoolUniqueId' ? (editSchool ? 'School ID cannot be changed once created.' : (isIdTaken ? '❌ This School ID is already taken.' : (form.schoolUniqueId ? '✅ Available' : 'Auto-generated from Name. Modify to make unique if needed.'))) : ''}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small"><InputLabel>Board</InputLabel>
                <Select value={form.affiliationBoard} onChange={e=>setF('affiliationBoard',e.target.value)} label="Board">
                  {['CBSE','ICSE','State Board','IB','Cambridge','Other'].map(b=><MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt:2.5, mb:1 }}>Address</Typography>
          <Grid container spacing={2}>
            {[['address.street','Street',12],['address.city','City',4],['address.state','State',4],['address.pincode','Pincode',4]].map(([k,l,xs]) => (
              <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} value={k.split('.').reduce((o,kk)=>o?.[kk],form)||''} onChange={e=>setF(k,e.target.value)} /></Grid>
            ))}
          </Grid>
          {!editSchool && <>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mt:2.5, mb:1 }}>Principal Account</Typography>
            <Grid container spacing={2}>
              {[['principalFirstName','First Name',6],['principalLastName','Last Name',6],['principalEmail','Email',6],['principalPhone','Phone',6]].map(([k,l,xs]) => (
                <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} /></Grid>
              ))}
            </Grid>
            <Alert severity="info" sx={{ mt:2 }}>A temporary password will be emailed to the principal.</Alert>
          </>}

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt:2.5, mb:1 }}>Public School Info</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth size="small" multiline rows={3} label="School Motive / About" value={form.schoolMotive||''} onChange={e=>setF('schoolMotive',e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" multiline rows={2} label="Key Highlights (Comma separated)" value={form.keypoints||''} onChange={e=>setF('keypoints',e.target.value)} /></Grid>
          </Grid>
          <Box sx={{ mt:2.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
              <Typography variant="subtitle2" fontWeight={700}>Success Stories ({form.successStories?.length || 0})</Typography>
              <Button size="small" startIcon={<Add/>} onClick={addStory}>Add Story</Button>
            </Box>
            {form.successStories?.map((s,i) => (
              <Box key={i} sx={{ p:2, border:'1px solid', borderColor:'divider', borderRadius:2, mb:1.5 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:1 }}>
                  <Typography variant="caption" fontWeight={700}>Story {i+1}</Typography>
                  <IconButton size="small" onClick={()=>removeStory(i)}><Delete fontSize="small"/></IconButton>
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Student Name" value={s.name||''} onChange={e=>setStory(i,'name',e.target.value)}/></Grid>
                  <Grid item xs={12} sm={2}><TextField fullWidth size="small" type="color" label="Color" sx={{p:0}} value={s.color||'#1565C0'} onChange={e=>setStory(i,'color',e.target.value)}/></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Achievement Text" value={s.text||''} onChange={e=>setStory(i,'text',e.target.value)}/></Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p:2.5 }}>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending || isIdTaken}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit"/> : (editSchool?'Update':'Register School')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
