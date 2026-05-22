import React from 'react';
import { Box, Typography, Card, CardContent, Chip, IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { salaryAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/common/DataTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TeacherSalaries() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['t-salaries', user?._id],
    queryFn: () => salaryAPI.getAll({ teacherId: user?._id }),
    enabled: !!user?._id,
  });

  const mySalaries = data?.data?.data || [];

  const handleDownload = (record) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192); // Primary Blue
    doc.text('PAYSLIP', 105, 20, { align: 'center' });

    // Employee & Period Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee Name: ${user?.firstName} ${user?.lastName}`, 14, 40);
    doc.text(`Email: ${user?.email || 'N/A'}`, 14, 48);
    doc.text(`Salary Period: ${record.month} ${record.year}`, 120, 40);
    doc.text(`Status: ${record.status.toUpperCase()}`, 120, 48);

    // Salary Table
    autoTable(doc, {
      startY: 60,
      head: [['Earnings / Deductions', 'Amount (INR)']],
      body: [
        ['Base Salary', `Rs. ${record.baseSalary?.toLocaleString()}`],
        ['Allowances', `Rs. ${(record.allowances || 0).toLocaleString()}`],
        ['Deductions', `Rs. ${(record.deductions || 0).toLocaleString()}`],
      ],
      foot: [['Net Salary', `Rs. ${record.netSalary?.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192] },
      footStyles: { fillColor: [230, 240, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save(`Payslip_${user?.firstName}_${record.month}_${record.year}.pdf`);
  };

  const cols = [
    {
      key: 'period',
      label: 'Month/Year',
      render: (r) => (
        <Typography variant="body2" fontWeight={600}>
          {r.month} {r.year}
        </Typography>
      ),
    },
    {
      key: 'baseAndAllowances',
      label: 'Base + Allowances',
      render: (r) => `₹${(r.baseSalary + (r.allowances || 0)).toLocaleString()}`,
    },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (r) => `₹${(r.deductions || 0).toLocaleString()}`,
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (r) => (
        <Typography variant="body2" color="primary" fontWeight={700}>
          ₹{r.netSalary?.toLocaleString()}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Chip
          label={r.status}
          size="small"
          color={r.status === 'paid' ? 'success' : 'warning'}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (r) => (
        <Tooltip title="Download Payslip">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(r);
            }}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          My Salary Details
        </Typography>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <DataTable
              columns={cols}
              rows={mySalaries}
              loading={isLoading}
              searchKeys={['month', 'year', 'status']}
              searchPlaceholder="Search by month or status..."
              emptyMessage="No salary records found for your profile."
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
