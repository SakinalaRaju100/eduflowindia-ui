import React, { useState, useRef, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  CardActions,
  MenuItem,
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
  Edit,
  Add,
  Close,
  PhotoCamera,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import SchoolBanner from '@/components/common/SchoolBanner';
import { showSnackbar } from '@/components/common/ShowSnackbar';

export default function SchoolInfo() {
  const { user } = useAuth();
  const { institutionUniqueId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isPrincipalView = user?.role === 'principal' && location.pathname === '/principal/profile';

  const { data: publicSchoolData, isLoading } = useQuery({
    queryKey: ['public-school', institutionUniqueId],
    queryFn: () =>
      api.get(`/auth/schools/unique/${institutionUniqueId}`).then((res) => res.data.data),
    enabled: !!institutionUniqueId,
    retry: false,
  });

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

  const [localPosts, setLocalPosts] = useState(DUMMY_POSTS);

  const DUMMY_JOBS = [
    {
      id: 1,
      title: 'Mathematics Teacher (Senior Secondary)',
      type: 'Full-time',
      location: 'Hyderabad, Telangana',
      description:
        "We are looking for an experienced Mathematics teacher for grades 11 and 12. Must have a master's degree in Mathematics and a B.Ed.",
      postedAt: '2 days ago',
    },
    {
      id: 2,
      title: 'Primary School Coordinator',
      type: 'Full-time',
      location: 'Hyderabad, Telangana',
      description:
        'Seeking a dynamic and enthusiastic coordinator for our primary section. Minimum 5 years of teaching experience required.',
      postedAt: '1 week ago',
    },
  ];
  const [localJobs, setLocalJobs] = useState(DUMMY_JOBS);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    description: '',
  });

  const [addPostOpen, setAddPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ caption: '', image: null });
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId;
    let isHovered = false;

    const scrollStep = () => {
      if (!isHovered && el) {
        el.scrollLeft += 1;
        // Loop back seamlessly when reaching the end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
          el.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scrollStep);
    };

    animationId = requestAnimationFrame(scrollStep);

    const handleMouseEnter = () => (isHovered = true);
    const handleMouseLeave = () => (isHovered = false);

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('touchstart', handleMouseEnter, { passive: true });
    el.addEventListener('touchend', handleMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('touchstart', handleMouseEnter);
      el.removeEventListener('touchend', handleMouseLeave);
    };
  }, []);

  const handlePostImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPostForm((p) => ({ ...p, image: response.data.url }));
    } catch (error) {
      console.error('Upload failed', error);
      showSnackbar('Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPost = async () => {
    try {
      // Simulate API Call - Append post locally
      setLocalPosts([
        {
          id: Date.now(),
          image: postForm.image,
          caption: postForm.caption,
          likes: 0,
          comments: 0,
        },
        ...localPosts,
      ]);
      showSnackbar('Post added successfully!', 'success');
      setAddPostOpen(false);
      setPostForm({ caption: '', image: null });
    } catch (error) {
      console.error('Failed to add post', error);
    }
  };

  const handleAddJob = async () => {
    if (!jobForm.title || !jobForm.description) {
      showSnackbar('Title and Description are required', 'warning');
      return;
    }
    try {
      // Simulate API Call - Append job locally
      setLocalJobs([
        {
          id: Date.now(),
          ...jobForm,
          postedAt: 'Just now',
        },
        ...localJobs,
      ]);
      showSnackbar('Job posted successfully!', 'success');
      setAddJobOpen(false);
      setJobForm({ title: '', type: 'Full-time', location: '', description: '' });
    } catch (error) {
      console.error('Failed to post job', error);
    }
  };

  const school = institutionUniqueId
    ? publicSchoolData
    : user?.school && typeof user.school === 'object'
      ? user.school
      : null;

  if (isLoading && institutionUniqueId)
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
    {
      name: 'Aditi Sharma',
      text: 'Secured All India Rank 15 in JEE Advanced.',
      color: '#1565C0',
      rating: 5,
    },
    {
      name: 'Rahul Verma',
      text: 'Won Gold at the National Science Olympiad.',
      color: '#2E7D32',
      rating: 5,
    },
    {
      name: 'Sneha Patel',
      text: 'Awarded full academic scholarship at MIT, USA.',
      color: '#E65100',
      rating: 5,
    },
  ];
  const storiesToRender =
    school.successStories?.length > 0 ? school.successStories : defaultStories;

  // Check if the viewer is authenticated and belongs to the currently viewed school
  const canViewPaymentDetails = Boolean(
    user && school && user.school && (user.school._id === school._id || user.school === school._id),
  );

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {isPrincipalView && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate('/principal/settings')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, zIndex: 1, m: 1 }}
          >
            Edit Profile
          </Button>
        </Box>
      )}
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
            {school.postsCount || localPosts.length}
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
            {school.aboutInstitute ||
              school.institutionMotive ||
              'Our motive is to provide a nurturing environment that fosters academic excellence, character building, and holistic development. We believe in empowering students with the knowledge, skills, and values needed to succeed in an ever-changing world.'}
          </Typography>

          {school.institutionMotive && school.aboutInstitute && (
            <>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Our Motive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
                {school.institutionMotive}
              </Typography>
            </>
          )}

          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 2 }}>
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
      {institutionUniqueId && (
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
                  <Avatar sx={{ bgcolor: 'secondary.50', color: 'secondary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Institution Type
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {school.institutionSector || 'Private'} {school.institutionType || 'School'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#F3E5F5', color: '#8E24AA' }}>
                    <Fingerprint />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      School Unique ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {school.institutionUniqueId || 'Not available'}
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
                    {school.location?.lat && school.location?.lng && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1, textTransform: 'none', py: 0.2, px: 1, fontSize: 11 }}
                        href={`https://www.google.com/maps/search/?api=1&query=${school.location.lat},${school.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Google Maps
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Details */}
      {canViewPaymentDetails &&
        school.paymentDetails &&
        (school.paymentDetails.upiId ||
          school.paymentDetails.bankAccountNumber ||
          school.paymentDetails.upiQrCode) && (
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mt: 3 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Payment & Account Details
              </Typography>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    {school.paymentDetails.bankAccountNumber && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Bank Account Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {school.paymentDetails.bankAccountNumber}
                        </Typography>
                      </Grid>
                    )}
                    {school.paymentDetails.ifscCode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          IFSC Code
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {school.paymentDetails.ifscCode}
                        </Typography>
                      </Grid>
                    )}
                    {school.paymentDetails.upiId && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          UPI ID
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {school.paymentDetails.upiId}
                        </Typography>
                      </Grid>
                    )}
                    {school.paymentDetails.upiNumber && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          UPI Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {school.paymentDetails.upiNumber}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
                {school.paymentDetails.upiQrCode && (
                  <Grid
                    item
                    xs={12}
                    md={4}
                    sx={{
                      display: 'flex',
                      justifyContent: { xs: 'flex-start', md: 'flex-end' },
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <img
                        src={school.paymentDetails.upiQrCode}
                        alt="UPI QR Code"
                        style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 4 }}
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      >
                        Scan to Pay
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

      {/* Success Stories */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Student Success Stories
        </Typography>
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 3,
            pb: 2,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[...storiesToRender, ...storiesToRender].map((story, i) => (
            <Box key={i} sx={{ width: { xs: 200, sm: 250 }, flexShrink: 0 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
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
                    {Array.from({ length: story.rating || 5 }).map((_, s) => (
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
            </Box>
          ))}
        </Box>
      </Box>

      {/* Careers / Job Openings */}
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            position: 'relative',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={700} textAlign="center">
            Careers & Job Openings
          </Typography>
          {isPrincipalView && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setAddJobOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                position: 'absolute',
                right: 0,
              }}
            >
              Post a Job
            </Button>
          )}
        </Box>
        <Grid container spacing={2}>
          {localJobs.map((job) => (
            <Grid item xs={12} sm={6} key={job.id}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {job.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={job.type} size="small" color="primary" sx={{ fontWeight: 600 }} />
                    <Chip label={job.location || 'Remote'} size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {job.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Posted: {job.postedAt}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                  {isPrincipalView ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setLocalJobs(localJobs.filter((j) => j.id !== job.id))}
                    >
                      Remove Post
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      disableElevation
                      sx={{ textTransform: 'none' }}
                      onClick={() =>
                        showSnackbar('Application process will be available soon.', 'info')
                      }
                    >
                      Apply Now
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
          {localJobs.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No job openings currently available.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Instagram Style Posts Grid */}
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            position: 'relative',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={700} textAlign="center">
            Recent Posts
          </Typography>
          {isPrincipalView && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setAddPostOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                position: 'absolute',
                right: 0,
              }}
            >
              Add Activity Post
            </Button>
          )}
        </Box>
        <Grid container spacing={1}>
          {localPosts.map((post) => (
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

      {/* Add Post Dialog */}
      <Dialog open={addPostOpen} onClose={() => setAddPostOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" fontWeight={700}>
            Create New Post
          </Typography>
          <IconButton onClick={() => setAddPostOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              width: '100%',
              height: 250,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {postForm.image ? (
              <>
                <img
                  src={postForm.image}
                  alt="Post"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={() => setPostForm({ ...postForm, image: null })}
                >
                  <Close fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Button
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  color: 'text.secondary',
                  textTransform: 'none',
                }}
              >
                {isUploading ? <CircularProgress size={24} /> : <PhotoCamera fontSize="large" />}
                <Typography>{isUploading ? 'Uploading...' : 'Upload Photo'}</Typography>
                <input type="file" hidden accept="image/*" onChange={handlePostImageUpload} />
              </Button>
            )}
          </Box>
          <TextField
            multiline
            rows={3}
            placeholder="Write a caption..."
            fullWidth
            value={postForm.caption}
            onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAddPostOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!postForm.image || isUploading}
            onClick={handleAddPost}
            sx={{ textTransform: 'none', px: 4 }}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Job Dialog */}
      <Dialog open={addJobOpen} onClose={() => setAddJobOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" fontWeight={700}>
            Post a New Job
          </Typography>
          <IconButton onClick={() => setAddJobOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Job Title"
            fullWidth
            size="small"
            value={jobForm.title}
            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Employment Type"
                fullWidth
                size="small"
                value={jobForm.type}
                onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                fullWidth
                size="small"
                placeholder="e.g. Hyderabad, TS"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            multiline
            rows={4}
            label="Job Description"
            fullWidth
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAddJobOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddJob} sx={{ textTransform: 'none', px: 4 }}>
            Post Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (institutionUniqueId) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">{content}</Container>
      </Box>
    );
  }

  return <Box>{content}</Box>;
}
