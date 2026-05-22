import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCard({
  title,
  value,
  icon,
  color = '#1565C0',
  trend,
  trendLabel,
  loading,
  subtitle,
  onClick,
}) {
  if (loading)
    return (
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="rounded" height={60} />
        </CardContent>
      </Card>
    );

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
        transition: 'all 0.2s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${color}20` }
          : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend >= 0 ? (
                  <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {Math.abs(trend)}% {trendLabel || 'vs last month'}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48, borderRadius: 2 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
