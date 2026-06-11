// frontend/src/context/LogoContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'

const LogoContext = createContext()

export const useLogo = () => useContext(LogoContext)

export const LogoProvider = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState(null)

  useEffect(() => {
    // Cargar logo guardado al iniciar
    const savedLogo = localStorage.getItem('logoBase64')
    const savedUrl = localStorage.getItem('logoUrl')
    if (savedLogo) {
      setLogoUrl(savedLogo)
    } else if (savedUrl) {
      setLogoUrl(savedUrl)
    }
  }, [])

  const actualizarLogo = (url) => {
    setLogoUrl(url)
    if (url && url.startsWith('data:image')) {
      localStorage.setItem('logoBase64', url)
    } else if (url) {
      localStorage.setItem('logoUrl', url)
    } else {
      localStorage.removeItem('logoBase64')
      localStorage.removeItem('logoUrl')
    }
  }

  const eliminarLogo = () => {
    setLogoUrl(null)
    localStorage.removeItem('logoBase64')
    localStorage.removeItem('logoUrl')
  }

  return (
    <LogoContext.Provider value={{ logoUrl, actualizarLogo, eliminarLogo }}>
      {children}
    </LogoContext.Provider>
  )
}