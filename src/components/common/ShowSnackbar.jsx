import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

// Slide transition function
function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

let globalShowSnackbar = () => {};
// Exported function that can be imported and called anywhere
export const showSnackbar = (message, severity = 'info') => {
  globalShowSnackbar(message, severity);
};

const ShowSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Bind the global function to the local state updater when the component mounts
  useEffect(() => {
    globalShowSnackbar = (message, severity = 'info') => {
      setSnackbar({ open: true, message, severity });
    };
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={snackbar.open}
      onClose={handleCloseSnackbar}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
    >
      <Alert
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%', mt: 5 }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default ShowSnackbar;
