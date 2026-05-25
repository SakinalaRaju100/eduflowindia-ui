/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Slider,
  Rating,
} from '@mui/material';
import { PhotoCamera, Delete, Close, Add, LocationOn, QrCode2 } from '@mui/icons-material';
import api from '@/api/client';
import Cropper from 'react-easy-crop';
import { showSnackbar } from '@/components/common/ShowSnackbar';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL('image/jpeg');
}

export default function SchoolForm({ initialData = {}, onSubmit, isSubmitting = false }) {
  const [form, setForm] = useState({
    institutionType: 'School',
    institutionSector: '',
    schoolUniqueId: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    affiliationBoard: 'CBSE',
    affiliationNumber: '',
    address: { street: '', city: '', state: '', country: 'India', pincode: '' },
    location: { lat: '', lng: '' },
    logo: null,
    images: [],
    aboutSchool: '',
    schoolMotive: '',
    keypoints: '',
    successStories: [],
    paymentDetails: {
      bankAccountNumber: '',
      ifscCode: '',
      upiNumber: '',
      upiQrCode: null,
    },
  });

  const [viewImage, setViewImage] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropType, setCropType] = useState('logo');
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [imagesToCrop, setImagesToCrop] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm({
        institutionType: initialData.institutionType || '',
        institutionSector: initialData.institutionSector || '',
        schoolUniqueId: initialData.schoolUniqueId || '',
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        affiliationBoard: initialData.affiliationBoard || '',
        affiliationNumber: initialData.affiliationNumber || '',
        address: {
          street: initialData.address?.street || '',
          city: initialData.address?.city || '',
          state: initialData.address?.state || '',
          country: initialData.address?.country || 'India',
          pincode: initialData.address?.pincode || '',
        },
        location: {
          lat: initialData.location?.lat || '',
          lng: initialData.location?.lng || '',
        },
        logo: initialData.logo || null,
        images: initialData.images || [],
        aboutSchool: initialData.aboutSchool || '',
        schoolMotive: initialData.schoolMotive || '',
        keypoints: initialData.keypoints || '',
        successStories: initialData.successStories || [],
        paymentDetails: {
          bankAccountNumber: initialData.paymentDetails?.bankAccountNumber || '',
          ifscCode: initialData.paymentDetails?.ifscCode || '',
          upiNumber: initialData.paymentDetails?.upiNumber || '',
          upiId: initialData.paymentDetails?.upiId || '',
          upiQrCode: initialData.paymentDetails?.upiQrCode || null,
        },
      });
    }
  }, [initialData]);

  const handleChange = (k, v) => {
    const keys = k.split('.');
    setForm((p) =>
      keys.length === 1
        ? { ...p, [keys[0]]: v }
        : { ...p, [keys[0]]: { ...p[keys[0]], [keys[1]]: v } },
    );
  };

  const handleImageUpload = async (e, type) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (type === 'logo' || type === 'upiQrCode') {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropType(type);
        setCropOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
      return;
    }

    if (type === 'images') {
      const files = Array.from(e.target.files);
      const remainingSlots = 3 - form.images.length;
      if (remainingSlots <= 0) {
        showSnackbar('Maximum 3 images allowed.', 'warning');
        e.target.value = null;
        return;
      }
      const filesToProcess = files.slice(0, remainingSlots);

      Promise.all(
        filesToProcess.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            }),
        ),
      ).then((results) => {
        setImagesToCrop(results);
        setCropImage(results[0]);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropType('images');
        setCropOpen(true);
      });
      e.target.value = null;
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    try {
      setIsUploadingLogo(true);
      const croppedDataUrl = await getCroppedImg(cropImage, croppedAreaPixels);
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      const fileName =
        cropType === 'logo' ? 'logo.jpg' : cropType === 'upiQrCode' ? 'qr.jpg' : 'image.jpg';
      formData.append('file', blob, fileName);
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (cropType === 'logo') {
        setForm((p) => ({ ...p, logo: response.data.url }));
        setCropOpen(false);
      } else if (cropType === 'upiQrCode') {
        setForm((p) => ({
          ...p,
          paymentDetails: { ...p.paymentDetails, upiQrCode: response.data.url },
        }));
        setCropOpen(false);
      } else {
        setForm((p) => ({ ...p, images: [...p.images, response.data.url] }));
        if (imagesToCrop.length > 1) {
          const nextImages = imagesToCrop.slice(1);
          setImagesToCrop(nextImages);
          setCropImage(nextImages[0]);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        } else {
          setImagesToCrop([]);
          setCropOpen(false);
        }
      }
    } catch (error) {
      console.error('Error uploading cropped file', error);
      showSnackbar(`Failed to upload cropped ${cropType === 'logo' ? 'logo' : 'image'}`, 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeImage = (index) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  const handleAddStory = () => {
    const colors = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00695C', '#D84315'];
    const color = colors[form.successStories.length % colors.length];
    setForm((p) => ({
      ...p,
      successStories: [...p.successStories, { name: '', text: '', color, rating: 5 }],
    }));
  };

  const handleStoryChange = (index, field, value) => {
    const newStories = [...form.successStories];
    newStories[index][field] = value;
    setForm((p) => ({ ...p, successStories: newStories }));
  };

  const handleRemoveStory = (index) => {
    setForm((p) => ({ ...p, successStories: p.successStories.filter((_, i) => i !== index) }));
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleChange('location.lat', pos.coords.latitude.toString());
        handleChange('location.lng', pos.coords.longitude.toString());
        setIsFetchingLocation(false);
      },
      (err) => {
        console.error(err);
        setIsFetchingLocation(false);
        showSnackbar('Failed to fetch location. Please allow location access.', 'error');
      },
    );
  };

  const handleSubmit = () => {
    const submitData = { ...form };

    // Convert location coordinates to numbers before sending to backend
    if (submitData.location?.lat && submitData.location?.lng) {
      submitData.location = {
        lat: parseFloat(submitData.location.lat),
        lng: parseFloat(submitData.location.lng),
      };
    } else {
      submitData.location = null;
    }

    onSubmit(submitData);
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            School Logo
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={form.logo}
              variant="rounded"
              sx={{
                width: 120,
                height: 120,
                mb: 1,
                bgcolor: 'background.default',
                border: '1px dashed grey',
                cursor: form.logo ? 'pointer' : 'default',
              }}
              onClick={() => form.logo && setViewImage(form.logo)}
            />
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: -10,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              <PhotoCamera fontSize="small" />
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => handleImageUpload(e, 'logo')}
              />
            </IconButton>
          </Box>
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Institution Type</InputLabel>
                <Select
                  value={form.institutionType}
                  onChange={(e) => handleChange('institutionType', e.target.value)}
                  label="Institution Type"
                >
                  <MenuItem value="School">School</MenuItem>
                  <MenuItem value="College">College</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Institution Sector</InputLabel>
                <Select
                  value={form.institutionSector}
                  onChange={(e) => handleChange('institutionSector', e.target.value)}
                  label="Institution Sector"
                >
                  <MenuItem value="government">Government</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {[
              ['name', 'School Name', 6],
              ['schoolUniqueId', 'School Unique ID', 6, true],
              ['email', 'School Email', 6],
              ['phone', 'Phone', 6],
              ['website', 'Website', 6],
              ['affiliationNumber', 'Affiliation Number', 6],
            ].map(([k, l, xs, disabled]) => (
              <Grid item xs={12} sm={xs} key={k}>
                <TextField
                  fullWidth
                  size="small"
                  label={l}
                  value={form[k] || ''}
                  onChange={(e) => handleChange(k, e.target.value)}
                  disabled={disabled}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Board</InputLabel>
                <Select
                  value={form.affiliationBoard}
                  onChange={(e) => handleChange('affiliationBoard', e.target.value)}
                  label="Board"
                >
                  {['State Board', 'Central board', 'University', 'Autonomous', 'Other'].map(
                    (b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 2 }}>
            Address & Map Coordinates
          </Typography>
          <Grid container spacing={2}>
            {[
              ['address.street', 'Street', 12],
              ['address.city', 'City', 4],
              ['address.state', 'State', 4],
              ['address.pincode', 'Pincode', 4],
              ['location.lat', 'Latitude (e.g. 17.44)', 6],
              ['location.lng', 'Longitude (e.g. 78.38)', 6],
            ].map(([k, l, xs]) => (
              <Grid item xs={12} sm={xs} key={k}>
                <TextField
                  fullWidth
                  size="small"
                  label={l}
                  value={k.split('.').reduce((o, kk) => o?.[kk], form) || ''}
                  onChange={(e) => handleChange(k, e.target.value)}
                />
              </Grid>
            ))}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isFetchingLocation ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <LocationOn />
                  )
                }
                onClick={handleFetchLocation}
                disabled={isFetchingLocation}
                sx={{ textTransform: 'none' }}
              >
                {isFetchingLocation ? 'Fetching...' : 'Fetch Current Location'}
              </Button>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 2 }}>
            School Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="About School"
                value={form.aboutSchool}
                onChange={(e) => handleChange('aboutSchool', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="School Motive"
                value={form.schoolMotive}
                onChange={(e) => handleChange('schoolMotive', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Key Highlights (Comma Separated)"
                value={form.keypoints}
                onChange={(e) => handleChange('keypoints', e.target.value)}
                helperText="E.g., Smart Classrooms, Experienced Faculty, Transport Facility"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 2 }}>
            Success Stories
          </Typography>
          {form.successStories.map((story, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
              <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Student Name"
                    value={story.name}
                    onChange={(e) => handleStoryChange(i, 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Achievement / Story"
                    value={story.text}
                    onChange={(e) => handleStoryChange(i, 'text', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={story.color || '#1565C0'}
                      onChange={(e) => handleStoryChange(i, 'color', e.target.value)}
                      label="Color"
                    >
                      <MenuItem value="#1565C0">Blue</MenuItem>
                      <MenuItem value="#2E7D32">Green</MenuItem>
                      <MenuItem value="#E65100">Orange</MenuItem>
                      <MenuItem value="#6A1B9A">Purple</MenuItem>
                      <MenuItem value="#00695C">Teal</MenuItem>
                      <MenuItem value="#D84315">Rust</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating
                    value={story.rating || 5}
                    onChange={(e, newValue) => handleStoryChange(i, 'rating', newValue)}
                    size="small"
                  />
                </Grid>
              </Grid>
              <IconButton color="error" onClick={() => handleRemoveStory(i)}>
                <Delete />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleAddStory}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Add Success Story
          </Button>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 2 }}>
            Payment Details (Optional)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Bank Account Number"
                value={form.paymentDetails.bankAccountNumber}
                onChange={(e) => handleChange('paymentDetails.bankAccountNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="IFSC Code"
                value={form.paymentDetails.ifscCode}
                onChange={(e) => handleChange('paymentDetails.ifscCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="UPI Mobile Number"
                value={form.paymentDetails.upiNumber}
                onChange={(e) => handleChange('paymentDetails.upiNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="UPI Id (e.g. yourname123@bank)"
                value={form.paymentDetails.upiId || ''}
                onChange={(e) => handleChange('paymentDetails.upiId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" display="block" gutterBottom color="text.secondary">
                UPI QR Code Image
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={form.paymentDetails.upiQrCode}
                  variant="rounded"
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 1,
                    bgcolor: 'background.default',
                    border: '1px dashed grey',
                    cursor: form.paymentDetails.upiQrCode ? 'pointer' : 'default',
                  }}
                  onClick={() =>
                    form.paymentDetails.upiQrCode && setViewImage(form.paymentDetails.upiQrCode)
                  }
                >
                  {!form.paymentDetails.upiQrCode && (
                    <QrCode2 fontSize="large" sx={{ color: 'text.disabled' }} />
                  )}
                </Avatar>
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: -10,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                >
                  <PhotoCamera fontSize="small" />
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) => handleImageUpload(e, 'upiQrCode')}
                  />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
            School Images (Max 3)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {form.images.map((img, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={img}
                  sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    objectFit: 'cover',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewImage(img)}
                />
                <IconButton
                  size="small"
                  color="error"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                  onClick={() => removeImage(i)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {form.images.length < 3 && (
              <Button
                component="label"
                variant="outlined"
                sx={{ width: 120, height: 80, borderStyle: 'dashed', borderRadius: 2 }}
              >
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}
                >
                  <PhotoCamera fontSize="small" />
                  <Typography variant="caption">Upload</Typography>
                </Box>
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'images')}
                />
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Save School Details'
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={Boolean(viewImage)} onClose={() => setViewImage(null)} maxWidth="md">
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Image Preview
          </Typography>
          <IconButton onClick={() => setViewImage(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0.5 }}>
          <Box
            component="img"
            src={viewImage}
            alt="School"
            sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={cropOpen}
        onClose={() => {
          if (!isUploadingLogo) {
            setCropOpen(false);
            setImagesToCrop([]);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {cropType === 'logo'
            ? 'Adjust Logo'
            : cropType === 'upiQrCode'
              ? 'Adjust QR Code'
              : `Adjust School Image (${imagesToCrop.length} remaining)`}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 400, position: 'relative', bgcolor: '#111' }}>
          {cropImage && (
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={cropType === 'images' ? 16 / 9 : 1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </DialogContent>
        <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" fontWeight={700}>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, z) => setZoom(z)}
            disabled={isUploadingLogo}
          />
        </Box>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCropOpen(false);
              setImagesToCrop([]);
            }}
            disabled={isUploadingLogo}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCropConfirm} disabled={isUploadingLogo}>
            {isUploadingLogo ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
