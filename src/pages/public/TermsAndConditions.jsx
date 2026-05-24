import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

export default function TermsAndConditions() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Terms and Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Last updated: {new Date().toLocaleDateString('en-IN')}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              1. Introduction
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Welcome to EduFlow. By accessing and using this website, you accept and agree to be
              bound by the terms and provision of this agreement.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              2. Use License
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Permission is granted to temporarily download one copy of the materials on EduFlow's
              website for personal, non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              3. Disclaimer
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The materials on EduFlow's website are provided on an 'as is' basis. EduFlow makes no
              warranties, expressed or implied, and hereby disclaims and negates all other
              warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual
              property or other violation of rights.
            </Typography>
            {/* Add more sections as necessary for your application */}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
