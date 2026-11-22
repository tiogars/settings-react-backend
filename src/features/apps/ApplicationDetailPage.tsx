import AddIcon from '@mui/icons-material/Add'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILIES } from '../../data/families'
import type { Application, SettingSet } from '../../types'
import { fmtDateTime, fmtRelative } from '../../utils/format'
import { updateApplication } from './appsSlice'
import ComponentDialog from './ComponentDialog'
import EnvironmentDialog from './EnvironmentDialog'
import HistoryTab from './HistoryTab'

const TABS = ['description', 'composants', 'environnements', 'parametrage', 'clients', 'historique'] as const
type TabId = (typeof TABS)[number]

interface DescriptionFormValues {
  name: string
  owner: string
  description: string
}

function DescriptionTab({ app }: { app: Application }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<DescriptionFormValues>({
    mode: 'onChange',
    defaultValues: { name: app.name, owner: app.owner, description: app.description },
  })

  function onSubmit(values: DescriptionFormValues) {
    dispatch(updateApplication({ id: app.id, ...values, actor: user?.name ?? 'inconnu' }))
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField label="Code" value={app.code} disabled helperText="Non modifiable après création." />
            <TextField
              label="Nom *"
              {...register('name', {
                required: 'Le nom est obligatoire.',
                minLength: { value: 3, message: '3 caractères minimum.' },
                maxLength: { value: 100, message: '100 caractères maximum.' },
              })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              label="Propriétaire / équipe *"
              {...register('owner', { required: 'Le propriétaire est obligatoire.' })}
              error={Boolean(errors.owner)}
              helperText={errors.owner?.message}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              {...register('description', { maxLength: { value: 2000, message: '2000 caractères maximum.' } })}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Markdown accepté.'}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={!isDirty}>
                Enregistrer
              </Button>
            </Stack>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}

function setStatus(set: SettingSet | undefined): { label: string; color: 'success' | 'warning' | 'default' } {
  if (!set || (set.publishedValues === null && set.publishedItems === null && set.draftValues === null && set.draftItems === null)) {
    return { label: 'À renseigner', color: 'default' }
  }
  if (set.draftValues !== null || set.draftItems !== null) {
    return { label: `Brouillon (v${set.version})`, color: 'warning' }
  }
  return { label: `Publié v${set.version}`, color: 'success' }
}

/** E04 – Fiche application : onglets Description / Composants / Environnements / Paramétrage / Clients API / Historique. */
export default function ApplicationDetailPage() {
  const { appId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { applications, components, environments } = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const clients = useAppSelector((s) => s.clients.clients)
  const [componentOpen, setComponentOpen] = useState(false)
  const [environmentOpen, setEnvironmentOpen] = useState(false)

  const app = applications.find((a) => a.id === appId)
  const tabParam = searchParams.get('tab')
  const tab: TabId = TABS.includes(tabParam as TabId) ? (tabParam as TabId) : 'description'

  if (!app) {
    return <Typography>Application introuvable.</Typography>
  }

  const appComponents = components.filter((c) => c.appId === app.id)
  const appEnvironments = [...environments.filter((e) => e.appId === app.id)].sort((a, b) => a.rank - b.rank)
  const appClients = clients.filter((c) => c.appId === app.id)

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="Fil d'Ariane">
        <Link component={RouterLink} to="/applications" underline="hover">
          Applications
        </Link>
        <Typography color="text.primary">{app.name}</Typography>
      </Breadcrumbs>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="h4" component="h2">
          {app.name}
        </Typography>
        <Chip label={app.code} variant="outlined" />
        <Chip
          label={app.status === 'ACTIVE' ? 'Active' : 'Archivée'}
          color={app.status === 'ACTIVE' ? 'success' : 'default'}
          size="small"
        />
        <Typography variant="body2" color="text.secondary">
          Modifiée {fmtRelative(app.updatedAt)}
        </Typography>
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, value: TabId) => setSearchParams({ tab: value })}
        variant="scrollable"
      >
        <Tab label="Description" value="description" />
        <Tab label={`Composants (${appComponents.length})`} value="composants" />
        <Tab label={`Environnements (${appEnvironments.length})`} value="environnements" />
        <Tab label="Paramétrage" value="parametrage" />
        <Tab label={`Clients API (${appClients.length})`} value="clients" />
        <Tab label="Historique" value="historique" />
      </Tabs>

      {tab === 'description' && <DescriptionTab key={app.updatedAt} app={app} />}

      {tab === 'composants' && (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setComponentOpen(true)}>
            Ajouter un composant
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Dépôt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appComponents.map((cmp) => (
                <TableRow key={cmp.id} hover>
                  <TableCell>{cmp.code}</TableCell>
                  <TableCell>
                    <Chip label={cmp.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{cmp.name}</TableCell>
                  <TableCell>{cmp.description}</TableCell>
                  <TableCell>
                    {cmp.repositoryUrl && (
                      <Link href={cmp.repositoryUrl} target="_blank" rel="noreferrer">
                        dépôt
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ComponentDialog appId={app.id} open={componentOpen} onClose={() => setComponentOpen(false)} />
        </Stack>
      )}

      {tab === 'environnements' && (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEnvironmentOpen(true)}>
            Ajouter un environnement
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Rang</TableCell>
                <TableCell>Protégé</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appEnvironments.map((env) => (
                <TableRow key={env.id} hover>
                  <TableCell>
                    <EnvChip code={env.code} />
                  </TableCell>
                  <TableCell>{env.label}</TableCell>
                  <TableCell>{env.rank}</TableCell>
                  <TableCell>{env.protected ? '🔒 oui' : 'non'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EnvironmentDialog appId={app.id} open={environmentOpen} onClose={() => setEnvironmentOpen(false)} />
        </Stack>
      )}

      {tab === 'parametrage' && (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Cliquez sur une famille pour ouvrir l&apos;éditeur de paramétrage de l&apos;environnement.
          </Typography>
          {appEnvironments.map((env) => (
            <Card key={env.id}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                  <EnvChip code={env.code} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {env.label}
                  </Typography>
                  {env.protected && (
                    <Tooltip title="Environnement protégé : confirmation renforcée.">
                      <Chip label="protégé" size="small" color="error" variant="outlined" />
                    </Tooltip>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {FAMILIES.map((family) => {
                    const set = sets.find(
                      (s) =>
                        s.appId === app.id &&
                        s.envCode === env.code &&
                        s.componentId === null &&
                        s.family === family.id,
                    )
                    const status = setStatus(set)
                    return (
                      <Chip
                        key={family.id}
                        label={`${family.label} — ${status.label}`}
                        color={status.color}
                        variant={status.color === 'default' ? 'outlined' : 'filled'}
                        onClick={() =>
                          navigate(`/applications/${app.id}/settings/${env.code}?famille=${family.id}`)
                        }
                      />
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 'clients' && (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Button variant="outlined" onClick={() => navigate('/clients')}>
            Gérer les clients API
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Client id</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Environnement</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Expiration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appClients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>{client.clientId}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>
                    <EnvChip code={client.envCode} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.status}
                      size="small"
                      color={client.status === 'ACTIF' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{fmtDateTime(client.expiresAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      )}

      {tab === 'historique' && <HistoryTab appId={app.id} appCode={app.code} />}
    </Stack>
  )
}
