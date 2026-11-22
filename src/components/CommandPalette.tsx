import SearchIcon from '@mui/icons-material/Search'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppSelector } from '../app/hooks'
import { searchAll, type SearchResult } from '../utils/search'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

/** Palette de commandes (Ctrl+K) : recherche globale groupée par type. */
export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const apps = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const clients = useAppSelector((s) => s.clients.clients)

  const results = useMemo(
    () =>
      searchAll(
        {
          applications: apps.applications,
          components: apps.components,
          environments: apps.environments,
          sets,
          clients,
        },
        query,
      ).slice(0, 20),
    [apps, sets, clients, query],
  )

  const grouped = useMemo(() => {
    const groups = new Map<string, SearchResult[]>()
    for (const result of results) {
      const list = groups.get(result.type) ?? []
      list.push(result)
      groups.set(result.type, list)
    }
    return groups
  }, [results])

  function go(result: SearchResult) {
    onClose()
    setQuery('')
    navigate(result.link)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Rechercher (ex. billing, env:prod, famille:database, secret:oui)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) go(results[0])
            if (e.key === 'Escape') onClose()
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        {query && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Aucun résultat. Essayez un préfixe plus court ou retirez un filtre.
          </Typography>
        )}
        <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
          {[...grouped.entries()].map(([type, items]) => (
            <li key={type}>
              <ul style={{ padding: 0 }}>
                <ListSubheader>{type}s</ListSubheader>
                {items.map((item) => (
                  <ListItemButton key={item.id} onClick={() => go(item)}>
                    <ListItemText primary={item.label} secondary={item.sublabel} />
                    {item.envCode && <Chip size="small" label={item.envCode} />}
                  </ListItemButton>
                ))}
              </ul>
            </li>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
