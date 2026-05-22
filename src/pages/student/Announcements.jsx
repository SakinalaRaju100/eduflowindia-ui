import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Chip, Divider } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementAPI } from '@/api/client';
import { format } from 'date-fns';
import { useOutletContext } from 'react-router-dom';

export default function StudentAnnouncements() {
  const qc = useQueryClient();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const { data: annData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementAPI.getAll(),
  });
  const announcements = annData?.data?.data || [];

  const readAnnMutation = useMutation({
    mutationFn: (id) => announcementAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['announcements']),
  });

  const filteredAnnouncements = useMemo(() => {
    if (!selectedYear) return announcements;
    return announcements.filter((a) => {
      if (a.academicYear) return a.academicYear === selectedYear;
      if (!a.createdAt) return true;

      const aDate = new Date(a.createdAt).getTime();
      if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate) {
        const start = new Date(selectedAcademicYearObject.startDate).setHours(0, 0, 0, 0);
        const end = new Date(selectedAcademicYearObject.endDate).setHours(23, 59, 59, 999);
        return aDate >= start && aDate <= end;
      } else {
        const startYear = parseInt(selectedYear.split('-')[0]);
        if (!isNaN(startYear)) {
          const start = new Date(startYear, 3, 1).getTime();
          const end = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
          return aDate >= start && aDate <= end;
        }
        return true;
      }
    });
  }, [announcements, selectedYear, selectedAcademicYearObject]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Announcements
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {filteredAnnouncements.length === 0 ? (
            <Typography color="text.secondary">No announcements for the selected year</Typography>
          ) : (
            filteredAnnouncements.map((a, i) => (
              <Box
                key={a._id}
                onClick={() => readAnnMutation.mutate(a._id)}
                sx={{ cursor: 'pointer', mb: 2 }}
              >
                {i > 0 && <Divider sx={{ mb: 2 }} />}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Chip
                    label={a.priority}
                    size="small"
                    color={
                      a.priority === 'urgent'
                        ? 'error'
                        : a.priority === 'important'
                          ? 'warning'
                          : 'default'
                    }
                    sx={{ flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.createdAt ? format(new Date(a.createdAt), 'dd MMM') : ''}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                      {a.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      — {a.createdBy?.firstName} {a.createdBy?.lastName} ({a.createdBy?.role})
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
