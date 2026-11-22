import SearchIcon from '@mui/icons-material/Search'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { searchAll, type ResultType, type SearchResult } from '../../utils/search'

const ALL_TYPES: ResultType[] = ['Application', 'Composant', 'Paramètre', 'Environnement', 'Client API']

/** E11 – Recherche avancée : champ unique, facettes avec compteurs, résultats groupés, lien partageable. */
export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const apps = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const clients = useAppSelector((s) => s.clients.clients)

  const query = searchParams.get('q') ?? ''
  const typeFilters = searchParams.getAll('type') as ResultType[]

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
      ),
    [apps, sets, clients, query],
  )

  const counts = useMemo(() => {
    const map = new Map<ResultType, number>()
    for (const result of results) {
      map.set(result.type, (map.get(result.type) ?? 0) + 1)
    }
    return map
  }, [results])

  const visible = useMemo(
    () => (typeFilters.length === 0 ? results : results.filter((r) => typeFilters.includes(r.type))),
    [results, typeFilters],
  )

  const grouped = useMemo(() => {
    const groups = new Map<ResultType, SearchResult[]>()
    for (const result of visible) {
      const list = groups.get(result.type) ?? []
      list.push(result)
      groups.set(result.type, list)
    }
    return groups
  }, [visible])

  function update(nextQuery: string, nextTypes: ResultType[]) {
    const params = new URLSearchParams()
    if (nextQuery) params.set('q', nextQuery)
    for (const type of nextTypes) params.append('type', type)
    setSearchParams(params, { replace: true })
  }

  function toggleType(type: ResultType) {
    const next = typeFilters.includes(type)
      ? typeFilters.filter((t) => t !== type)
      : [...typeFilters, type]
    update(query, next)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h2">
        Recherche
      </Typography>
      <TextField
        fullWidth
        autoFocus
        placeholder="Rechercher partout — syntaxe : env:prod, app:billing, famille:database, secret:oui"
        value={query}
        onChange={(e) => update(e.target.value, typeFilters)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      {typeFilters.length > 0 && (
        <Stack direction="row" spacing={1}>
          {typeFilters.map((type) => (
            <Chip key={type} label={type} onDelete={() => toggleType(type)} color="primary" />
          ))}
        </Stack>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Card sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Facettes
            </Typography>
            <FormGroup>
              {ALL_TYPES.map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      size="small"
                      checked={typeFilters.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                  }
                  label={`${type}s (${counts.get(type) ?? 0})`}
                />
              ))}
            </FormGroup>
            <Typography variant="caption" color="text.secondary">
              Le lien de la page contient la recherche et les filtres : il est partageable.
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flexGrow: 1, width: '100%' }}>
          <CardContent>
            {query === '' ? (
              <Typography color="text.secondary">
                Saisissez un terme : la recherche est insensible à la casse et aux accents,
                et accepte les préfixes (<code>env:</code>, <code>app:</code>,{' '}
                <code>famille:</code>, <code>secret:oui</code>). Les valeurs des secrets ne sont
                jamais recherchables.
              </Typography>
            ) : visible.length === 0 ? (
              <Typography color="text.secondary">
                Aucun résultat pour « {query} ». Essayez un terme plus court ou retirez un filtre.
              </Typography>
            ) : (
              <List dense>
                {[...grouped.entries()].map(([type, items]) => (
                  <li key={type}>
                    <ul style={{ padding: 0 }}>
                      <ListSubheader disableSticky>
                        {type}s ({items.length})
                      </ListSubheader>
                      {items.map((item) => (
                        <ListItemButton key={item.id} onClick={() => navigate(item.link)}>
                          <ListItemText primary={item.label} secondary={item.sublabel} />
                          {item.envCode && <EnvChip code={item.envCode} />}
                        </ListItemButton>
                      ))}
                    </ul>
                  </li>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  )
}
