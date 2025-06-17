import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Alert, AlertTitle, IconButton, Collapse, Stack } from '@mui/material';
import { Close, CheckCircle, Error, Warning, Info } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { RootState } from '@/store';
import { removeNotification, markAsRead } from '@/store/slices/notificationSlice';
import { Notification } from '@/store/slices/notificationSlice';

const NotificationStack: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.notification);
  
  // Only show the 3 most recent unread notifications
  const visibleNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3);

  const handleClose = (id: string) => {
    dispatch(markAsRead(id));
    setTimeout(() => {
      dispatch(removeNotification(id));
    }, 300);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 2000,
        maxWidth: 400
      }}
    >
      <AnimatePresence>
        <Stack spacing={1}>
          {visibleNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 500,
                damping: 30
              }}
            >
              <Alert
                severity={notification.type}
                icon={getIcon(notification.type)}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => handleClose(notification.id)}
                  >
                    <Close fontSize="inherit" />
                  </IconButton>
                }
                sx={{
                  width: '100%',
                  boxShadow: 3,
                  '& .MuiAlert-icon': {
                    fontSize: 24
                  },
                  '& .MuiAlert-action': {
                    paddingTop: 0.5
                  },
                  backgroundColor: 'background.paper',
                  border: 1,
                  borderColor: `${notification.type}.main`,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <AlertTitle sx={{ fontWeight: 600 }}>
                  {notification.title}
                </AlertTitle>
                <Box sx={{ pr: 2 }}>
                  {notification.message}
                </Box>
                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </Box>
              </Alert>
            </motion.div>
          ))}
        </Stack>
      </AnimatePresence>
    </Box>
  );
};

export default NotificationStack;