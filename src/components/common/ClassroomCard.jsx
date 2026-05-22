import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  AvatarGroup,
  useTheme,
} from '@mui/material';
import { People, Subject, Room, Schedule, DateRange } from '@mui/icons-material';

export default function ClassroomCard({ classroom, onClick }) {
  const theme = useTheme();
  const colors = ['#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00695C', '#880E4F'];
  const color = colors[parseInt(classroom.grade || 0) % colors.length];

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`,
        transition: 'all 0.2s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${color}25` },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                {classroom.grade}
              </Typography>
            </Box>
            {(classroom.academicStartDate || classroom.academicEndDate) && (
              <Chip
                icon={<DateRange sx={{ fontSize: 14 }} />}
                size="small"
                label={`${classroom.academicStartDate ? new Date(classroom.academicStartDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'} - ${classroom.academicEndDate ? new Date(classroom.academicEndDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}`}
                sx={{
                  fontSize: 11,
                  height: 24,
                  bgcolor: `${color}15`,
                  color,
                  fontWeight: 600,
                  border: `1px solid ${color}30`,
                }}
              />
            )}
          </Box>
          <Chip
            label={`Section ${classroom.section}`}
            size="small"
            sx={{ fontWeight: 700, bgcolor: `${color}15`, color }}
          />
        </Box>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          {classroom.name || `Grade ${classroom.grade} - ${classroom.section}`}
        </Typography>

        {classroom.classTeacher && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Avatar
              src={classroom.classTeacher?.photo}
              sx={{ width: 22, height: 22, fontSize: 10, bgcolor: color }}
            >
              {classroom.classTeacher?.firstName?.[0]}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {classroom.classTeacher?.firstName} {classroom.classTeacher?.lastName}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <People sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {classroom.students?.length || 0} students
            </Typography>
          </Box>
          {classroom.roomNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Room sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Room {classroom.roomNumber}
              </Typography>
            </Box>
          )}
          {/* {(classroom.startTime || classroom.endTime) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{classroom.startTime || ''} - {classroom.endTime || ''}</Typography>
            </Box>
          )} */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Subject sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {classroom.subjects?.length || 0} subjects
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
