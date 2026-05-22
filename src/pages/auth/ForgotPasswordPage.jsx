import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Stepper, Step, StepLabel } from '@mui/material';
import { School } from '@mui/icons-material';
import { authAPI } from '@/api/client';
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); const [email, setEmail] = useState(''); const [otp, setOtp] = useState(''); const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false);
  const sendOTP = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await authAPI.forgotPassword(email); setStep(1); } catch (err) { setError(err.response?.data?.message||'Failed'); } finally { setLoading(false); } };
  const resetPwd = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await authAPI.resetPassword({email,otp,newPassword}); setSuccess('Password reset! Redirecting...'); setTimeout(()=>navigate('/login'),2000); } catch(err){setError(err.response?.data?.message||'Failed');} finally{setLoading(false);} };
  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'background.default', p:2 }}>
      <Card sx={{ width:'100%', maxWidth:420 }}>
        <CardContent sx={{ p:4 }}>
          <Box sx={{ textAlign:'center', mb:3 }}><School color="primary" sx={{ fontSize:40, mb:1 }} /><Typography variant="h5" fontWeight={700}>Reset Password</Typography></Box>
          <Stepper activeStep={step} sx={{ mb:3 }}><Step><StepLabel>Email</StepLabel></Step><Step><StepLabel>New Password</StepLabel></Step></Stepper>
          {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb:2 }}>{success}</Alert>}
          {step === 0 ? (
            <form onSubmit={sendOTP}>
              <TextField fullWidth label="Registered Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} sx={{ mb:2 }} />
              <Button type="submit" fullWidth variant="contained" disabled={loading}>{loading?<CircularProgress size={22} color="inherit"/>:'Send OTP'}</Button>
            </form>
          ) : (
            <form onSubmit={resetPwd}>
              <TextField fullWidth label="OTP (6 digits)" required value={otp} onChange={e=>setOtp(e.target.value)} sx={{ mb:2 }} inputProps={{ maxLength:6, style:{letterSpacing:8,textAlign:'center',fontSize:24} }} />
              <TextField fullWidth label="New Password" type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} sx={{ mb:2 }} />
              <Button type="submit" fullWidth variant="contained" disabled={loading}>{loading?<CircularProgress size={22} color="inherit"/>:'Reset Password'}</Button>
            </form>
          )}
          <Typography variant="body2" color="primary" align="center" sx={{ mt:2, cursor:'pointer' }} onClick={()=>navigate('/login')}>Back to Login</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
