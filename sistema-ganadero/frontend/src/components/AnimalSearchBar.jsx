import { useState, useEffect, useRef } from 'react'
import { InputAdornment, TextField, IconButton, Tooltip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

export default function AnimalSearchBar({ value, onChange, placeholder = 'Buscar por nombre, arete, raza, categoría o estado...' }) {
  const [inputValue, setInputValue] = useState(value || '')
  const timerRef = useRef(null)

  // Sync external resets (limpiarFiltros)
  useEffect(() => {
    if (value === '' && inputValue !== '') {
      setInputValue('')
    }
  }, [value])

  const handleChange = (e) => {
    const texto = e.target.value
    setInputValue(texto)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(texto)
    }, 500)
  }

  const handleClear = () => {
    setInputValue('')
    clearTimeout(timerRef.current)
    onChange('')
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <TextField
      fullWidth
      size="small"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: inputValue ? (
          <InputAdornment position="end">
            <Tooltip title="Limpiar búsqueda">
              <IconButton size="small" onClick={handleClear} edge="end">
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : null,
        sx: { borderRadius: 2, bgcolor: 'background.paper' },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': { borderColor: 'primary.main' },
          '&.Mui-focused fieldset': { borderWidth: 2 },
        },
      }}
    />
  )
}
