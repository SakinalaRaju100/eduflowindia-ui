import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

export default function PrivacyPolicy() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Privacy Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Last updated: {new Date().toLocaleDateString('en-IN')}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              1. Information We Collect
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We collect information to provide better services to all our users. We may collect
              personal information such as your name, email address, phone number, and institutional
              details when you register an account.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              2. How We Use Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We use the information we collect from all our services to provide, maintain, protect
              and improve them, to develop new ones, and to protect EduFlow and our users. We also
              use this information to offer you tailored content.
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
              3. Information Sharing
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We do not share personal information with companies, organizations, and individuals
              outside of EduFlow unless one of the following circumstances applies: with your
              consent, for legal reasons, or for external processing by trusted partners.
            </Typography>
            {/* Add more sections as necessary for your application */}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
