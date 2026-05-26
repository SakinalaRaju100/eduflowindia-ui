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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  ChatBubbleOutline,
  Share,
  MoreVert,
  LocationOn,
  Close,
  StayPrimaryLandscape,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { showSnackbar } from '@/components/common/ShowSnackbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

const customIcon = new L.divIcon({
  className: 'institution-custom-marker',
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

const timeAgo = (dateParam) => {
  const date = new Date(dateParam);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return 'Just now';
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const [userLoc, setUserLoc] = useState(null);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [commentText, setCommentText] = useState('');

  const likeMutation = useMutation({
    mutationFn: (id) => api.post(`/auth/posts/${id}/like`),
    onSuccess: () => qc.invalidateQueries(['public-posts']),
    onError: () => showSnackbar('Failed to like post', 'error'),
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, text }) => api.post(`/auth/posts/${id}/comment`, { text }),
    onSuccess: () => {
      qc.invalidateQueries(['public-posts']);
      setCommentText('');
    },
    onError: () => showSnackbar('Failed to post comment', 'error'),
  });

  const { data: dbSchools = [] } = useQuery({
    queryKey: ['public-schools'],
    queryFn: () => api.get('/auth/schools').then((res) => res.data.data || []),
  });

  const { data: dbPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['public-posts'],
    queryFn: () => api.get('/auth/posts').then((res) => res.data.data || []),
  });

  const { data: dbJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: () => api.get('/auth/jobs').then((res) => res.data.data || []),
  });

  const handleLike = (feedId) => {
    if (!user) {
      showSnackbar('Please login to like posts', 'info');
      navigate('/login');
      return;
    }
    likeMutation.mutate(feedId);
  };

  const handleAddComment = () => {
    if (!user) {
      showSnackbar('Please login to comment', 'info');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate({ id: selectedFeedId, text: commentText });
  };

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
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, setFallback);
    } else {
      setFallback();
    }
  }, []);

  const renderMapContent = () =>
    userLoc ? (
      <MapContainer
        center={[userLoc.lat, userLoc.lng]}
        zoom={15}
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
        {dbSchools
          .filter((s) => s.location && s.location.lat && s.location.lng)
          .map((institution) => {
            const uniqueId = institution.institutionUniqueId || institution.schoolUniqueId;
            return (
              <Marker
                key={institution._id}
                position={[institution.location.lat, institution.location.lng]}
                icon={customIcon}
              >
                <Tooltip direction="bottom" offset={[0, 18]} permanent>
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: 10 }}>
                    {institution.name}
                  </Typography>
                </Tooltip>
                <Popup>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    onClick={() => {
                      navigate(`/${uniqueId}`);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {institution.name}
                  </Typography>
                  <Typography variant="body2">
                    {institution.address?.street ? `${institution.address.street}, ` : ''}
                    {institution.address?.city || ''}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                    Distance:{' '}
                    {getDistance(
                      userLoc.lat,
                      userLoc.lng,
                      institution.location.lat,
                      institution.location.lng,
                    )}{' '}
                    km
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => {
                        navigate(`/${uniqueId}`);
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
                      href={`https://www.google.com/maps/dir/?api=1&destination=${institution.location.lat},${institution.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Map
                    </Button>
                  </Box>
                </Popup>
              </Marker>
            );
          })}
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
        <Grid container spacing={{ xs: 1.5, md: 4 }} justifyContent="center">
          {/* Feeds Section (Left) */}
          <Grid item xs={12} md={8} lg={8}>
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
                    fontSize: { xs: 14, sm: 16, md: 20 },
                    fontWeight: 800,
                    minWidth: 'auto',
                    px: 1,
                    mr: 2,
                  },
                }}
              >
                <Tab label="Activities" />
                <Tab label="Careers" />
                <Tab label="Map" />
              </Tabs>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeTab === 0 && isLoadingPosts && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {activeTab === 0 && !isLoadingPosts && dbPosts.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No recent activity posts available.
                </Alert>
              )}
              {activeTab === 0 &&
                !isLoadingPosts &&
                dbPosts.map((feed) => {
                  const inst = feed.institution || {};
                  const schoolName = inst.name || 'Unknown Institution';
                  const uniqueId = inst.institutionUniqueId || inst.schoolUniqueId;
                  const schoolLogo =
                    inst.logo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=1565C0&color=fff`;

                  return (
                    <Card
                      key={feed._id}
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
                            src={schoolLogo}
                            onClick={() => uniqueId && navigate(`/${uniqueId}`)}
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
                            onClick={() => uniqueId && navigate(`/${uniqueId}`)}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {schoolName}
                          </Typography>
                        }
                        subheader={timeAgo(feed.createdAt)}
                      />
                      <CardMedia
                        component="img"
                        image={feed.image}
                        alt="Post image"
                        sx={{
                          width: '100%',
                          height: { xs: 300, sm: 400, lg: 500 },
                          objectFit: 'cover',
                        }}
                      />
                      <CardActions disableSpacing sx={{ px: 2, pt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={
                              feed.likedBy?.includes(user?._id) ? 'success.main' : 'error.main'
                            }
                          >
                            Likes
                          </Typography>
                          <IconButton
                            aria-label="add to favorites"
                            color={feed.likedBy?.includes(user?._id) ? 'success' : 'error'}
                            sx={{}}
                            onClick={() => handleLike(feed._id)}
                            disabled={likeMutation.isPending}
                          >
                            {feed.likedBy?.includes(user?._id) ? <Favorite /> : <FavoriteBorder />}
                          </IconButton>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={
                              feed.likedBy?.includes(user?._id) ? 'success.main' : 'error.main'
                            }
                          >
                            {feed.likes}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedFeedId(feed._id);
                            setCommentsDrawerOpen(true);
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            Appreciations
                          </Typography>
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
                          onClick={() =>
                            handleShare({ ...feed, institutionUniqueId: uniqueId, schoolName })
                          }
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
                            onClick={() => uniqueId && navigate(`/${uniqueId}`)}
                          >
                            {schoolName}
                          </Box>
                          {feed.caption}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}

              {activeTab === 1 && isLoadingJobs && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {activeTab === 1 && !isLoadingJobs && dbJobs.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No career openings available at the moment.
                </Alert>
              )}
              {activeTab === 1 &&
                !isLoadingJobs &&
                dbJobs.map((job) => {
                  const inst = job.institution || {};
                  const schoolName = inst.name || 'Unknown Institution';
                  const uniqueId = inst.institutionUniqueId || inst.schoolUniqueId;
                  const schoolLogo =
                    inst.logo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(schoolName)}&background=1565C0&color=fff`;

                  return (
                    <Card
                      key={job._id}
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
                            src={schoolLogo}
                            onClick={() => uniqueId && navigate(`/${uniqueId}`)}
                            sx={{ cursor: 'pointer' }}
                          />
                        }
                        title={
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            onClick={() => uniqueId && navigate(`/${uniqueId}`)}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {job.title}
                          </Typography>
                        }
                        subheader={`${schoolName} • ${timeAgo(job.createdAt)}`}
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          Posted: {timeAgo(job.createdAt)}
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
                  );
                })}

              {activeTab === 2 && (
                <Card
                  elevation={0}
                  sx={{
                    height: { xs: 500, md: 600 },
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Discover education
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{ flex: 1, width: '100%', bgcolor: 'action.hover', position: 'relative' }}
                  >
                    {renderMapContent()}
                  </Box>
                </Card>
              )}
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
            bgcolor: 'background.paper',
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
          <Typography variant="h6" fontWeight={700} color={'primary.main'}>
            Appreciations
          </Typography>
          <IconButton onClick={() => setCommentsDrawerOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {dbPosts
            .find((p) => p._id === selectedFeedId)
            ?.commentsList?.map((comment, index, arr) => (
              <React.Fragment key={comment._id}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <Avatar
                    src={comment.user?.photo}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}
                  >
                    {comment.user?.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }} color="text.primary">
                      {comment.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {timeAgo(comment.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                {index < arr.length - 1 && <Divider sx={{ mb: 2 }} />}
              </React.Fragment>
            ))}
          {dbPosts.find((p) => p._id === selectedFeedId)?.commentsList?.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}
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
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddComment();
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <Button
            variant="contained"
            sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
            onClick={handleAddComment}
            disabled={commentMutation.isPending || !commentText.trim()}
          >
            {commentMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Post'}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
