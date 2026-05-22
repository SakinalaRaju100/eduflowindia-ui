import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, CircularProgress, Chip, Divider, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, School, Email, Lock } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
const ROLE_HOME = { superadmin: '/superadmin', principal: '/principal', teacher: '/teacher', student: '/student/profile', parent: '/parent' };
const DEMO = [
  { role: 'Superadmin', email: 'superadmin@edu.com', pwd: 'Superadmin@123', color: '#6A1B9A' },
  { role: 'Principal', email: 'principal@greenwood.edu', pwd: 'Principal@123', color: '#1565C0' },
  { role: 'Teacher', email: 'anjali@greenwood.edu', pwd: 'Teacher@1234', color: '#2E7D32' },
  { role: 'Student', email: 'aarav.gupta@student.greenwood.edu', pwd: 'Student@1234', color: '#E65100' },
  { role: 'Parent', email: 'parent@greenwood.edu', pwd: 'Parent@1234', color: '#00695C' },
];
export default function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const theme = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const r = await login(form.email, form.password); if (r.isFirstLogin) { navigate('/change-password'); return; } navigate(ROLE_HOME[r.user.role] || '/login'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg,#0F1117,#1A1E2E)' : 'linear-gradient(135deg,#EEF2FF,#E0F2FE,#F0FDF4)' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#1565C0 0%,#0288D1 60%,#00BCD4 100%)', position: 'relative', overflow: 'hidden' }}>
        {[300,200,150,100,80].map((s,i) => <Box key={i} sx={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', top:['10%','60%','20%','75%','40%'][i], left:['60%','-5%','30%','70%','80%'][i] }} />)}
        <Box sx={{ textAlign: 'center', color: '#fff', zIndex: 1, px: 4 }}>
          <Box sx={{ width:80, height:80, borderRadius:4, bgcolor:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', mx:'auto', mb:3 }}><School sx={{ fontSize: 44 }} /></Box>
          <Typography variant="h3" fontWeight={800} sx={{ fontFamily:"'DM Serif Display',serif", mb:1 }}>EduFlow</Typography>
          <Typography variant="h6" sx={{ opacity:0.85, fontWeight:400, mb:4 }}>School Management System</Typography>
          {['Multi-role access control','Real-time attendance tracking','Comprehensive fee management','Smart academic calendar','Parent-teacher communication'].map(f => (
            <Box key={f} sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
              <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'#fff', flexShrink:0 }} />
              <Typography variant="body2" sx={{ opacity:0.85, textAlign:'left' }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: { xs:1, md:0.55 }, display:'flex', alignItems:'center', justifyContent:'center', p:3 }}>
        <Box sx={{ width:'100%', maxWidth:420 }}>
          <Box sx={{ mb:4, textAlign:'center' }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>Welcome Back</Typography>
            <Typography color="text.secondary">Sign in to your account</Typography>
          </Box>
          <Card elevation={theme.palette.mode === 'dark' ? 0 : 3} sx={{ border:`1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p:4 }}>
              <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
                <TextField fullWidth label="Email Address" type="email" required value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} sx={{ mb:2 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color:'text.secondary', fontSize:20 }} /></InputAdornment> }} />
                <TextField fullWidth label="Password" required type={showPwd?'text':'password'} value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} sx={{ mb:3 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color:'text.secondary', fontSize:20 }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={()=>setShowPwd(p=>!p)}>{showPwd?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment> }} />
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py:1.5, fontSize:15, fontWeight:700, mb:2 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
                <Typography variant="body2" color="primary" align="center" sx={{ cursor:'pointer','&:hover':{textDecoration:'underline'} }} onClick={()=>navigate('/forgot-password')}>Forgot password?</Typography>
              </form>
            </CardContent>
          </Card>
          <Box sx={{ mt:3 }}>
            <Divider sx={{ mb:2 }}><Typography variant="caption" color="text.secondary">Demo Credentials</Typography></Divider>
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:1, justifyContent:'center' }}>
              {DEMO.map(c => <Chip key={c.role} label={c.role} size="small" onClick={()=>setForm({email:c.email,password:c.pwd})}
                sx={{ fontWeight:600, bgcolor:`${c.color}15`, color:c.color, border:`1px solid ${c.color}30`, cursor:'pointer','&:hover':{bgcolor:`${c.color}25`} }} />)}
            </Box>
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt:1 }}>Click any role to auto-fill credentials</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
