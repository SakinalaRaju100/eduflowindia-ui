import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Badge,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function TeacherMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => messageAPI.getAll(),
  });
  const messages = data?.data?.data || [];
  const readMutation = useMutation({
    mutationFn: (id) => messageAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['messages']),
  });
  const replyMutation = useMutation({
    mutationFn: (d) => messageAPI.send(d),
    onSuccess: () => {
      qc.invalidateQueries(['messages']);
      setReply('');
    },
  });

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.isRead && msg.to?._id === user?._id) readMutation.mutate(msg._id);
  };
  const unread = messages.filter(
    (m) => !m.isRead && (m.to?._id === user?._id || m.to === user?._id),
  ).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Messages{' '}
          {unread > 0 && (
            <Chip label={`${unread} unread`} size="small" color="error" sx={{ ml: 1 }} />
          )}
        </Typography>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No messages yet</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {messages.map((msg, i) => {
                const isFromMe = msg.from?._id === user?._id || msg.from === user?._id;
                const other = isFromMe ? msg.to : msg.from;
                const unreadMsg = !msg.isRead && !isFromMe;
                return (
                  <React.Fragment key={msg._id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      button
                      onClick={() => openMessage(msg)}
                      sx={{
                        bgcolor: unreadMsg ? 'primary.main' + '08' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge color="error" variant="dot" invisible={!unreadMsg}>
                          <Avatar
                            sx={{
                              bgcolor: 'primary.main',
                              width: 40,
                              height: 40,
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {other?.firstName?.[0]}
                            {other?.lastName?.[0]}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={unreadMsg ? 700 : 500}>
                              {other?.firstName} {other?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {msg.createdAt
                                ? format(new Date(msg.createdAt), 'dd MMM hh:mm a')
                                : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {isFromMe ? 'You: ' : ''}
                              {msg.subject}
                            </Typography>
                            <br />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {msg.content}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle fontWeight={700}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selected.subject || 'Message'}</span>
                <Chip label={selected.from?.role} size="small" variant="outlined" />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11 }}>
                    {selected.from?.firstName?.[0]}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>
                    {selected.from?.firstName} {selected.from?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.createdAt
                      ? format(new Date(selected.createdAt), 'dd MMM yyyy hh:mm a')
                      : ''}
                  </Typography>
                </Box>
                <Typography variant="body2">{selected.content}</Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Reply..."
                multiline
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => {
                  replyMutation.mutate({
                    to: selected.from?._id || selected.from,
                    content: reply,
                    subject: `Re: ${selected.subject || ''}`,
                    parentMessageId: selected._id,
                  });
                }}
                disabled={!reply || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Send Reply'
                )}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
