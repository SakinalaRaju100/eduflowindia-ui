import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress, IconButton } from '@mui/material';
import { Add, ChevronLeft, ChevronRight, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarAPI } from '@/api/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, addMonths, subMonths, getDay } from 'date-fns';

const EVENT_COLORS = { holiday:'#E53935', weekend:'#9E9E9E', event:'#1565C0', exam:'#FF6F00', ptm:'#6A1B9A', festival:'#E91E63', other:'#607D8B' };

export default function PrincipalCalendar() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', startDate:'', endDate:'', type:'event', color:'#1565C0' });

  const start = startOfMonth(currentMonth); const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const { data } = useQuery({ queryKey:['calendar', format(start,'yyyy-MM'), format(end,'yyyy-MM')], queryFn:()=>calendarAPI.getEvents({ start: start.toISOString(), end: end.toISOString() }) });
  const events = data?.data?.data || [];

  const mutation = useMutation({
    mutationFn: d => calendarAPI.createEvent(d),
    onSuccess: () => { qc.invalidateQueries(['calendar']); setOpen(false); setError(''); setForm({ title:'', description:'', startDate:'', endDate:'', type:'event', color:'#1565C0' }); },
    onError: err => setError(err.response?.data?.message||'Failed'),
  });
  const delMutation = useMutation({ mutationFn: id => calendarAPI.deleteEvent(id), onSuccess: () => qc.invalidateQueries(['calendar']) });
console.log('events :>> ', events);
  const getDayEvents = (day) => events.filter(e => {
    const s = new Date(e.startDate);
    s.setHours(0, 0, 0, 0);
    const en = e.endDate ? new Date(e.endDate) : new Date(s);
    en.setHours(23, 59, 59, 999);
    return day >= s && day <= en;
  });

  const firstDayOffset = start.getDay();

  const handleGenerateWeekends = async () => {
    if (!window.confirm('make all Sundays as weekends for this month?')) return;
    setIsGenerating(true);

    try {
      const weekends = days.filter(d => getDay(d)==0 && d.getMonth() === currentMonth.getMonth());
      const toCreate = weekends.filter(w => {
        return !events.some(e => (e.type === 'weekend' || e.title === 'Weekend') && isSameDay(new Date(e.startDate), w));
      });

      if (toCreate.length === 0) {
        alert('Weekends are already generated for this month.');
        setIsGenerating(false);
        return;
      }

      await Promise.all(toCreate.map(d =>
        calendarAPI.createEvent({
          title: 'Weekend',
          description: 'Weekly day off',
          startDate: d.toISOString(),
          endDate: d.toISOString(),
          type: 'weekend',
          color: '#9E9E9E',
          targetRoles: ['all']
        })
      ));
      qc.invalidateQueries(['calendar']);
    } catch (err) {
      setError('Failed to generate some weekends.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <IconButton onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}><ChevronLeft/></IconButton>
          <Typography variant="h5" fontWeight={700}>{format(currentMonth,'MMMM yyyy')}</Typography>
          <IconButton onClick={()=>setCurrentMonth(addMonths(currentMonth,1))}><ChevronRight/></IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleGenerateWeekends} disabled={isGenerating}>
            {isGenerating ? <CircularProgress size={20} /> : 'Make Sundays as weekends for this month'}
          </Button>
          <Button variant="contained" startIcon={<Add/>} onClick={()=>{setForm({ title:'', description:'', startDate:'', endDate:'', type:'event', color:'#1565C0' }); setOpen(true);}}>Add Event</Button>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3, mb:3 }}>
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
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <Grid item xs={12/7} key={d}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" display="block">{d}</Typography>
              </Grid>
            ))}
          </Grid>
          <Grid container>
            {Array.from({length: firstDayOffset}).map((_,i) => <Grid item xs={12/7} key={`e${i}`} sx={{ minHeight:80 }} />)}
            {days.map(day => {
              const dayEvents = getDayEvents(day);
              const isWknd = day.getDay() === 0;
              const isToday = isSameDay(day, new Date());
              return (
                <Grid item xs={12/7} key={day.toISOString()} sx={{ minHeight:80, p:0.3 }}>
                  <Box sx={{
                    minHeight:76, borderRadius:1.5, p:0.5,
                    cursor: 'pointer',
                    bgcolor: isToday ? 'primary.main' : day.getDay() === 0 ? 'action.hover' : 'transparent',
                    border: isToday ? 'none' : '1px solid transparent',
                    '&:hover': { bgcolor: isToday ? 'primary.main' : 'action.selected' },
                  }}
                  onClick={() => {
                    const dStr = format(day, 'yyyy-MM-dd');
                    setForm({ title:'', description:'', startDate:dStr, endDate:dStr, type:'event', color:'#1565C0' });
                    setOpen(true);
                  }}>
                    <Typography variant="caption" fontWeight={isToday?800:400} sx={{ color: isToday?'#fff': isWknd?'error.main':'text.primary', display:'block', mb:0.3 }}>
                      {format(day,'d')}
                    </Typography>
                    {/* {console.log('dayEvents :>> ', dayEvents)} */}
                    {dayEvents.map(ev => {
                      const eventColor = EVENT_COLORS[ev.type] || ev.color || '#1565C0';
                      return (
                        <Box key={ev._id} sx={{ bgcolor: eventColor+'22', borderLeft:`3px solid ${eventColor}`, px:0.5, py:0.2, borderRadius:0.5, mb:0.2, cursor:'pointer' }}
                          onClick={(e) => { e.stopPropagation(); if(window.confirm(`Delete "${ev.title}"?`)) delMutation.mutate(ev._id); }}>
                          <Typography sx={{ fontSize:10, fontWeight:600, color: eventColor, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>All Events This Month</Typography>
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
            {events.length===0 ? <Typography color="text.secondary">No events this month</Typography> :
              events.map(ev => {
                const eventColor = EVENT_COLORS[ev.type] || ev.color || '#1565C0';
                return (
                  <Chip key={ev._id} label={`${format(new Date(ev.startDate),'dd MMM')} — ${ev.title}`}
                    size="small" sx={{ bgcolor:eventColor+'15', color:eventColor, border:`1px solid ${eventColor}44`, fontWeight:600 }}
                    onDelete={()=>delMutation.mutate(ev._id)} />
                );
              })}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add Calendar Event</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Title" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{shrink:true}} value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{shrink:true}} value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small"><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value,color:EVENT_COLORS[e.target.value]||'#607D8B'}))} label="Type">
                  {Object.keys(EVENT_COLORS).map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="color" label="Color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} InputLabelProps={{shrink:true}} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{p:2.5}}>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>mutation.mutate({...form,targetRoles:['all']})} disabled={mutation.isPending}>
            {mutation.isPending?<CircularProgress size={20} color="inherit"/>:'Add Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
