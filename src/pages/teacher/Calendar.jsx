import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight, Add } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarAPI, examAPI, leaveAPI } from '@/api/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths, isFuture } from 'date-fns';

const EVENT_COLORS = { holiday:'#E53935', weekend:'#9E9E9E', event:'#1565C0', exam:'#FF6F00', ptm:'#6A1B9A', festival:'#E91E63', other:'#607D8B' };

export default function TeacherCalendar() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });

  const leaveMutation = useMutation({
    mutationFn: d => leaveAPI.apply(d),
    onSuccess: () => { qc.invalidateQueries(['t-leaves']); setLeaveOpen(false); setLeaveForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' }); setLeaveError(''); },
    onError: err => setLeaveError(err.response?.data?.message || 'Failed to apply leave'),
  });

  const start = startOfMonth(currentMonth); const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const { data: evData } = useQuery({ queryKey:['calendar', format(start,'yyyy-MM')], queryFn:()=>calendarAPI.getEvents({ start:start.toISOString(), end:end.toISOString() }) });
  const { data: exData } = useQuery({ queryKey:['exams'], queryFn:()=>examAPI.getAll() });

  const events = evData?.data?.data || [];
  const exams = exData?.data?.data || [];
  const firstDayOffset = start.getDay();

  const getDayItems = (day) => {
    const evs = events.filter(e => {
      const s = new Date(e.startDate);
      s.setHours(0, 0, 0, 0);
      const en = e.endDate ? new Date(e.endDate) : new Date(s);
      en.setHours(23, 59, 59, 999);
      return day >= s && day <= en;
    });
    const exs = exams.filter(e => e.subjects?.some(s => s.date && isSameDay(new Date(s.date), day)));
    return { events:evs, exams:exs };
  };

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <IconButton onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}><ChevronLeft/></IconButton>
          <Typography variant="h5" fontWeight={700}>{format(currentMonth,'MMMM yyyy')}</Typography>
          <IconButton onClick={()=>setCurrentMonth(addMonths(currentMonth,1))}><ChevronRight/></IconButton>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setLeaveOpen(true)}>Apply Leave</Button>
      </Box>

      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, px: 1 }}>
            {Object.entries(EVENT_COLORS).map(([type, color]) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color }} />
                <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 600, color: 'text.secondary' }}>{type}</Typography>
              </Box>
            ))}
          </Box>

          <Grid container sx={{ mb:1 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
              <Grid item xs={12/7} key={d}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" display="block">{d}</Typography>
              </Grid>
            ))}
          </Grid>
          <Grid container>
            {Array.from({length:firstDayOffset}).map((_,i)=><Grid item xs={12/7} key={`e${i}`} sx={{minHeight:80}}/>)}
            {days.map(day => {
              const { events:dayEvs, exams:dayExs } = getDayItems(day);
              const isWknd = day.getDay() === 0;
              const isToday = isSameDay(day, new Date());
              const isHoliday = dayEvs.some(e => e.type === 'holiday' || e.type === 'weekend');
              const canApplyLeave = isFuture(day) && !isHoliday;
              return (
                <Grid item xs={12/7} key={day.toISOString()} sx={{minHeight:80, p:0.3}}>
                  <Box sx={{
                    height:'100%', minHeight:76, borderRadius:1.5, p:0.5,
                    bgcolor: isToday?'primary.main': day.getDay() === 0 ? 'action.hover' : 'transparent',
                    border:'1px solid transparent',
                    cursor: canApplyLeave ? 'pointer' : 'default',
                    '&:hover':{ bgcolor: isToday?'primary.main': canApplyLeave?'action.selected': day.getDay() === 0 ? 'action.hover' : 'transparent', transform: canApplyLeave ? 'scale(1.02)' : 'none' },
                    transition: 'all 0.2s ease',
                  }} 
                  onClick={() => {
                    if (canApplyLeave) {
                      setLeaveForm(p => ({ ...p, fromDate: format(day, 'yyyy-MM-dd'), toDate: format(day, 'yyyy-MM-dd') }));
                      setLeaveOpen(true);
                    }
                  }}>
                    <Typography variant="caption" fontWeight={isToday?800:400} sx={{ color:isToday?'#fff':isWknd?'error.main':'text.primary', display:'block', mb:0.3 }}>
                      {format(day,'d')}
                    </Typography>
                    {dayEvs.map(ev => {
                      const eventColor = EVENT_COLORS[ev.type] || ev.color || '#1565C0';
                      return (
                        <Box key={ev._id} sx={{ bgcolor: eventColor+'22', borderLeft:`3px solid ${eventColor}`, px:0.5, py:0.2, borderRadius:0.5, mb:0.2 }}>
                          <Typography sx={{ fontSize:10, fontWeight:600, color: eventColor, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</Typography>
                        </Box>
                      );
                    })}
                    {dayExs.map((ex,i)=>(
                      <Box key={i} sx={{ bgcolor:'#FF6F0022', borderLeft:'3px solid #FF6F00', px:0.5, py:0.2, borderRadius:0.5, mb:0.2 }}>
                        <Typography sx={{ fontSize:10, fontWeight:600, color:'#FF6F00', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>📝 {ex.title}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3, mt: 3 }}>
        <CardContent sx={{ p:3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>All Events This Month</Typography>
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
            {events.length===0 && exams.length===0 ? <Typography color="text.secondary">No events this month</Typography> : (
              <>
                {events.map(ev => {
                  const eventColor = EVENT_COLORS[ev.type] || ev.color || '#1565C0';
                  return (
                    <Chip key={ev._id} label={`${format(new Date(ev.startDate),'dd MMM')} — ${ev.title}`}
                      size="small" sx={{ bgcolor:eventColor+'15', color:eventColor, border:`1px solid ${eventColor}44`, fontWeight:600 }} />
                  );
                })}
                {exams.map(ex => (
                  <Chip key={ex._id} label={`Exam: ${ex.title}`}
                    size="small" sx={{ bgcolor:'#FF6F0015', color:'#FF6F00', border:`1px solid #FF6F0044`, fontWeight:600 }} />
                ))}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={leaveOpen} onClose={()=>setLeaveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Apply for Leave</DialogTitle>
        <DialogContent>
          {leaveError && <Alert severity="error" sx={{mb:2}}>{leaveError}</Alert>}
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small"><InputLabel>Leave Type</InputLabel>
                <Select value={leaveForm.leaveType} onChange={e=>setLeaveForm(p=>({...p,leaveType:e.target.value}))} label="Leave Type">
                  {['sick','casual','earned','medical','personal','other'].map(t=><MenuItem key={t} value={t} sx={{textTransform:'capitalize'}}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="From Date" InputLabelProps={{shrink:true}} value={leaveForm.fromDate} onChange={e=>setLeaveForm(p=>({...p,fromDate:e.target.value}))}/></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="To Date" InputLabelProps={{shrink:true}} value={leaveForm.toDate} onChange={e=>setLeaveForm(p=>({...p,toDate:e.target.value}))}/></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={3} value={leaveForm.reason} onChange={e=>setLeaveForm(p=>({...p,reason:e.target.value}))}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setLeaveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>leaveMutation.mutate(leaveForm)} disabled={leaveMutation.isPending}>
            {leaveMutation.isPending?<CircularProgress size={20} color="inherit"/>:'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
