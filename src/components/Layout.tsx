import AppsIcon from '@mui/icons-material/Apps'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useState, type ReactElement } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import CommandPalette from './CommandPalette'

const DRAWER_WIDTH = 240

interface NavEntry {
  label: string
  to: string
  icon: ReactElement
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Tableau de bord', to: '/', icon: <DashboardIcon /> },
  { label: 'Applications', to: '/applications', icon: <AppsIcon /> },
  { label: 'Recherche', to: '/search', icon: <SearchIcon /> },
  { label: 'Comparer / Recopier', to: '/promotion', icon: <CompareArrowsIcon /> },
  { label: 'Clients API', to: '/clients', icon: <VpnKeyIcon /> },
  { label: 'Audit', to: '/audit', icon: <FactCheckIcon /> },
]

/** Structure générale — voir `settings/docs/ergonomie.md`. */
export default function Layout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <SettingsSuggestIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h1" sx={{ mr: 2 }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
            Distribution du paramétrage
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            startIcon={<SearchIcon />}
            onClick={() => setPaletteOpen(true)}
            sx={{ textTransform: 'none', border: '1px solid rgba(255,255,255,0.4)', mr: 2 }}
          >
            Rechercher… <Chip label="Ctrl+K" size="small" sx={{ ml: 1, color: 'inherit' }} />
          </Button>
          {user?.demo && (
            <Tooltip title="Données fictives locales, aucune écriture réelle.">
              <Chip label="MODE DÉMO" color="warning" size="small" sx={{ mr: 2, fontWeight: 700 }} />
            </Tooltip>
          )}
          <Tooltip title={user ? `${user.name} (${user.role})` : ''}>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Menu utilisateur">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.name.charAt(0) ?? '?'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>
              {user?.name} — {user?.role}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                dispatch(logout())
                navigate('/login')
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Se déconnecter
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List component="nav" aria-label="Navigation principale">
          {NAV_ENTRIES.map((entry) => (
            <ListItemButton
              key={entry.to}
              component={NavLink}
              to={entry.to}
              end={entry.to === '/'}
              sx={{ '&.active': { bgcolor: 'action.selected', fontWeight: 600 } }}
            >
              <ListItemIcon>{entry.icon}</ListItemIcon>
              <ListItemText primary={entry.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </Box>
  )
}
