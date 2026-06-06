import { Collapse, Alert } from '@mui/material'

/**
 * Alerta inline de éxito/error dentro de una página.
 * Props:
 *   message — { type: 'success'|'error'|'warning'|'info', text: string } | null
 *   onClose — fn opcional
 */
export default function PageAlert({ message, onClose }) {
  return (
    <Collapse in={!!message} unmountOnExit>
      {message && (
        <Alert
          severity={message.type}
          onClose={onClose}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {message.text}
        </Alert>
      )}
    </Collapse>
  )
}
