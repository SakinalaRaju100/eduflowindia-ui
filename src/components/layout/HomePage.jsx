import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import {
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  MoreVert,
  LocationOn,
} from '@mui/icons-material';

// Mock data for the feeds - update this to fetch real posts from the API
const FEEDS = [
  {
    id: 1,
    schoolName: 'Greenwood High School',
    schoolLogo: 'https://ui-avatars.com/api/?name=Greenwood+High&background=1565C0&color=fff',
    postImage:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    caption:
      'Annual Sports Day 2024! 🏃‍♂️🏆 So proud of all our students who participated and showed amazing sportsmanship today.',
    likes: 342,
    comments: 45,
    time: '2 hours ago',
  },
  {
    id: 2,
    schoolName: 'Delhi Public School',
    schoolLogo: 'https://ui-avatars.com/api/?name=DPS&background=2E7D32&color=fff',
    postImage:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    caption:
      'Our new science lab is officially open! 🔬🧪 Exploring the wonders of chemistry with our grade 10 students.',
    likes: 512,
    comments: 89,
    time: '5 hours ago',
  },
  {
    id: 3,
    schoolName: 'St. Xaviers Academy',
    schoolLogo: 'https://ui-avatars.com/api/?name=St+Xaviers&background=6A1B9A&color=fff',
    postImage:
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    caption:
      'A beautiful morning assembly to start the week. Wishing everyone a productive week ahead! 📚✨',
    likes: 289,
    comments: 12,
    time: '1 day ago',
  },
];

export default function HomePage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 1, pb: 1 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Feeds Section (Left) */}
          <Grid item xs={12} md={7} lg={8}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3, px: 1 }}>
              Recent School Activities
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FEEDS.map((feed) => (
                <Card
                  key={feed.id}
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <CardHeader
                    avatar={<Avatar src={feed.schoolLogo} />}
                    action={
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    }
                    title={
                      <Typography variant="subtitle1" fontWeight={700}>
                        {feed.schoolName}
                      </Typography>
                    }
                    subheader={feed.time}
                  />
                  <CardMedia
                    component="img"
                    height="500"
                    image={feed.postImage}
                    alt="Post image"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardActions disableSpacing sx={{ px: 2, pt: 2 }}>
                    <IconButton aria-label="add to favorites">
                      <FavoriteBorder />
                    </IconButton>
                    <IconButton aria-label="comment">
                      <ChatBubbleOutline />
                    </IconButton>
                    <IconButton aria-label="share">
                      <Share />
                    </IconButton>
                  </CardActions>
                  <CardContent sx={{ px: 2, pt: 0, pb: '16px !important' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      {feed.likes} likes
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      <Box component="span" fontWeight={700} sx={{ mr: 1 }}>
                        {feed.schoolName}
                      </Box>
                      {feed.caption}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, cursor: 'pointer' }}
                    >
                      View all {feed.comments} comments
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Map Section (Right) */}
          <Grid item xs={12} md={5} lg={4}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 88 },
                height: { xs: 400, md: 'calc(100vh - 120px)' },
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Discover Schools
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ flex: 1, width: '100%', bgcolor: 'action.hover' }}>
                  {/* Make sure to replace this embed with an actual implementation or API integration if needed */}
                  <iframe
                    title="Google Maps Schools"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15224.9!2d78.38!3d17.44!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
