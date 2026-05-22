import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Avatar, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import { CheckCircle, Cancel, BeachAccess } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import api from '@/api/client'; // Adjust path if your axios client is located elsewhere

const STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
};

export default function PrincipalLeaves() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [action, setAction] = useState('approve'); 
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', statusFilter],
    queryFn: async () => {
      const res = await api.get('/leaves', { 
        params: statusFilter !== 'all' ? { status: statusFilter } : {} 
      });
      return res.data.data;
    }
  });

  const filteredLeaves = useMemo(() => {
    if (!selectedYear) return leaves;
    return leaves.filter(l => {
      if (l.academicYear) return l.academicYear === selectedYear;
      if (!l.fromDate) return true;
      
      const lDate = new Date(l.fromDate).getTime();
      if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate) {
        const start = new Date(selectedAcademicYearObject.startDate).setHours(0,0,0,0);
        const end = new Date(selectedAcademicYearObject.endDate).setHours(23,59,59,999);
        return lDate >= start && lDate <= end;
      } else {
        const startYear = parseInt(selectedYear.split('-')[0]);
        if (!isNaN(startYear)) {
          const start = new Date(startYear, 3, 1).getTime();
          const end = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();
          return lDate >= start && lDate <= end;
        }
        return true;
      }
    });
  }, [leaves, selectedYear, selectedAcademicYearObject]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, status, note }) => {
      const res = await api.patch(`/leaves/${id}/approve`, { status, approvalNote: note });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      handleClose();
    }
  });

  const handleOpenDialog = (leave, actionType) => {
    setSelectedLeave(leave);
    setAction(actionType);
    setApprovalNote('');
  };

  const handleClose = () => {
    setSelectedLeave(null);
    setApprovalNote('');
  };

  const handleSubmit = () => {
    if (selectedLeave) {
      approveMutation.mutate({ 
        id: selectedLeave._id, 
        status: action === 'approve' ? 'approved' : 'rejected', 
        note: approvalNote 
      });
    }
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BeachAccess color="primary" /> Leave Management
        </Typography>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 150 }}
        >
          <MenuItem value="all">All Leaves</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeaves.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No leaves found.</TableCell></TableRow>
              ) : (
                filteredLeaves.map((leave) => (
                  <TableRow key={leave._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={leave.applicant?.photo} sx={{ width: 32, height: 32 }}>
                          {leave.applicant?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {leave.applicant?.firstName} {leave.applicant?.lastName}
                          </Typography>
                          {leave.student && (
                            <Typography variant="caption" color="text.secondary">
                              For: {leave.student.firstName} {leave.student.lastName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={leave.applicantRole?.toUpperCase()} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{leave.leaveType}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200 }} noWrap>{leave.reason}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{leave.totalDays} Days</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={leave.status.toUpperCase()} size="small" color={STATUS_COLORS[leave.status]} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      {leave.status === 'pending' ? (
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleOpenDialog(leave, 'approve')}><CheckCircle fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => handleOpenDialog(leave, 'reject')}><Cancel fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Reviewed</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(selectedLeave)} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to {action} the leave application for <strong>{selectedLeave?.applicant?.firstName} {selectedLeave?.applicant?.lastName}</strong> 
            ({selectedLeave?.totalDays} days).
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks (Optional)"
            placeholder={`Enter any notes for ${action === 'approve' ? 'approval' : 'rejection'}...`}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color={action === 'approve' ? 'success' : 'error'} disabled={approveMutation.isPending} disableElevation>
            {approveMutation.isPending ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}