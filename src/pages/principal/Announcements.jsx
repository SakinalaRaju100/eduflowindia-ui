import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Delete, Edit, Campaign } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementAPI } from '@/api/client';
import { useOutletContext } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_ANN = {
  title: '',
  content: '',
  targetRoles: ['all'],
  priority: 'normal',
  academicYear: '',
};
const ROLES = ['all', 'principal', 'teacher', 'student', 'parent'];

export default function PrincipalAnnouncements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_ANN);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementAPI.getAll(),
  });
  const announcements = data?.data?.data || [];
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};

  const academicYears = user?.school?.academicYears || [
    { year: '2022-2023', startDate: '2022-04-01', endDate: '2023-03-31', isCurrent: false },
    { year: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: true },
  ];

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

  const mutation = useMutation({
    mutationFn: (d) => (editId ? announcementAPI.update(editId, d) : announcementAPI.create(d)),
    onSuccess: () => {
      qc.invalidateQueries(['announcements']);
      setOpen(false);
      setForm(EMPTY_ANN);
      setEditId(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save announcement'),
  });

  const delMutation = useMutation({
    mutationFn: (id) => announcementAPI.delete(id),
    onSuccess: () => qc.invalidateQueries(['announcements']),
  });

  const handleOpenEdit = (ann) => {
    setEditId(ann._id);
    setForm({
      title: ann.title || '',
      content: ann.content || '',
      targetRoles: ann.targetRoles?.length > 0 ? ann.targetRoles : ['all'],
      priority: ann.priority || 'normal',
      academicYear: ann.academicYear || '',
    });
    setOpen(true);
  };

  const handleRoleChange = (e) => {
    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
    if (val[val.length - 1] === 'all') {
      setForm((p) => ({ ...p, targetRoles: ['all'] }));
    } else {
      const newRoles = val.filter((v) => v !== 'all');
      setForm((p) => ({ ...p, targetRoles: newRoles.length === 0 ? ['all'] : newRoles }));
    }
  };

  const cols = [
    {
      key: 'title',
      label: 'Title',
      minWidth: 150,
      render: (r) => (
        <Typography variant="body2" fontWeight={700}>
          {r.title}
        </Typography>
      ),
    },
    {
      key: 'content',
      label: 'Content',
      minWidth: 200,
      render: (r) => (
        <Typography variant="caption" color="text.secondary">
          {r.content?.length > 60 ? r.content.substring(0, 60) + '...' : r.content}
        </Typography>
      ),
    },
    {
      key: 'targetRoles',
      label: 'Audience',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {r.targetRoles?.map((role) => (
            <Chip
              key={role}
              label={role}
              size="small"
              sx={{ textTransform: 'capitalize', fontSize: 10 }}
            />
          ))}
        </Box>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (r) => {
        const color =
          r.priority === 'urgent' ? 'error' : r.priority === 'important' ? 'warning' : 'default';
        return (
          <Chip
            label={r.priority}
            size="small"
            color={color}
            sx={{ textTransform: 'capitalize', fontSize: 10, fontWeight: 700 }}
          />
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) => (
        <Typography variant="caption">{format(new Date(r.createdAt), 'dd MMM yyyy')}</Typography>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(r)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                if (window.confirm('Delete this announcement?')) delMutation.mutate(r._id);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Campaign color="primary" /> Announcements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditId(null);
            setForm({ ...EMPTY_ANN, academicYear: selectedYear || '' });
            setOpen(true);
          }}
        >
          New Announcement
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <DataTable
              columns={cols}
              rows={filteredAnnouncements}
              loading={isLoading}
              searchKeys={['title', 'content']}
              searchPlaceholder="Search announcements..."
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editId ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={form.academicYear}
                  onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                  label="Academic Year"
                >
                  {academicYears.map((ay) => (
                    <MenuItem key={ay.year} value={ay.year}>
                      {ay.year} {ay.isCurrent ? '(Current)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  label="Priority"
                >
                  {['normal', 'important', 'urgent'].map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Audience</InputLabel>
                <Select
                  multiple
                  value={form.targetRoles}
                  onChange={handleRoleChange}
                  input={<OutlinedInput label="Target Audience" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role} sx={{ py: 0, minHeight: 32 }}>
                      <Checkbox checked={form.targetRoles.indexOf(role) > -1} size="small" />
                      <ListItemText
                        primary={role}
                        sx={{
                          textTransform: 'capitalize',
                          '& .MuiTypography-root': { fontSize: 14 },
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Content / Message"
                multiline
                rows={4}
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : editId ? (
              'Update'
            ) : (
              'Publish'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
