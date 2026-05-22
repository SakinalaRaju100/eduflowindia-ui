import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Select, MenuItem, FormControl, InputLabel, Divider, TextField, IconButton, Avatar, CircularProgress, Alert, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { COLOR_THEMES } from '@/theme/themes';
import { PhotoCamera, Delete, Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';

export default function PrincipalSettings() {
  const { user, updatePreferences } = useAuth();
  const qc = useQueryClient();
  const [themeColor, setThemeColor] = useState(user?.preferences?.themeColor || 'blue');
  const [themeMode, setThemeMode] = useState(user?.preferences?.theme || 'light');
  const [viewImage, setViewImage] = useState(null);

  const save = () => updatePreferences({ theme: themeMode, themeColor });

  const { data: schoolData, isLoading } = useQuery({
    queryKey: ['my-school'],
    queryFn: () => api.get('/principal/school-profile').then(res => res.data.data),
  });

  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '', affiliationBoard: 'CBSE', affiliationNumber: '',
    address: { street: '', city: '', state: '', country: 'India', pincode: '' },
    logo: null, images: []
  });

  useEffect(() => {
    if (schoolData) {
      setForm({
        name: schoolData.name || '', email: schoolData.email || '', phone: schoolData.phone || '',
        website: schoolData.website || '', affiliationBoard: schoolData.affiliationBoard || 'CBSE',
        affiliationNumber: schoolData.affiliationNumber || '',
        address: {
          street: schoolData.address?.street || '', city: schoolData.address?.city || '',
          state: schoolData.address?.state || '', country: schoolData.address?.country || 'India',
          pincode: schoolData.address?.pincode || '',
        },
        logo: schoolData.logo || null, 
        images: schoolData.images || []
      });
    }
  }, [schoolData]);

  const [msg, setMsg] = useState(null);

  const mutation = useMutation({
    mutationFn: (d) => api.put('/principal/school-profile', d),
    onSuccess: () => {
      qc.invalidateQueries(['my-school']);
      setMsg({ type: 'success', text: 'School profile updated successfully' });
    },
    onError: (err) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update school profile' })
  });

  const handleChange = (k, v) => {
    const keys = k.split('.');
    setForm(p => keys.length === 1 ? { ...p, [keys[0]]: v } : { ...p, [keys[0]]: { ...p[keys[0]], [keys[1]]: v } });
  };

  const handleImageUpload = (e, type) => { // upload to s3 or drive links
    // const files = Array.from(e.target.files);
    // if (!files.length) return;
    // files.forEach(file => {
    //   if (file.size > 2 * 1024 * 1024) return alert('File size should be less than 2MB');
    //   const reader = new FileReader();
    //   reader.onload = (ev) => {
    //     if (type === 'logo') setForm(p => ({ ...p, logo: ev.target.result }));
    //     else if (type === 'images') setForm(p => {
    //       if (p.images.length >= 3) { alert('Maximum 3 images allowed.'); return p; }
    //       return { ...p, images: [...p.images, ev.target.result] };
    //     });
    //   };
    //   reader.readAsDataURL(file);
    // });
  };

  const removeImage = (index) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Settings</Typography>
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3, mb:3 }}>
        <CardContent sx={{ p:3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Theme</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Mode</InputLabel>
                <Select value={themeMode} onChange={e => setThemeMode(e.target.value)} label="Mode">
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Color Theme</Typography>
              <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                {Object.entries(COLOR_THEMES).map(([key, val]) => (
                  <Box key={key} onClick={() => setThemeColor(key)} sx={{
                    width:36, height:36, borderRadius:2, bgcolor: val.primary, cursor:'pointer',
                    border: themeColor === key ? '3px solid white' : '3px solid transparent',
                    boxShadow: themeColor === key ? `0 0 0 2px ${val.primary}` : 'none',
                    transition:'all 0.15s ease', '&:hover':{ transform:'scale(1.15)' }
                  }} />
                ))}
              </Box>
            </Grid>
          </Grid>
          <Button variant="contained" sx={{ mt:2 }} onClick={save}>Save Theme</Button>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3 }}>
        <CardContent sx={{ p:3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>School Profile Settings</Typography>
          {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
          {isLoading ? <CircularProgress /> : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>School Logo</Typography>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={form.logo} variant="rounded"
                    sx={{ width: 120, height: 120, mb: 1, bgcolor: 'background.default', border: '1px dashed grey', cursor: form.logo ? 'pointer' : 'default' }}
                    onClick={() => form.logo && setViewImage(form.logo)}
                  />
                  <IconButton component="label" sx={{ position: 'absolute', bottom: 0, right: -10, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.default' } }}>
                    <PhotoCamera fontSize="small" />
                    <input hidden accept="image/*" type="file" onChange={e => handleImageUpload(e, 'logo')} />
                  </IconButton>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  {[['name','School Name',12],['email','School Email',6],['phone','Phone',6],['website','Website',6],['affiliationNumber','Affiliation Number',6]].map(([k,l,xs]) => (
                    <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} value={form[k]} onChange={e=>handleChange(k, e.target.value)} /></Grid>
                  ))}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Board</InputLabel>
                      <Select value={form.affiliationBoard} onChange={e=>handleChange('affiliationBoard', e.target.value)} label="Board">
                        {['CBSE','ICSE','State Board','IB','Cambridge','Other'].map(b=><MenuItem key={b} value={b}>{b}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Address</Typography>
                <Grid container spacing={2}>
                  {[['address.street','Street',12],['address.city','City',4],['address.state','State',4],['address.pincode','Pincode',4]].map(([k,l,xs]) => (
                    <Grid item xs={12} sm={xs} key={k}><TextField fullWidth size="small" label={l} value={k.split('.').reduce((o,kk)=>o?.[kk], form) || ''} onChange={e=>handleChange(k, e.target.value)} /></Grid>
                  ))}
                </Grid>
                
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>School Images (Max 3)</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  {form.images.map((img, i) => (
                    <Box key={i} sx={{ position: 'relative' }}>
                      <Box
                        component="img" src={img}
                        sx={{ width: 120, height: 80, borderRadius: 2, objectFit: 'cover', border: '1px solid #ddd', cursor: 'pointer' }}
                        onClick={() => setViewImage(img)}
                      />
                      <IconButton size="small" color="error" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.default' } }} onClick={() => removeImage(i)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {form.images.length < 3 && (
                    <Button component="label" variant="outlined" sx={{ width: 120, height: 80, borderStyle: 'dashed', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <PhotoCamera fontSize="small" />
                        <Typography variant="caption">Upload</Typography>
                      </Box>
                      <input hidden accept="image/*" type="file" multiple onChange={e => handleImageUpload(e, 'images')} />
                    </Button>
                  )}
                </Box>

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                  <Button variant="contained" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                    {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save School Profile'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewImage)} onClose={() => setViewImage(null)} maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
          <Typography variant="h6" fontWeight={700}>Image Preview</Typography>
          <IconButton onClick={() => setViewImage(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0.5 }}>
          <Box component="img" src={viewImage} alt="School" sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
