import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, LinearProgress, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '@/api/client';
import { ArrowForward, People, AttachMoney, Grade, CalendarMonth } from '@mui/icons-material';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['my-children'], queryFn: () => studentAPI.getMyChildren() });
  const children = data?.data?.data || [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>My Children</Typography>
      {isLoading && <Typography>Loading...</Typography>}
      {!isLoading && children.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No children linked to your account yet.</Typography>
            <Typography variant="caption" color="text.secondary">Contact your school administrator to link student accounts.</Typography>
          </CardContent>
        </Card>
      )}
      <Grid container spacing={2.5}>
        {children.map(child => (
          <Grid item xs={12} sm={6} lg={4} key={child._id}>
            <Card elevation={0} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 3, cursor: 'pointer',
              background: 'linear-gradient(135deg, #1565C010 0%, transparent 100%)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(21,101,192,0.15)' },
            }} onClick={() => navigate(`/parent/child/${child.userId?._id}/profile`)}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                  <Avatar src={child.userId?.photo} sx={{ width: 56, height: 56, fontSize: 20, fontWeight: 700, bgcolor: 'primary.main' }}>
                    {child.userId?.firstName?.[0]}{child.userId?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{child.userId?.firstName} {child.userId?.lastName}</Typography>
                    <Chip label={child.classroom?.name || '—'} size="small" color="primary" sx={{ mt: 0.3 }} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={`Roll: ${child.rollNumber}`} size="small" variant="outlined" />
                  <Chip label={`ID: ${child.studentId}`} size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">View full profile</Typography>
                  <ArrowForward sx={{ fontSize: 18, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
