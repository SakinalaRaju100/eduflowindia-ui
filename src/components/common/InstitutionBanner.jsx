import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

export default function InstitutionBanner({ propInstitution }) {
  const { user } = useAuth();

  // Optionally fetch the latest institution data if the user is a principal
  const { data: schoolProfile } = useQuery({
    queryKey: ['my-institution'],
    queryFn: () => api.get('/principal/Institution-profile').then((res) => res.data.data),
    enabled: !propInstitution && user?.role === 'principal',
  });

  // Other roles will fallback to the 'user.institution' object populated at login
  const institution =
    propInstitution ||
    schoolProfile ||
    (user?.institution && typeof user.institution === 'object' ? user.institution : null);

  if (!institution) return null;

  // Fallback to high-quality educational placeholder images if none are uploaded
  const dummyImages = [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Classroom
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Institution supplies/desk
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Institution playground
  ];
  const images = institution.images?.length > 0 ? institution.images : dummyImages;
  const logoSrc =
    institution.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(institution.name)}&background=1565C0&color=fff&size=128&bold=true`;
  //   const logoSrc = institution.logo || `https://unsplash.com/photos/view-of-floating-open-book-from-stacked-books-in-library-HH4WBGNyltc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;  // Institution playground

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: images.length > 0 ? 2 : 0 }}>
        <Avatar
          src={logoSrc}
          variant="rounded"
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
          >
            {institution.name}
          </Typography>
          {(institution.address?.city || institution.address?.state) && (
            <Typography variant="caption" color="text.secondary">
              {institution.address.city}
              {institution.address.city && institution.address.state ? ', ' : ''}
              {institution.address.state}
            </Typography>
          )}
        </Box>
      </Box>

      {images.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            height: { xs: 150, sm: 200, md: 250 },
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {images.map((img, idx) => (
            <Box
              key={idx}
              component="img"
              src={img}
              alt={`Institution Image ${idx + 1}`}
              sx={{
                flex: { xs: '0 0 90%', sm: 1 },
                scrollSnapAlign: 'center',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
