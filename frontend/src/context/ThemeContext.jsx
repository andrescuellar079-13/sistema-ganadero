// frontend/src/context/ThemeContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', modoOscuro ? 'dark' : 'light')
  }, [modoOscuro])

  const theme = createTheme({
    palette: {
      mode: modoOscuro ? 'dark' : 'light',
      primary: {
        main: '#2E7D32',
      },
      secondary: {
        main: '#E65100',
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ modoOscuro, setModoOscuro }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}