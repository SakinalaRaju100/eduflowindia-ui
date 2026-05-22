import React from 'react';
import { Box, Card, CardContent, Typography, Divider, List, ListItem, ListItemAvatar, Avatar, ListItemText, Badge } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function StudentMessages() {
  const { user } = useAuth(); const qc = useQueryClient();
  const { data: msgData } = useQuery({ queryKey: ['messages'], queryFn: () => messageAPI.getAll() });
  const messages = msgData?.data?.data || [];

  const readMutation = useMutation({ mutationFn: id => messageAPI.markRead(id), onSuccess: () => qc.invalidateQueries(['messages']) });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Direct Messages</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {messages.length === 0
            ? <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No messages found</Typography></Box>
            : <List disablePadding>
                {messages.map((msg, i) => {
                  const isFromMe = msg.from?._id === user?._id || msg.from === user?._id;
                  const other = isFromMe ? msg.to : msg.from;
                  const unread = !msg.isRead && !isFromMe;
                  return (
                    <React.Fragment key={msg._id}>
                      {i > 0 && <Divider />}
                      <ListItem onClick={() => unread && readMutation.mutate(msg._id)}
                        sx={{ bgcolor: unread ? 'primary.main' + '08' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                        <ListItemAvatar>
                          <Badge color="error" variant="dot" invisible={!unread}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                              {other?.firstName?.[0]}{other?.lastName?.[0]}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight={unread ? 700 : 500}>{other?.firstName} {other?.lastName}</Typography>
                              <Typography variant="caption" color="text.secondary">{msg.createdAt ? format(new Date(msg.createdAt), 'dd MMM') : ''}</Typography>
                            </Box>
                          }
                          secondary={<Typography variant="caption" color="text.secondary">{msg.content?.slice(0, 80)}...</Typography>}
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
