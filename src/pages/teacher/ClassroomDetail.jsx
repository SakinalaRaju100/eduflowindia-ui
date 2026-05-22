import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip, Card, CardContent, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress, Divider, Grid } from '@mui/material';
import { ArrowBack, People, Room, Subject, Add, Edit, Delete, Schedule, DateRange } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomAPI, studentAPI } from '@/api/client';
import AttendanceMarker from '@/components/common/AttendanceMarker';
import StudentPopup from '@/components/common/StudentPopup';

export default function TeacherClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [editDiaryId, setEditDiaryId] = useState(null);
  const [diaryForm, setDiaryForm] = useState({ content: '', homework: '', subject: '', date: new Date().toISOString().split('T')[0] });
  const [diaryError, setDiaryError] = useState('');

  const { data, isLoading } = useQuery({ queryKey:['classroom',id], queryFn:()=>classroomAPI.getById(id) });
  const classroom = data?.data?.data;
  const students = classroom?.students || [];

  const { data: diaryData } = useQuery({ queryKey:['diary',id], queryFn:()=>studentAPI.getDiaryNotes({ classroomId:id }) });
  const diaryNotes = diaryData?.data?.data || [];

  const diaryMutation = useMutation({
    mutationFn: d => editDiaryId ? studentAPI.updateDiaryNote(editDiaryId, d) : studentAPI.createDiaryNote(d),
    onSuccess: () => { qc.invalidateQueries(['diary',id]); setDiaryOpen(false); setDiaryForm({ content: '', homework: '', subject: '', date: new Date().toISOString().split('T')[0] }); setEditDiaryId(null); },
    onError: err => setDiaryError(err.response?.data?.message||'Failed'),
  });

  const delDiaryMutation = useMutation({
    mutationFn: noteId => studentAPI.deleteDiaryNote(noteId),
    onSuccess: () => qc.invalidateQueries(['diary', id]),
  });

  const handleAddNote = () => {
    setEditDiaryId(null);
    setDiaryForm({ content: '', homework: '', subject: 'Diary', date: new Date().toISOString().split('T')[0] });
    setDiaryOpen(true);
  };

  const handleEditNote = (note) => {
    setEditDiaryId(note._id);
    setDiaryForm({ content: note.content || '', homework: note.homework || '', subject: note.subject || 'Diary', date: note.date ? new Date(note.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] });
    setDiaryOpen(true);
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!classroom) return <Typography>Classroom not found</Typography>;

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:3 }}>
        <IconButton onClick={()=>navigate('/teacher/classes')}><ArrowBack/></IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>{classroom.name}</Typography>
          <Box sx={{ display:'flex', gap:1, mt:0.5, flexWrap:'wrap' }}>
            {classroom.roomNumber && <Chip icon={<Room sx={{fontSize:14}}/>} label={`Room ${classroom.roomNumber}`} size="small"/>}
            <Chip icon={<People sx={{fontSize:14}}/>} label={`${students.length} Students`} size="small" color="primary"/>
            <Chip icon={<Subject sx={{fontSize:14}}/>} label={`${classroom.subjects?.length||0} Subjects`} size="small"/>
            {classroom.classTeacher && <Chip label={`${classroom.classTeacher.firstName} ${classroom.classTeacher.lastName}`} size="small" color="success"/>}
            {(classroom.startTime || classroom.endTime) && <Chip icon={<Schedule sx={{fontSize:14}}/>} label={`${classroom.startTime || '—'} to ${classroom.endTime || '—'}`} size="small" color="info" />}
            {(classroom.academicStartDate || classroom.academicEndDate) && <Chip icon={<DateRange sx={{fontSize:14}}/>} label={`${classroom.academicStartDate ? new Date(classroom.academicStartDate).toLocaleDateString() : '—'} - ${classroom.academicEndDate ? new Date(classroom.academicEndDate).toLocaleDateString() : '—'}`} size="small" color="secondary"/>}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:2 }}>
            <CardContent sx={{ p:2 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Attendance</Typography>
              <AttendanceMarker classroomId={id} students={students}/>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
            <CardContent sx={{ p:3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                <Typography variant="h6" fontWeight={700} sx={{fontSize: 12 }}>Diary Notes</Typography>
                <Button size="small" variant="outlined" sx={{fontSize: 12 }} startIcon={<Add/>} onClick={handleAddNote}>Add Diary Note</Button>
              </Box>
              {diaryNotes.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No diary notes yet.</Typography>
              ) : diaryNotes.map((n) => (
                <Box key={n._id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', position: 'relative', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="primary">{n.subject || 'General'}</Typography>
                      <Typography variant="caption" color="text.secondary">{n.date ? new Date(n.date).toLocaleDateString() : ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, opacity: 0.8, '&:hover': { opacity: 1 } }}>
                      <IconButton size="small" onClick={() => handleEditNote(n)}><Edit sx={{ fontSize: 18 }} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { if(window.confirm('Delete this diary note?')) delDiaryMutation.mutate(n._id); }}><Delete sx={{ fontSize: 18 }} /></IconButton>
                    </Box>
                  </Box>
                  {n.content && (
                    <Box sx={{ display: 'flex', p: 0.5, my: 0.5, bgcolor: 'success.main', borderRadius: 0.5 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>CW: {n.content}</Typography>
                    </Box>
                  )}
                  {n.homework && (
                    <Box sx={{ display: 'flex', px: 1, py: 0.5, bgcolor: 'warning.main', borderRadius: 0.5 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>HW: {n.homework}</Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={diaryOpen} onClose={()=>setDiaryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editDiaryId ? 'Edit Diary Note' : 'Add Diary Note'}</DialogTitle>
        <DialogContent>
          {diaryError && <Alert severity="error" sx={{mb:2}}>{diaryError}</Alert>}
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
            <TextField
              type="date"
              label="Date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={diaryForm.date}
              onChange={(e) => setDiaryForm(p => ({ ...p, date: e.target.value }))}
            />
            <TextField size="small" label="Subject" value={diaryForm.subject} onChange={e=>setDiaryForm(p=>({...p,subject:e.target.value}))}/>
            <TextField size="small" label="Note / Classwork" multiline rows={3} value={diaryForm.content} onChange={e=>setDiaryForm(p=>({...p,content:e.target.value}))}/>
            <TextField size="small" label="Homework" multiline rows={2} value={diaryForm.homework} onChange={e=>setDiaryForm(p=>({...p,homework:e.target.value}))}/>
          </Box>
        </DialogContent>
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setDiaryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>diaryMutation.mutate({ ...diaryForm, classroom:id })} disabled={diaryMutation.isPending}>
            {diaryMutation.isPending ? <CircularProgress size={20} color="inherit"/> : (editDiaryId ? 'Update Note' : 'Save Note')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
