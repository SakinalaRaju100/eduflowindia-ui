import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

export default function RefundPolicy() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Refund Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Last updated: {new Date().toLocaleDateString('en-IN')}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              1. Refund Eligibility
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Refunds are subject to the policies of the respective educational institution you are
              enrolled in. EduFlow acts as a platform for fee collection and does not directly
              dictate or authorize refund eligibility for institution fees.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              2. Processing Time
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Approved refunds (by the institution) will be processed and credited back to the
              original payment method within 7 to 14 business days, depending on your bank or credit
              card issuer.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              3. Non-Refundable Fees
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Certain fees such as application fees, late fees, convenience fees, and specific
              administrative charges may be strictly non-refundable. Please refer to your
              institution's specific fee structure guidelines for more details.
            </Typography>
            {/* Add more sections as necessary for your application */}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
