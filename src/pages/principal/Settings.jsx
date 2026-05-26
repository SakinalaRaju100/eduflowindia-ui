import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { COLOR_THEMES } from '@/theme/themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import InstitutionForm from '@/components/common/InstitutionForm';

export default function PrincipalSettings() {
  const { user, updatePreferences } = useAuth();
  const qc = useQueryClient();
  const [themeColor, setThemeColor] = useState(user?.preferences?.themeColor || 'blue');
  const [themeMode, setThemeMode] = useState(user?.preferences?.theme || 'light');

  const save = () => updatePreferences({ theme: themeMode, themeColor });

  const { data: schoolData, isLoading } = useQuery({
    queryKey: ['my-institution'],
    queryFn: () => api.get('/principal/Institution-profile').then((res) => res.data.data),
  });

  const [msg, setMsg] = useState(null);

  const mutation = useMutation({
    mutationFn: (d) => api.put('/principal/Institution-profile', d),
    onSuccess: () => {
      qc.invalidateQueries(['my-institution']);
      setMsg({ type: 'success', text: 'Institution profile updated successfully' });
    },
    onError: (err) =>
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update institution profile',
      }),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Theme
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Mode</InputLabel>
                <Select
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value)}
                  label="Mode"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Color Theme
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(COLOR_THEMES).map(([key, val]) => (
                  <Box
                    key={key}
                    onClick={() => setThemeColor(key)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: val.primary,
                      cursor: 'pointer',
                      border: themeColor === key ? '3px solid white' : '3px solid transparent',
                      boxShadow: themeColor === key ? `0 0 0 2px ${val.primary}` : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
          <Button variant="contained" sx={{ mt: 2 }} onClick={save}>
            Save Theme
          </Button>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Institution Profile Settings
          </Typography>
          {msg && (
            <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
              {msg.text}
            </Alert>
          )}
          {isLoading ? (
            <CircularProgress />
          ) : (
            <InstitutionForm
              initialData={schoolData || {}}
              onSubmit={(data) => mutation.mutate(data)}
              isSubmitting={mutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
