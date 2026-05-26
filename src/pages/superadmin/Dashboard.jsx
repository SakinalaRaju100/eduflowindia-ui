import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Avatar,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, School, People, Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminAPI } from '@/api/client';
import DataTable from '@/components/common/DataTable';
import StatCard from '@/components/common/StatCard';
import InstitutionForm from '@/components/common/InstitutionForm';

export default function SADashboard() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editInstitution, setEditInstitution] = useState(null);
  const [error, setError] = useState('');
  const { data: sd, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => superadminAPI.getInstitutions(),
  });
  const { data: statsData } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: () => superadminAPI.getStats(),
  });
  const schools = sd?.data?.data || [];
  const stats = statsData?.data?.data || {};

  const mutation = useMutation({
    mutationFn: (d) =>
      editInstitution
        ? superadminAPI.updateInstitution(editInstitution._id, d)
        : superadminAPI.createInstitution(d),
    onSuccess: () => {
      qc.invalidateQueries(['schools']);
      qc.invalidateQueries(['sa-stats']);
      setOpen(false);
      setEditInstitution(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed'),
  });
  const delMutation = useMutation({
    mutationFn: (id) => superadminAPI.deleteInstitution(id),
    onSuccess: () => qc.invalidateQueries(['schools']),
  });

  const openEdit = (s) => {
    setEditInstitution(s);
    setError('');
    setOpen(true);
  };

  const cols = [
    {
      key: 'name',
      label: 'Institution',
      minWidth: 200,
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}
          >
            {r.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {r.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'affiliationBoard',
      label: 'Board',
      render: (r) => <Chip label={r.affiliationBoard} size="small" variant="outlined" />,
    },
    {
      key: 'principalId',
      label: 'Principal',
      render: (r) => (r.principalId ? `${r.principalId.firstName} ${r.principalId.lastName}` : '—'),
    },
    { key: 'address.city', label: 'City', render: (r) => r.address?.city || '—' },
    { key: 'currentAcademicYear', label: 'Year' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <Chip
          label={r.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={r.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(r);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deactivate">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Deactivate?')) delMutation.mutate(r._id);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Institutions"
            value={stats.totalInstitutions}
            icon={<School />}
            color="#1565C0"
            loading={!statsData}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Active Institutions"
            value={stats.activeInstitutions}
            icon={<School />}
            color="#2E7D32"
            loading={!statsData}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="#6A1B9A"
            loading={!statsData}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Inactive"
            value={(stats.totalInstitutions || 0) - (stats.activeInstitutions || 0)}
            icon={<School />}
            color="#E65100"
            loading={!statsData}
          />
        </Grid>
      </Grid>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              All Institutions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditInstitution(null);
                setError('');
                setOpen(true);
              }}
            >
              Register New Institution
            </Button>
          </Box>
          <DataTable
            columns={cols}
            rows={schools}
            loading={isLoading}
            searchKeys={['name', 'email', 'address.city']}
            searchPlaceholder="Search schools..."
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" fontWeight={700}>
            {editInstitution ? 'Edit Institution' : 'Register New Institution'}
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <InstitutionForm
              initialData={editInstitution || {}}
              isNew={!editInstitution}
              existingIds={schools.map((s) => s.institutionUniqueId)}
              onSubmit={(data) => mutation.mutate(data)}
              isSubmitting={mutation.isPending}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
