import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  LinearProgress,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useOutletContext, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentFees() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const targetId = studentId || user?._id;
  const { selectedYear } = useOutletContext() || {};
  const { data, isLoading } = useQuery({
    queryKey: ['student-full', targetId],
    queryFn: () => studentAPI.getFullData(targetId),
    enabled: !!targetId,
  });
  const d = data?.data?.data;
  const profile = d?.profile;
  const studentUser = profile?.userId || user;
  const fees = d?.fees;
  const feeRecords = fees?.records || [];

  if (isLoading) return <Typography>Loading...</Typography>;

  const filteredFees = feeRecords.filter((f) => !selectedYear || f.academicYear === selectedYear);

  const totalExpected = filteredFees.reduce((acc, f) => acc + (f.totalAmount || 0), 0);
  const totalPaid = filteredFees.reduce(
    (acc, f) =>
      acc + (f.installments?.filter((i) => i.isPaid).reduce((s, i) => s + (i.amount || 0), 0) || 0),
    0,
  );
  const totalDue = totalExpected - totalPaid;
  const paidPct = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  const handleDownloadReceipt = (fee, inst) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192);
    doc.text('FEE RECEIPT', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student Name: ${studentUser?.firstName} ${studentUser?.lastName}`, 14, 40);
    doc.text(`Student ID: ${profile?.studentId || 'N/A'}`, 14, 48);
    doc.text(`Class: ${profile?.classroom?.name || 'N/A'}`, 14, 56);

    doc.text(`Fee Type: ${fee.feeType}`, 120, 40);
    doc.text(`Academic Year: ${fee.academicYear}`, 120, 48);
    doc.text(`Receipt No: ${inst.receiptNo || 'N/A'}`, 120, 56);
    doc.text(
      `Date Paid: ${inst.paidDate ? format(new Date(inst.paidDate), 'dd MMM yyyy') : 'N/A'}`,
      120,
      64,
    );

    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Amount (INR)']],
      body: [[`Installment ${inst.installmentNo} Payment`, `Rs. ${inst.amount?.toLocaleString()}`]],
      foot: [['Total Paid', `Rs. ${inst.amount?.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192] },
      footStyles: { fillColor: [230, 240, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save(`FeeReceipt_${studentUser?.firstName}_${fee.feeType}_Inst${inst.installmentNo}.pdf`);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Fee Details
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              textAlign: 'center',
              p: 2,
              background: 'linear-gradient(135deg,#E8F5E9,#F1F8E9)',
            }}
          >
            <Typography variant="h4" fontWeight={800} color="success.main">
              ₹{totalPaid.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Paid
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              textAlign: 'center',
              p: 2,
              background: 'linear-gradient(135deg,#FFEBEE,#FFF3E0)',
            }}
          >
            <Typography variant="h4" fontWeight={800} color="error.main">
              ₹{totalDue.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Outstanding Due
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Payment Progress
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {paidPct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={paidPct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: paidPct >= 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Card>
        </Grid>
      </Grid>

      {filteredFees.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No fee records found.</Typography>
          </CardContent>
        </Card>
      ) : (
        filteredFees.map((fee) => (
          <Card
            key={fee._id}
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2.5 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {fee.feeType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Academic Year: {fee.academicYear}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={fee.status}
                    size="small"
                    color={
                      fee.status === 'paid'
                        ? 'success'
                        : fee.status === 'overdue'
                          ? 'error'
                          : fee.status === 'partial'
                            ? 'warning'
                            : 'default'
                    }
                  />
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
                    ₹{fee.totalAmount?.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Installment</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Due Date</TableCell>
                      <TableCell align="center">Paid Date</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Receipt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fee.installments?.map((inst) => (
                      <TableRow key={inst.installmentNo}>
                        <TableCell>Installment {inst.installmentNo}</TableCell>
                        <TableCell align="right">₹{inst.amount?.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          {inst.dueDate ? format(new Date(inst.dueDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {inst.paidDate ? format(new Date(inst.paidDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={inst.isPaid ? 'Paid' : 'Pending'}
                            size="small"
                            color={inst.isPaid ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {inst.isPaid ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {inst.receiptNo || 'Paid'}
                              </Typography>
                              <Tooltip title="Download Receipt">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleDownloadReceipt(fee, inst)}
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
