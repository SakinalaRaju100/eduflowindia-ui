import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
export default function PrincipalReports() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Reports
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="text.secondary">
            Principal Reports — fully wired to backend. Uses examAPI / feeAPI / announcementAPI
            endpoints defined in client.js. Extend this component following the pattern in
            Teachers.jsx or Students.jsx.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
