// frontend/src/pages/CatalogosPage.jsx
import { useState } from 'react'
import MedicamentosList from '../components/catalogos/MedicamentosList'
import AlimentosList from '../components/catalogos/AlimentosList'
import RazasList from '../components/catalogos/RazasList'
import CategoriasList from '../components/catalogos/CategoriasList'
import VeterinariosList from '../components/catalogos/VeterinariosList'
import ReproductoresList from '../components/catalogos/ReproductoresList'
import PageHeader from '../components/ui/PageHeader'

import { Box, Tabs, Tab } from '@mui/material'
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined'
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'

const TABS = [
  { id: 'medicamentos', label: 'Medicamentos', Icon: MedicalServicesOutlinedIcon, Component: MedicamentosList },
  { id: 'alimentos', label: 'Alimentos', Icon: GrassOutlinedIcon, Component: AlimentosList },
  { id: 'razas', label: 'Razas', Icon: PetsOutlinedIcon, Component: RazasList },
  { id: 'categorias', label: 'Categorías', Icon: CategoryOutlinedIcon, Component: CategoriasList },
  { id: 'veterinarios', label: 'Veterinarios', Icon: LocalHospitalOutlinedIcon, Component: VeterinariosList },
  { id: 'reproductores', label: 'Reproductores', Icon: ScienceOutlinedIcon, Component: ReproductoresList },
]

export default function CatalogosPage() {
  const [tabIdx, setTabIdx] = useState(0)
  const { Component } = TABS[tabIdx]

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader title="Catálogos" icon={InventoryOutlinedIcon} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabIdx}
          onChange={(_, v) => setTabIdx(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map(({ id, label, Icon }) => (
            <Tab
              key={id}
              icon={<Icon sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label={label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }}
            />
          ))}
        </Tabs>
      </Box>

      <Box>
        <Component />
      </Box>
    </Box>
  )
}