import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Container,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import {
  Phone,
  Email,
  Language,
  LocationOn,
  AccountBalance,
  CheckCircle,
  Star,
  Fingerprint,
  Favorite,
  ChatBubble,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import SchoolBanner from '@/components/common/SchoolBanner';

export default function SchoolInfo() {
  const { user } = useAuth();
  const { schoolUniqueId } = useParams();

  const { data: publicSchoolData, isLoading } = useQuery({
    queryKey: ['public-school', schoolUniqueId],
    queryFn: () => api.get(`/auth/schools/unique/${schoolUniqueId}`).then((res) => res.data.data),
    enabled: !!schoolUniqueId,
    retry: false,
  });

  const school = schoolUniqueId
    ? publicSchoolData
    : user?.school && typeof user.school === 'object'
      ? user.school
      : null;

  if (isLoading && schoolUniqueId)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (!school)
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>School information not available.</Typography>
      </Box>
    );

  const defaultStories = [
    { name: 'Aditi Sharma', text: 'Secured All India Rank 15 in JEE Advanced.', color: '#1565C0' },
    { name: 'Rahul Verma', text: 'Won Gold at the National Science Olympiad.', color: '#2E7D32' },
    {
      name: 'Sneha Patel',
      text: 'Awarded full academic scholarship at MIT, USA.',
      color: '#E65100',
    },
  ];
  const storiesToRender =
    school.successStories?.length > 0 ? school.successStories : defaultStories;

  // Dummy data for Instagram-style feeds
  const DUMMY_POSTS = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80',
      likes: 342,
      comments: 45,
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
      likes: 512,
      comments: 89,
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&q=80',
      likes: 289,
      comments: 12,
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
      likes: 410,
      comments: 33,
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80',
      likes: 198,
      comments: 8,
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
      likes: 654,
      comments: 102,
    },
  ];

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SchoolBanner propSchool={school} />

      {/* Instagram Style Profile Stats */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 4, sm: 8 },
          py: 1,
          px: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', cursor: 'pointer' }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {school.postsCount || DUMMY_POSTS.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', cursor: 'pointer' }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {school.followersCount?.toLocaleString() || '1,250'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Followers
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', cursor: 'pointer' }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {school.followingCount?.toLocaleString() || '45'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Following
          </Typography>
        </Box>
      </Box>

      {/* About & Motive */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            About {school.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
            {school.schoolMotive ||
              'Our motive is to provide a nurturing environment that fosters academic excellence, character building, and holistic development. We believe in empowering students with the knowledge, skills, and values needed to succeed in an ever-changing world.'}
          </Typography>

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Key Highlights
          </Typography>
          <Grid container spacing={1.5}>
            {(school.keypoints
              ? school.keypoints.split(',').map((s) => s.trim())
              : [
                  'State-of-the-art Infrastructure',
                  'Highly Qualified & Experienced Faculty',
                  'Focus on Extracurricular Activities',
                  'Technology-Driven Smart Classrooms',
                  'Comprehensive Library & Labs',
                  'Safe & Secure Campus',
                ]
            ).map((point, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: 'success.main', mt: 0.2 }} />
                  <Typography variant="body2" fontWeight={500}>
                    {point}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Admissions Alert (Shown on public view) */}
      {schoolUniqueId && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'info.light',
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="info.dark">
                Admissions are in progress for{' '}
                {school.currentAcademicYear || 'the upcoming session'}!
              </Typography>
              <Typography variant="body2" color="info.main">
                Enrollments are now open. Secure your child's future today with our comprehensive
                educational programs.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="info"
              size="small"
              sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
            >
              Contact below
            </Button>
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main' }}>
                    <Phone />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phone Number :{' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      component={school.phone ? 'a' : 'p'}
                      href={school.phone ? `tel:${school.phone}` : undefined}
                      sx={{
                        textDecoration: 'none',
                        color: school.phone ? 'primary.main' : 'inherit',
                        '&:hover': school.phone ? { textDecoration: 'underline' } : {},
                      }}
                    >
                      {school.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.50', color: 'success.main' }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email Address :{' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      component={school.email ? 'a' : 'p'}
                      href={school.email ? `mailto:${school.email}` : undefined}
                      sx={{
                        textDecoration: 'none',
                        color: school.email ? 'primary.main' : 'inherit',
                        '&:hover': school.email ? { textDecoration: 'underline' } : {},
                      }}
                    >
                      {school.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.50', color: 'info.main' }}>
                    <Language />
                  </Avatar>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="caption" color="text.secondary">
                      Website :{' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      component={school.website ? 'a' : 'p'}
                      href={
                        school.website
                          ? school.website.startsWith('http')
                            ? school.website
                            : `https://${school.website}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        color: school.website ? 'primary.main' : 'inherit',
                        '&:hover': school.website ? { textDecoration: 'underline' } : {},
                      }}
                    >
                      {school.website || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                School Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#F3E5F5', color: '#8E24AA' }}>
                    <Fingerprint />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      School Unique ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {school.schoolUniqueId || 'Not available'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.50', color: 'warning.main' }}>
                    <AccountBalance />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Affiliation Board
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {school.affiliationBoard || 'Not specified'}
                      {school.affiliationNumber ? ` (${school.affiliationNumber})` : ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.50', color: 'error.main' }}>
                    <LocationOn />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {school.address?.street ? `${school.address.street}, ` : ''}
                      {school.address?.city ? `${school.address.city}, ` : ''}
                      {school.address?.state ? `${school.address.state}` : 'Not provided'}
                      {school.address?.pincode ? ` - ${school.address.pincode}` : ''}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Stories */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Student Success Stories
        </Typography>
        <Grid container spacing={3}>
          {storiesToRender.map((story, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                  bgcolor: 'background.default',
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: story.color,
                      fontSize: 24,
                      fontWeight: 700,
                    }}
                  >
                    {story.name?.[0]}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {story.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} sx={{ fontSize: 16, color: '#FFB300' }} />
                    ))}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', mt: 1 }}
                  >
                    "{story.text}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Instagram Style Posts Grid */}
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom textAlign="center" sx={{ mb: 3 }}>
          Recent Posts
        </Typography>
        <Grid container spacing={1}>
          {DUMMY_POSTS.map((post) => (
            <Grid item xs={4} key={post.id}>
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '100%', // 1:1 Aspect Ratio (Square)
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover .overlay': { opacity: 1 },
                  '&:hover .post-img': { transform: 'scale(1.05)' },
                }}
              >
                <img
                  className="post-img"
                  src={post.image}
                  alt="post"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    color: 'white',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Favorite fontSize="small" />{' '}
                    <Typography fontWeight={700}>{post.likes}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ChatBubble fontSize="small" />{' '}
                    <Typography fontWeight={700}>{post.comments}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  if (schoolUniqueId) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">{content}</Container>
      </Box>
    );
  }

  return <Box>{content}</Box>;
}
