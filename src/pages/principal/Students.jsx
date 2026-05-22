import React, { useState, useMemo } from 'react';
import { Box, Button, Typography, Card, CardContent, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material';
import { Add, PersonAdd, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { principalAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import StudentPopup from '@/components/common/StudentPopup';

const EMPTY_FORM = { email:'', firstName:'', lastName:'', phone:'', classroomId:'', rollNumber:'', dateOfBirth:'', gender:'male', bloodGroup:'', guardians:[{relationship:'father',name:'',phone:'',email:''}] };

export default function PrincipalStudents() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState(null);
  const [popup, setPopup] = useState(null); const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [classFilter, setClassFilter] = useState('all');
  const { data, isLoading } = useQuery({ queryKey:['p-students'], queryFn:()=>principalAPI.getStudents() });
  const { data: cls } = useQuery({ queryKey:['p-classrooms'], queryFn:()=>principalAPI.getClassrooms() });
  const students = data?.data?.data || []; const classrooms = cls?.data?.data || [];

  const classOptions = useMemo(() => {
    return classrooms.map(c => {
      const ay = c.academicYear || 'Unknown Year';
      const cname = c.name || `Grade ${c.grade} - ${c.section}`;
      return { _id: c._id, label: `${ay} (${cname})` };
    }).sort((a, b) => b.label.localeCompare(a.label));
  }, [classrooms]);

  const filteredStudents = useMemo(() => {
    if (classFilter === 'all') return students;
    const selectedClass = classrooms.find(c => c._id === classFilter);
    const enrolledIds = selectedClass?.students?.map(id => String(id._id || id)) || [];
    return students.filter(s => {
      const cId = String(s.classroom?._id || s.classroom);
      const uId = String(s.userId?._id || s.userId);
      return cId === String(classFilter) || enrolledIds.includes(uId);
    });
  }, [students, classFilter, classrooms]);

  const mutation = useMutation({
    mutationFn: async d => {
      const payload = { ...d, classroom: d.classroomId };
      if (editId) {
        const oldStudent = students.find(s => s._id === editId);
        const oldClassroomId = oldStudent?.classroom?._id || oldStudent?.classroom;
        const newClassroomId = d.classroomId;
        const userId = oldStudent?.userId?._id || oldStudent?.userId;

        const res = await principalAPI.updateStudent(editId, payload);

        if (String(oldClassroomId) !== String(newClassroomId) && userId) {
          if (oldClassroomId) {
            await api.post(`/classrooms/${oldClassroomId}/students`, { studentIds: [userId], action: 'remove' });
          }
          if (newClassroomId) {
            await api.post(`/classrooms/${newClassroomId}/students`, { studentIds: [userId], action: 'add' });
          }
        }
        return res;
      } else {
        const res = await principalAPI.createStudent(payload);
        const userId = res.data?.data?.userId?._id || res.data?.data?.userId || res.data?.data?._id;
        if (d.classroomId && userId) {
          await api.post(`/classrooms/${d.classroomId}/students`, { studentIds: [userId], action: 'add' });
        }
        return res;
      }
    },
    onSuccess: () => { qc.invalidateQueries(['p-students']); setOpen(false); setError(''); setEditId(null); setForm(EMPTY_FORM); },
    onError: err => setError(err.response?.data?.message||'Failed'),
  });

  const toggleStudentMutation = useMutation({
    mutationFn: (s) => principalAPI.updateStudent(s._id, { isActive: s.isActive === false ? true : false }),
    onSuccess: () => { qc.invalidateQueries(['p-students']); setPopup(null); },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (s) => api.put(`/principal/students/${s._id}/reset-password`, { password: '1234', isFirstLogin: true }),
    onSuccess: () => { qc.invalidateQueries(['p-students']); alert('Password reset to 1234 successfully'); },
    onError: (err) => alert(err.response?.data?.message || 'Failed to reset password'),
  });

  const handleOpenEdit = (r) => {
    const u = r.userId || {};
    setEditId(r._id);
    setForm({
      firstName: u.firstName || '', lastName: u.lastName || '',
      email: u.email || '', phone: u.phone || '',
      classroomId: r.classroom?._id || r.classroom || '',
      rollNumber: r.rollNumber || '',
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().split('T')[0] : '',
      gender: r.gender || 'male', bloodGroup: r.bloodGroup || '',
      guardians: r.guardians?.length > 0 ? r.guardians : EMPTY_FORM.guardians
    });
    setPopup(null); // Close the details popup when opening edit mode
    setOpen(true);
  };

  const cols = [
    { key:'studentId', label:'ID', minWidth:100, render: r => <Typography variant="caption" fontWeight={700}>{r.studentId}</Typography> },
    { key:'userId.firstName', label:'Name', minWidth:160, render: r => <Box sx={{display:'flex',alignItems:'center',gap:1}}><Avatar src={r.userId?.photo} sx={{width:28,height:28,fontSize:11,bgcolor:'primary.main'}}>{r.userId?.firstName?.[0]}</Avatar><Typography variant="body2" fontWeight={600}>{r.userId?.firstName} {r.userId?.lastName}</Typography></Box> },
    { key:'rollNumber', label:'Roll No', minWidth:80 },
    { key:'classroom.name', label:'Class', render: r => <Chip label={r.classroom?.name||'—'} size="small" /> },
    { key:'gender', label:'Gender', render: r => <Chip label={r.gender} size="small" variant="outlined" /> },
    { key:'academicYear', label:'Year' },
    // { key:'password', label:'Password', render: r => <Typography variant="caption" fontWeight={600} color={r.userId?.isFirstLogin ? 'primary' : 'text.secondary'}>{r.userId?.isFirstLogin ? 'Student@1234' : 'Changed by user'}</Typography> },
    { key:'resetPassword', label:'Reset Password', render: r => (
      <Button 
        size="small" variant="outlined" color="warning" 
        onClick={(e) => { e.stopPropagation(); if (window.confirm('Reset password to 1234?')) resetPasswordMutation.mutate(r); }}
      >
        Reset to 1234
      </Button>
    ) },
  ];

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Typography variant="h5" fontWeight={700}>Students ({students.length})</Typography>
        <Button variant="contained" startIcon={<PersonAdd/>} onClick={()=>{setEditId(null); setForm(EMPTY_FORM); setOpen(true);}}>Enroll Student</Button>
      </Box>
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:3 }}>
          <DataTable 
            columns={cols} 
            rows={filteredStudents} 
            loading={isLoading} 
            searchKeys={['userId.firstName','userId.lastName','studentId','rollNumber']} 
            searchPlaceholder="Search students..." 
            onRowClick={row=>setPopup(row.userId?._id||row.userId)} 
            toolbarExtra={
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Class</InputLabel>
                <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} label="Filter by Class">
                  <MenuItem value="all">All Classes</MenuItem>
                  {classOptions.map(c => <MenuItem key={c._id} value={c._id}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Edit Student Details' : 'Enroll New Student'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
          <Grid container spacing={2} sx={{mt:0.5}}>
            {[['firstName','First Name',4],['lastName','Last Name',4],['email','Email',4],['phone','Phone',4],['rollNumber','Roll Number',4],['dateOfBirth','Date of Birth',4]].map(([k,l,xs]) => (
              <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} type={k==='dateOfBirth'?'date':undefined} InputLabelProps={k==='dateOfBirth'?{shrink:true}:undefined} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} disabled={Boolean(editId) && k==='email'} /></Grid>
            ))}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small"><InputLabel>Class</InputLabel>
                <Select value={form.classroomId} onChange={e=>setForm(p=>({...p,classroomId:e.target.value}))} label="Class">
                  {classOptions.map(c => <MenuItem key={c._id} value={c._id}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small"><InputLabel>Gender</InputLabel>
                <Select value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))} label="Gender">
                  {['male','female','other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Blood Group" value={form.bloodGroup||''} onChange={e=>setForm(p=>({...p,bloodGroup:e.target.value}))} /></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} gutterBottom>Guardian Details</Typography></Grid>
            {[['name','Guardian Name',4],['phone','Phone',4],['email','Email',4]].map(([k,l,xs]) => (
              <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} value={form.guardians?.[0]?.[k]||''} onChange={e=>{ const g=[...form.guardians]; g[0]={...g[0],[k]:e.target.value}; setForm(p=>({...p,guardians:g})); }} /></Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={20} color="inherit"/> : (editId ? 'Update Student' : 'Enroll Student')}
          </Button>
        </DialogActions>
      </Dialog>

      <StudentPopup 
        studentId={popup} open={Boolean(popup)} onClose={()=>setPopup(null)} onEdit={handleOpenEdit} 
        onToggleStatus={(profile) => {
          if (window.confirm('Change student active status?')) toggleStudentMutation.mutate(profile);
        }}
      />
    </Box>
  );
}
