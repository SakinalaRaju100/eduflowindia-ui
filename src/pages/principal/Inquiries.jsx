import React from 'react';
import { Box, Typography, Card, CardContent, FormControl, Select, MenuItem } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import DataTable from '@/components/common/DataTable';
import { showSnackbar } from '@/components/common/ShowSnackbar';

export default function Inquiries() {
  const qc = useQueryClient();

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => api.get('/auth/inquiries'),
  });

  const inquiries = inquiriesData?.data?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/auth/inquiries/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['inquiries']);
      showSnackbar('Status updated successfully', 'success');
    },
    onError: () => showSnackbar('Failed to update status', 'error'),
  });

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'error';
      case 'contacted':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const cols = [
    {
      key: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      key: 'phone',
      label: 'Phone',
      minWidth: 120,
    },
    {
      key: 'email',
      label: 'Email',
      minWidth: 150,
      render: (r) => r.email || '—',
    },
    {
      key: 'message',
      label: 'Message',
      minWidth: 250,
      render: (r) => r.message || '—',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={r.status}
            onChange={(e) => handleStatusChange(r._id, e.target.value)}
            sx={{
              height: 32,
              fontSize: '0.875rem',
              color: `${getStatusColor(r.status)}.main`,
              fontWeight: 600,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${getStatusColor(r.status)}.main`,
              },
            }}
          >
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Student Inquiries
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <DataTable
            columns={cols}
            rows={inquiries}
            loading={isLoading}
            searchKeys={['name', 'phone', 'email']}
            searchPlaceholder="Search by name, phone or email..."
          />
        </CardContent>
      </Card>
    </Box>
  );
}
