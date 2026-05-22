import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Badge, Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function ParentMessages() {
  const { user } = useAuth(); const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['messages'], queryFn: () => messageAPI.getAll() });
  const messages = data?.data?.data || [];
  const readMutation = useMutation({ mutationFn: id => messageAPI.markRead(id), onSuccess: () => qc.invalidateQueries(['messages']) });

  const unread = messages.filter(m => !m.isRead && (m.to?._id === user?._id || m.to === user?._id)).length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Messages {unread > 0 && <Chip label={`${unread} unread`} size="small" color="error" sx={{ ml: 1 }} />}
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {isLoading
            ? <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
            : messages.length === 0
            ? <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No messages yet</Typography></Box>
            : <List disablePadding>
                {messages.map((msg, i) => {
                  const isFromMe = msg.from?._id === user?._id || msg.from === user?._id;
                  const other = isFromMe ? msg.to : msg.from;
                  const unreadMsg = !msg.isRead && !isFromMe;
                  return (
                    <React.Fragment key={msg._id}>
                      {i > 0 && <Divider />}
                      <ListItem onClick={() => unreadMsg && readMutation.mutate(msg._id)}
                        sx={{ bgcolor: unreadMsg ? 'primary.main' + '08' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                        <ListItemAvatar>
                          <Badge color="error" variant="dot" invisible={!unreadMsg}>
                            <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                              {other?.firstName?.[0]}{other?.lastName?.[0]}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight={unreadMsg ? 700 : 500}>{other?.firstName} {other?.lastName}</Typography>
                              <Typography variant="caption" color="text.secondary">{msg.createdAt ? format(new Date(msg.createdAt), 'dd MMM hh:mm a') : ''}</Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">{msg.subject}</Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">{msg.content?.slice(0, 100)}...</Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
          }
        </CardContent>
      </Card>
    </Box>
  );
}
