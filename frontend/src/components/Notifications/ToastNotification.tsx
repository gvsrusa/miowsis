import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, AlertTitle, Snackbar, Slide, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { RootState } from '@/store';
import { removeNotification } from '@/store/slices/notificationSlice';

function SlideTransition(props: TransitionProps & {
  children: React.ReactElement<any, any>;
}) {
  return <Slide {...props} direction="up" />;
}

const ToastNotification: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.notification);
  
  // Get the most recent notification
  const currentNotification = notifications.length > 0 ? notifications[0] : null;
  const [open, setOpen] = React.useState(false);
  const [displayedId, setDisplayedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (currentNotification && currentNotification.id !== displayedId) {
      setOpen(true);
      setDisplayedId(currentNotification.id);
    }
  }, [currentNotification, displayedId]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    if (displayedId) {
      dispatch(removeNotification(displayedId));
      setDisplayedId(null);
    }
  };

  if (!currentNotification) {
    return null;
  }

  const autoHideDuration = currentNotification.type === 'error' ? 6000 : 4000;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      TransitionProps={{
        onExited: handleExited
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={currentNotification.type}
        onClose={handleClose}
        variant="filled"
        elevation={6}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        sx={{
          minWidth: 300,
          '& .MuiAlert-action': {
            paddingTop: 0
          }
        }}
      >
        <AlertTitle>{currentNotification.title}</AlertTitle>
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;