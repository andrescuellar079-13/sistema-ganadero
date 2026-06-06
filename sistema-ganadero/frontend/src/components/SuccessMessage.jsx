import { Snackbar, Alert } from '@mui/material'

export default function SuccessMessage({ message, onClose }) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        sx={{ borderRadius: 2, minWidth: 280, fontWeight: 500 }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
