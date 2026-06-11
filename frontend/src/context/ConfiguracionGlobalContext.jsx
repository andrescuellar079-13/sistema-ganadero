// frontend/src/context/ConfiguracionGlobalContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'

const ConfiguracionGlobalContext = createContext()

export const useConfiguracionGlobal = () => useContext(ConfiguracionGlobalContext)

export const ConfiguracionGlobalProvider = ({ children }) => {
  const [moneda, setMoneda] = useState('Bs.')
  const [simboloMoneda, setSimboloMoneda] = useState('Bs.')
  const [idioma, setIdioma] = useState('es')

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedMoneda = localStorage.getItem('moneda')
    const savedSimbolo = localStorage.getItem('simboloMoneda')
    const savedIdioma = localStorage.getItem('idioma')
    
    if (savedMoneda) setMoneda(savedMoneda)
    if (savedSimbolo) setSimboloMoneda(savedSimbolo)
    if (savedIdioma) setIdioma(savedIdioma)
  }, [])

  const actualizarConfiguracionGlobal = (config) => {
    if (config.moneda !== undefined) {
      setMoneda(config.moneda)
      localStorage.setItem('moneda', config.moneda)
    }
    if (config.simboloMoneda !== undefined) {
      setSimboloMoneda(config.simboloMoneda)
      localStorage.setItem('simboloMoneda', config.simboloMoneda)
    }
    if (config.idioma !== undefined) {
      setIdioma(config.idioma)
      localStorage.setItem('idioma', config.idioma)
    }
  }

  return (
    <ConfiguracionGlobalContext.Provider value={{
      moneda,
      simboloMoneda,
      idioma,
      actualizarConfiguracionGlobal
    }}>
      {children}
    </ConfiguracionGlobalContext.Provider>
  )
}