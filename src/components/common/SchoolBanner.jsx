import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

export default function SchoolBanner({ propSchool }) {
  const { user } = useAuth();

  // Optionally fetch the latest school data if the user is a principal
  const { data: schoolProfile } = useQuery({
    queryKey: ['my-school'],
    queryFn: () => api.get('/principal/school-profile').then((res) => res.data.data),
    enabled: !propSchool && user?.role === 'principal',
  });

  // Other roles will fallback to the 'user.school' object populated at login
  const school =
    propSchool ||
    schoolProfile ||
    (user?.school && typeof user.school === 'object' ? user.school : null);

  if (!school) return null;

  // Fallback to high-quality educational placeholder images if none are uploaded
  const dummyImages = [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Classroom
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // School supplies/desk
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // School playground
  ];
  const images = school.images?.length > 0 ? school.images : dummyImages;
  const logoSrc =
    school.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(school.name)}&background=1565C0&color=fff&size=128&bold=true`;
  //   const logoSrc = school.logo || `https://unsplash.com/photos/view-of-floating-open-book-from-stacked-books-in-library-HH4WBGNyltc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;  // School playground

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
            {school.name}
          </Typography>
          {(school.address?.city || school.address?.state) && (
            <Typography variant="caption" color="text.secondary">
              {school.address.city}
              {school.address.city && school.address.state ? ', ' : ''}
              {school.address.state}
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
              alt={`School Image ${idx + 1}`}
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
