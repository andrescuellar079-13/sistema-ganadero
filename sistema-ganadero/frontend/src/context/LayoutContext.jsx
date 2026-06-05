// frontend/src/context/LayoutContext.jsx
import { createContext, useContext, useState } from 'react'

const LayoutContext = createContext({
  sidebarOpen: true,
  setSidebarOpen: () => {},
})

export const useLayout = () => useContext(LayoutContext)

export const LayoutProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </LayoutContext.Provider>
  )
}
