import StarIcon from '@mui/icons-material/Star'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BarChart } from '@mui/x-charts/BarChart'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILIES } from '../../data/families'
import { fmtRelative } from '../../utils/format'

interface CounterProps {
  label: string
  value: number
  color?: string
}

function Counter({ label, value, color }: CounterProps) {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
      <CardContent>
        <Typography variant="h4" sx={{ color }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

/** E02 – Tableau de bord : compteurs, complétude, dernières modifications, favoris. */
export default function DashboardPage() {
  const navigate = useNavigate()
  const { applications, environments } = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const clients = useAppSelector((s) => s.clients.clients)
  const events = useAppSelector((s) => s.audit.events)

  const activeApps = applications.filter((a) => a.status === 'ACTIVE')
  const draftCount = sets.filter((s) => s.draftValues !== null || s.draftItems !== null).length

  const completeness = useMemo(
    () =>
      activeApps.map((app) => {
        const families = new Set(
          sets
            .filter(
              (s) =>
                s.appId === app.id &&
                (s.publishedValues !== null || s.publishedItems !== null),
            )
            .map((s) => s.family),
        )
        return { code: app.code, count: families.size }
      }),
    [activeApps, sets],
  )

  const recentEvents = useMemo(
    () => [...events].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [events],
  )

  const favorites = activeApps.filter((a) => a.favorite)

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Tableau de bord
      </Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Counter label="Applications actives" value={activeApps.length} />
        <Counter label="Environnements" value={environments.length} />
        <Counter label="Brouillons non publiés" value={draftCount} color="#ef6c00" />
        <Counter label="Clients API actifs" value={clients.filter((c) => c.status === 'ACTIF').length} />
      </Stack>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Card sx={{ flex: 2, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Complétude du paramétrage ({FAMILIES.length} familles)
            </Typography>
            <BarChart
              height={260}
              xAxis={[{ data: completeness.map((c) => c.code), scaleType: 'band' }]}
              yAxis={[{ max: FAMILIES.length }]}
              series={[
                {
                  data: completeness.map((c) => c.count),
                  label: 'Familles publiées',
                  color: '#1a237e',
                },
              ]}
            />
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 280 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dernières modifications
            </Typography>
            <List dense>
              {recentEvents.map((event) => (
                <ListItemButton
                  key={event.id}
                  onClick={() => navigate('/audit')}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <span>
                          {event.action} — {event.objectLabel}
                        </span>
                        {event.envCode && <EnvChip code={event.envCode} />}
                      </Stack>
                    }
                    secondary={`${event.actor} · ${fmtRelative(event.date)}${event.appCode ? ` · ${event.appCode}` : ''}`}
                  />
                </ListItemButton>
              ))}
            </List>
          </CardContent>
        </Card>
      </Stack>
      <Box>
        <Typography variant="h6" gutterBottom>
          <StarIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', color: '#f9a825' }} /> Favoris
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {favorites.map((app) => (
            <Card key={app.id} sx={{ width: 280 }}>
              <CardActionArea onClick={() => navigate(`/applications/${app.id}`)}>
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {app.name}
                    </Typography>
                    <Chip label={app.code} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {app.description}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                    {environments
                      .filter((e) => e.appId === app.id)
                      .map((e) => (
                        <EnvChip key={e.id} code={e.code} />
                      ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          {favorites.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucun favori. Ajoutez-en depuis la liste des applications.
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
