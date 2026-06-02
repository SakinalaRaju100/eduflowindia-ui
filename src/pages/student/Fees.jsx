import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { studentAPI } from '@/api/client';
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
  const qc = useQueryClient();

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInstForPay, setSelectedInstForPay] = useState(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentProof, setPaymentProof] = useState(null);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const submitPaymentMutation = useMutation({
    mutationFn: async ({ feeId, installmentNo, file, method }) => {
      const formData = new FormData();
      formData.append('proof', file);
      formData.append('method', method);
      return api.post(`/fees/${feeId}/installment/${installmentNo}/pay`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(['student-full', targetId]);
      setPayDialogOpen(false);
      setSnackbarSeverity('success');
      setSnackbarMsg('Payment proof submitted successfully! Verification pending by Principal.');
    },
    onError: (err) => {
      setSnackbarSeverity('error');
      setSnackbarMsg(err.response?.data?.message || 'Failed to submit payment proof.');
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['student-full', targetId],
    queryFn: () => studentAPI.getFullData(targetId),
    enabled: !!targetId,
  });

  const paymentProofPreview = React.useMemo(() => {
    if (paymentProof) {
      return URL.createObjectURL(paymentProof);
    }
    return null;
  }, [paymentProof]);

  const d = data?.data?.data;
  const profile = d?.profile;
  const studentUser = profile?.userId || user;
  const fees = d?.fees;
  const feeRecords = fees?.records || [];

  if (isLoading) return <Typography>Loading...</Typography>;

  const filteredFees = feeRecords
    .filter((f) => !selectedYear || f.academicYear === selectedYear)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const school =
    (typeof user?.institution === 'object' ? user.institution : profile?.institution) || {};
  const paymentDetails = school.paymentDetails || {};

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
    <Box sx={{ m: 1 }}>
      {/* <Typography variant="h5" fontWeight={700} gutterBottom>
        Fee Details
      </Typography> */}

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
                      <TableCell>Receipt / Action</TableCell>
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
                            label={
                              inst.status === 'under verification'
                                ? 'Under Verification'
                                : inst.isPaid
                                  ? 'Paid'
                                  : 'Pending'
                            }
                            size="small"
                            color={
                              inst.status === 'under verification'
                                ? 'warning'
                                : inst.isPaid
                                  ? 'success'
                                  : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {inst.status === 'under verification' ? (
                            <Typography variant="caption" color="warning.main" fontWeight={700}>
                              Under Verification
                            </Typography>
                          ) : inst.isPaid ? (
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
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              sx={{ textTransform: 'none' }}
                              onClick={() => {
                                setSelectedInstForPay({ fee, inst });
                                setPaymentStep(1);
                                setPaymentMethod('upi');
                                setPaymentProof(null);
                                setPayDialogOpen(true);
                              }}
                            >
                              Pay
                            </Button>
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

      {/* Payment Popup */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Pay Fee Installment</DialogTitle>
        <Divider />
        <DialogContent>
          {paymentStep === 1 ? (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Amount to Pay: ₹{selectedInstForPay?.inst?.amount?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select Payment Method
              </Typography>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ mt: 1 }}
              >
                <FormControlLabel
                  value="upi"
                  control={<Radio />}
                  label={`UPI (UPI ID: ${paymentDetails.upiId || 'Not provided'})`}
                />
                <FormControlLabel value="qr" control={<Radio />} label="Scan QR Code" />
                <FormControlLabel
                  value="bank"
                  control={<Radio />}
                  label={`Bank Transfer (A/C: ${paymentDetails.bankAccountNumber || 'Not provided'}, IFSC: ${paymentDetails.ifscCode || 'Not provided'})`}
                />
                {paymentDetails.upiNumber && (
                  <FormControlLabel
                    value="mobile"
                    control={<Radio />}
                    label={`Mobile Number (${paymentDetails.upiNumber})`}
                  />
                )}
              </RadioGroup>

              {paymentMethod === 'qr' && (
                <Box
                  sx={{
                    mt: 3,
                    textAlign: 'center',
                    p: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  {paymentDetails.upiQrCode ? (
                    <Box
                      component="img"
                      src={paymentDetails.upiQrCode}
                      alt="School QR Code"
                      sx={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 1 }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 4, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      [ QR Code Image Placeholder ]
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" mt={1}>
                    Scan this QR code with any UPI app (GPay, PhonePe, Paytm, etc.)
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Upload Payment Proof
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Please upload the screenshot or receipt of your successful payment for verification
                by the principal.
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, borderStyle: 'dashed' }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={(e) => setPaymentProof(e.target.files[0])}
                  accept="image/*,.pdf"
                />
              </Button>
              {paymentProof && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  {paymentProof.type.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={paymentProofPreview}
                      alt="Payment Proof Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ) : paymentProof.type === 'application/pdf' ? (
                    <iframe
                      src={paymentProofPreview}
                      title="Payment Proof PDF"
                      width="100%"
                      height="200px"
                      style={{ border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  ) : null}
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 1, color: 'success.main', fontWeight: 600 }}
                  >
                    File Selected: {paymentProof.name}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>
          {paymentStep === 1 ? (
            <Button variant="contained" onClick={() => setPaymentStep(2)}>
              Proceed to Pay
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              disabled={!paymentProof || submitPaymentMutation.isPending}
              onClick={() => {
                submitPaymentMutation.mutate({
                  feeId: selectedInstForPay?.fee?._id,
                  installmentNo: selectedInstForPay?.inst?.installmentNo,
                  file: paymentProof,
                  method: paymentMethod,
                });
              }}
            >
              {submitPaymentMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Submit for Verification'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={5000}
        onClose={() => setSnackbarMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarMsg('')}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
