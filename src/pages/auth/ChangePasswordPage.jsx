import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { School, Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
const ROLE_HOME = { superadmin:'/superadmin', principal:'/principal', teacher:'/teacher', student:'/student/profile', parent:'/parent' };
export default function ChangePasswordPage() {
  const { user, setUser, loading: authLoading } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [show, setShow] = useState({}); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Min 8 characters'); return; }
    setLoading(true); setError('');
    try { 
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }); 
      setUser({ ...user, isFirstLogin: false });
      navigate(ROLE_HOME[user?.role] || '/'); 
    }
    catch (err) { setError(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  if (authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'background.default', p:2 }}>
      <Card sx={{ width:'100%', maxWidth:420 }}>
        <CardContent sx={{ p:4 }}>
          <Box sx={{ textAlign:'center', mb:3 }}><School color="primary" sx={{ fontSize:40, mb:1 }} />
            <Typography variant="h5" fontWeight={700}>{user?.isFirstLogin ? 'Set Your Password' : 'Change Password'}</Typography>
            {user?.isFirstLogin && <Typography color="text.secondary" variant="body2" sx={{ mt:1 }}>Please set a new password to continue</Typography>}
          </Box>
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
            {!user?.isFirstLogin && (
              <TextField fullWidth label="Current Password" type={show.currentPassword?'text':'password'} required value={form.currentPassword} onChange={e=>setForm(p=>({...p,currentPassword:e.target.value}))} sx={{ mb:2 }}
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={()=>setShow(p=>({...p,currentPassword:!p.currentPassword}))}>{show.currentPassword?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment> }} />
            )}
            <TextField fullWidth label="New Password" type={show.newPassword?'text':'password'} required value={form.newPassword} onChange={e=>setForm(p=>({...p,newPassword:e.target.value}))} sx={{ mb:2 }}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={()=>setShow(p=>({...p,newPassword:!p.newPassword}))}>{show.newPassword?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment> }} />
            <TextField fullWidth label="Confirm New Password" type={show.confirmPassword?'text':'password'} required value={form.confirmPassword} onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))} sx={{ mb:3 }}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={()=>setShow(p=>({...p,confirmPassword:!p.confirmPassword}))}>{show.confirmPassword?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment> }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
