/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
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
  TextField,
  Typography,
  useTheme,
  Divider,
  Button,
  Dialog,
  Drawer,
  Slide,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  MoreVert,
  LocationOn,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { showSnackbar } from '@/components/common/ShowSnackbar';

// Mock data for the feeds - update this to fetch real posts from the API
const FEEDS = [
  {
    id: 1,
    schoolName: 'Greenwood High School',
    institutionUniqueId: 'greenwood',
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
    institutionUniqueId: 'dps',
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
    institutionUniqueId: 'st-xaviers',
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

const CAREERS = [
  {
    id: 1,
    schoolName: 'Greenwood High School',
    institutionUniqueId: 'greenwood',
    schoolLogo: 'https://ui-avatars.com/api/?name=Greenwood+High&background=1565C0&color=fff',
    title: 'Mathematics Teacher (Senior Secondary)',
    type: 'Full-time',
    location: 'Hyderabad, Telangana',
    description:
      "We are looking for an experienced Mathematics teacher for grades 11 and 12. Must have a master's degree in Mathematics and a B.Ed.",
    postedAt: '2 days ago',
  },
  {
    id: 2,
    schoolName: 'Delhi Public School',
    institutionUniqueId: 'dps',
    schoolLogo: 'https://ui-avatars.com/api/?name=DPS&background=2E7D32&color=fff',
    title: 'Primary School Coordinator',
    type: 'Full-time',
    location: 'Hyderabad, Telangana',
    description:
      'Seeking a dynamic and enthusiastic coordinator for our primary section. Minimum 5 years of teaching experience required.',
    postedAt: '1 week ago',
  },
];

const customIcon = new L.divIcon({
  className: 'school-custom-marker',
  html: '<div style="background-color: #4CAF50; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><img src="https://img.icons8.com/ios-filled/50/ffffff/school.png" style="width: 20px; height: 20px;" /></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const userIcon = new L.divIcon({
  className: 'user-location-marker',
  html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const getDummySchools = (lat, lng) => [
  {
    id: 1,
    name: 'Greenwood High School',
    uniqueId: 'greenwood',
    lat: lat + 0.01,
    lng: lng + 0.01,
    address: 'North Avenue',
  },
  {
    id: 2,
    name: 'Delhi Public School',
    uniqueId: 'dps',
    lat: lat - 0.015,
    lng: lng + 0.02,
    address: 'South Park',
  },
  {
    id: 3,
    name: 'St. Xaviers Academy',
    uniqueId: 'st-xaviers',
    lat: lat + 0.02,
    lng: lng - 0.01,
    address: 'West End',
  },
  {
    id: 4,
    name: 'Oakridge International School',
    uniqueId: 'oakridge',
    lat: lat - 0.025,
    lng: lng - 0.015,
    address: 'East Side',
  },
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userLoc, setUserLoc] = useState(null);
  const [schools, setSchools] = useState([]);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleShare = async (feed) => {
    const url = `${window.location.origin}/${feed.institutionUniqueId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: feed.schoolName,
          text: feed.caption,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      showSnackbar('Link copied to clipboard!', 'success');
    }
  };

  useEffect(() => {
    const setFallback = () => {
      setUserLoc({ lat: 17.44, lng: 78.38 });
      setSchools(getDummySchools(17.44, 78.38));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSchools(getDummySchools(pos.coords.latitude, pos.coords.longitude));
      }, setFallback);
    } else {
      setFallback();
    }
  }, []);

  const renderMapContent = () =>
    userLoc ? (
      <MapContainer
        center={[userLoc.lat, userLoc.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <ChangeView center={[userLoc.lat, userLoc.lng]} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
        {schools.map((school) => (
          <Marker key={school.id} position={[school.lat, school.lng]} icon={customIcon}>
            <Tooltip direction="bottom" offset={[0, 18]} permanent>
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: 10 }}>
                {school.name}
              </Typography>
            </Tooltip>
            <Popup>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                onClick={() => {
                  setMobileMapOpen(false);
                  navigate(`/${school.uniqueId}`);
                }}
                sx={{
                  cursor: 'pointer',
                  color: 'primary.main',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {school.name}
              </Typography>
              <Typography variant="body2">{school.address}</Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                Distance: {getDistance(userLoc.lat, userLoc.lng, school.lat, school.lng)} km
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => {
                    setMobileMapOpen(false);
                    navigate(`/${school.uniqueId}`);
                  }}
                  sx={{ textTransform: 'none', py: 0.2, px: 1 }}
                >
                  Profile
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ textTransform: 'none', py: 0.2, px: 1 }}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${school.lat},${school.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Map
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    ) : (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography color="text.secondary">Fetching location...</Typography>
      </Box>
    );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 1, pb: 1 }}>
      <Container maxWidth="xl" disableGutters sx={{ px: '6px' }}>
        <Grid container spacing={{ xs: 1.5, md: 4 }}>
          {/* Feeds Section (Left) */}
          <Grid item xs={12} md={7} lg={8}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                px: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: { xs: 16, md: 20 },
                    fontWeight: 800,
                    minWidth: 'auto',
                    px: 1,
                    mr: 2,
                  },
                }}
              >
                <Tab label="Activities" />
                <Tab label="Careers" />
              </Tabs>
              <Box
                onClick={() => setMobileMapOpen(true)}
                sx={{
                  display: { xs: 'block', md: 'none' },
                  width: 48,
                  height: 48,
                  borderRadius: 0.5,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: theme.shadows[1],
                }}
              >
                {userLoc && (
                  <MapContainer
                    center={[userLoc.lat, userLoc.lng]}
                    zoom={11}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    style={{ width: '100%', height: '100%', zIndex: 1 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon} />
                  </MapContainer>
                )}
                {/* Overlay to catch clicks and prevent internal map interaction */}
                <Box
                  sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: 'rgba(0,0,0,0.05)' }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeTab === 0 &&
                FEEDS.map((feed) => (
                  <Card
                    key={feed.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0.8,
                      overflow: 'hidden',
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar
                          src={feed.schoolLogo}
                          onClick={() => navigate(`/${feed.institutionUniqueId}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      }
                      action={
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      }
                      title={
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          onClick={() => navigate(`/${feed.institutionUniqueId}`)}
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {feed.schoolName}
                        </Typography>
                      }
                      subheader={feed.time}
                    />
                    <CardMedia
                      component="img"
                      image={feed.postImage}
                      alt="Post image"
                      sx={{
                        width: '100%',
                        height: { xs: 300, sm: 400, lg: 500 },
                        objectFit: 'cover',
                      }}
                    />
                    <CardActions disableSpacing sx={{ px: 2, pt: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                        <IconButton aria-label="add to favorites" color="success" sx={{ mr: 0.5 }}>
                          <FavoriteBorder />
                        </IconButton>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {feed.likes}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedFeedId(feed.id);
                          setCommentsDrawerOpen(true);
                        }}
                      >
                        <IconButton aria-label="comment" color="primary" sx={{ mr: 0.5 }}>
                          <ChatBubbleOutline />
                        </IconButton>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {feed.comments}
                        </Typography>
                      </Box>
                      <IconButton
                        aria-label="share"
                        color="warning"
                        sx={{ ml: 'auto' }}
                        onClick={() => handleShare(feed)}
                      >
                        <Share />
                      </IconButton>
                    </CardActions>
                    <CardContent sx={{ px: 2, pt: 0, pb: '16px !important' }}>
                      <Typography variant="body2" color="text.primary">
                        <Box
                          component="span"
                          fontWeight={700}
                          sx={{
                            mr: 1,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={() => navigate(`/${feed.institutionUniqueId}`)}
                        >
                          {feed.schoolName}
                        </Box>
                        {feed.caption}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

              {activeTab === 1 &&
                CAREERS.map((job) => (
                  <Card
                    key={job.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0.8,
                      overflow: 'hidden',
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar
                          src={job.schoolLogo}
                          onClick={() => navigate(`/${job.institutionUniqueId}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      }
                      title={
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          onClick={() => navigate(`/${job.institutionUniqueId}`)}
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {job.title}
                        </Typography>
                      }
                      subheader={`${job.schoolName} • ${job.postedAt}`}
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={job.type}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip label={job.location} size="small" sx={{ fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {job.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        onClick={() =>
                          showSnackbar('Application process will be available soon.', 'info')
                        }
                      >
                        Apply Now
                      </Button>
                    </CardActions>
                  </Card>
                ))}
            </Box>
          </Grid>

          {/* Map Section (Right - Hidden on Mobile) */}
          <Grid item xs={12} md={5} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
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
                <Box sx={{ flex: 1, width: '100%', bgcolor: 'action.hover', position: 'relative' }}>
                  {renderMapContent()}
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Links */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, sm: 4 },
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={() => navigate('/terms-and-conditions')}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Terms and Conditions
          </Button>
          <Button
            onClick={() => navigate('/privacy-policy')}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Privacy Policy
          </Button>
          <Button
            onClick={() => navigate('/refund-policy')}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Refund Policy
          </Button>
        </Box>
      </Container>

      {/* Mobile Fullscreen Map Dialog */}
      <Dialog
        fullScreen
        open={mobileMapOpen}
        onClose={() => setMobileMapOpen(false)}
        TransitionComponent={Transition}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <IconButton onClick={() => setMobileMapOpen(false)} size="small">
              <Close />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              Discover Schools
            </Typography>
          </Box>
          <Box sx={{ flex: 1, position: 'relative' }}>{renderMapContent()}</Box>
        </Box>
      </Dialog>

      {/* Comments Drawer */}
      <Drawer
        anchor="bottom"
        open={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            height: '70vh',
            maxWidth: 600,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Comments
          </Typography>
          <IconButton onClick={() => setCommentsDrawerOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {[1, 2, 3, 4, 5].map((c) => (
            <Box key={c} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                U{c}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  User {c}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  This is a great post! So proud of the school and the students.
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {c} hours ago
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Add a comment..."
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <Button variant="contained" sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}>
            Post
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
