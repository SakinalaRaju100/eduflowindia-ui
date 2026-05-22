import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, Avatar, Chip,
  IconButton, Divider, Button, DialogActions
} from '@mui/material';
import { Close, Edit, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_COLORS = {
  superadmin: '#6A1B9A', principal: '#1565C0',
  teacher: '#2E7D32', student: '#E65100', parent: '#00695C',
};

export default function UserProfilePopup({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>My Profile</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ textAlign: 'center', p: 3 }}>
        <Avatar
          src={user.photo}
          sx={{
            width: 90, height: 90, mx: 'auto', mb: 2, fontSize: 32,
            bgcolor: ROLE_COLORS[user.role] || 'primary.main',
            border: '3px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Avatar>
        <Typography variant="h5" fontWeight={800}>{user.firstName} {user.lastName}</Typography>
        <Typography color="text.secondary" gutterBottom>{user.email}</Typography>
        <Chip
          label={user.role?.toUpperCase()}
          size="small"
          sx={{
            height: 20, fontSize: 10, fontWeight: 700,
            bgcolor: `${ROLE_COLORS[user.role]}1A`,
            color: ROLE_COLORS[user.role],
            border: `1px solid ${ROLE_COLORS[user.role]}30`,
            mt: 1
          }}
        />
        <Divider sx={{ my: 2.5 }} />
        <Box sx={{ textAlign: 'left' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2" fontWeight={600}>{user.phone || 'Not provided'}</Typography></Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" color="text.secondary">School</Typography><Typography variant="body2" fontWeight={600}>{user.school?.name || 'N/A'}</Typography></Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" color="text.secondary">Last Login</Typography><Typography variant="body2" fontWeight={600}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</Typography></Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => handleNavigate('/change-password')}>Change Password</Button>
        <Button variant="outlined" color="error" startIcon={<Logout />} onClick={() => { onClose(); logout(); }}>Logout</Button>
      </DialogActions>
    </Dialog>
  );
}