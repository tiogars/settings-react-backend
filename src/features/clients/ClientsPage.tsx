import AddIcon from '@mui/icons-material/Add'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import BlockIcon from '@mui/icons-material/Block'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowParams,
} from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import type { ApiClient } from '../../types'
import { fmtDate, fmtRelative } from '../../utils/format'
import { createClient, revokeClient, rotateSecret } from './clientsSlice'

function randomSecret(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replaceAll('=', '')
}

function randomSuffix(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface CreateFormValues {
  name: string
  appId: string
  envCode: string
  expiresAt: DateTime | null
  description: string
}

interface SecretReveal {
  clientId: string
  secret: string
}

/** E10 – Clients API : liste, création (secret affiché une seule fois), rotation, révocation. */
export default function ClientsPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { applications, environments } = useAppSelector((s) => s.apps)
  const clients = useAppSelector((s) => s.clients.clients)
  const [createOpen, setCreateOpen] = useState(false)
  const [reveal, setReveal] = useState<SecretReveal | null>(null)
  const [appFilter, setAppFilter] = useState('TOUTES')

  const actor = user?.name ?? 'inconnu'
  const appById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      appId: '',
      envCode: '',
      expiresAt: DateTime.now().plus({ days: 180 }),
      description: '',
    },
  })
  const selectedAppId = useWatch({ control, name: 'appId' })

  const rows = useMemo(
    () => (appFilter === 'TOUTES' ? clients : clients.filter((c) => c.appId === appFilter)),
    [clients, appFilter],
  )

  function onCreate(values: CreateFormValues) {
    const app = appById.get(values.appId)
    const clientId = `svc-${app?.code ?? 'app'}-${values.envCode}-${randomSuffix()}`
    const secret = randomSecret()
    dispatch(
      createClient({
        name: values.name,
        appId: values.appId,
        envCode: values.envCode,
        expiresAt: (values.expiresAt ?? DateTime.now().plus({ days: 180 })).toISO() ?? '',
        description: values.description,
        clientId,
        actor,
        appCode: app?.code ?? '',
      }),
    )
    reset()
    setCreateOpen(false)
    setReveal({ clientId, secret })
  }

  function rotate(client: ApiClient) {
    const secret = randomSecret()
    dispatch(rotateSecret({ id: client.id, actor, clientId: client.clientId }))
    setReveal({ clientId: client.clientId, secret })
  }

  const columns: GridColDef<ApiClient>[] = [
    { field: 'clientId', headerName: 'Client id', width: 220 },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 160 },
    {
      field: 'appId',
      headerName: 'Application',
      width: 140,
      valueFormatter: (value: string) => appById.get(value)?.code ?? value,
    },
    {
      field: 'envCode',
      headerName: 'Environnement',
      width: 140,
      renderCell: (params: GridRenderCellParams<ApiClient>) => (
        <Stack sx={{ justifyContent: 'center', height: '100%' }}>
          <EnvChip code={params.row.envCode} />
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 110,
      renderCell: (params: GridRenderCellParams<ApiClient>) => (
        <Chip
          label={params.row.status}
          size="small"
          color={params.row.status === 'ACTIF' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'expiresAt',
      headerName: 'Expiration',
      width: 150,
      renderCell: (params: GridRenderCellParams<ApiClient>) => {
        const expires = DateTime.fromISO(params.row.expiresAt)
        const soon = expires < DateTime.now().plus({ days: 30 })
        return (
          <Stack sx={{ justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color={soon ? 'error' : 'text.primary'}>
              {fmtDate(params.row.expiresAt)}
              {soon ? ' ⚠' : ''}
            </Typography>
          </Stack>
        )
      },
    },
    {
      field: 'lastCallAt',
      headerName: 'Dernier appel',
      width: 150,
      valueFormatter: (value: string | null) => (value ? fmtRelative(value) : 'jamais'),
    },
    {
      field: 'actions',
      type: 'actions',
      width: 90,
      getActions: (params: GridRowParams<ApiClient>) => [
        <GridActionsCellItem
          key="rotate"
          icon={<AutorenewIcon />}
          label="Rotation du secret"
          disabled={params.row.status !== 'ACTIF'}
          onClick={() => rotate(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="revoke"
          icon={<BlockIcon />}
          label="Révoquer"
          disabled={params.row.status !== 'ACTIF'}
          onClick={() =>
            dispatch(revokeClient({ id: params.row.id, actor, clientId: params.row.clientId }))
          }
          showInMenu
        />,
      ],
    },
  ]

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2">
          Clients API
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Créer un client
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Identités machine des microservices autorisés (OAuth2 client credentials, scope
        <code> config:read</code> limité à leur couple application/environnement).
      </Typography>
      <TextField
        select
        label="Application"
        value={appFilter}
        onChange={(e) => setAppFilter(e.target.value)}
        sx={{ width: 240 }}
      >
        <MenuItem value="TOUTES">Toutes</MenuItem>
        {applications.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.name} ({a.code})
          </MenuItem>
        ))}
      </TextField>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25]}
        sx={{ bgcolor: 'background.paper' }}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Créer un client API</DialogTitle>
        <form onSubmit={handleSubmit(onCreate)} noValidate>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nom *"
                {...register('name', { required: 'Le nom est obligatoire.' })}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
              <Controller
                name="appId"
                control={control}
                rules={{ required: "L'application est obligatoire." }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Application *"
                    value={field.value}
                    onChange={field.onChange}
                    error={Boolean(errors.appId)}
                    helperText={errors.appId?.message}
                  >
                    {applications
                      .filter((a) => a.status === 'ACTIVE')
                      .map((a) => (
                        <MenuItem key={a.id} value={a.id}>
                          {a.name} ({a.code})
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />
              <Controller
                name="envCode"
                control={control}
                rules={{ required: "L'environnement est obligatoire." }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Environnement *"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!selectedAppId}
                    error={Boolean(errors.envCode)}
                    helperText={errors.envCode?.message}
                  >
                    {environments
                      .filter((e) => e.appId === selectedAppId)
                      .map((e) => (
                        <MenuItem key={e.id} value={e.code}>
                          {e.label} ({e.code})
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />
              <Controller
                name="expiresAt"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date d'expiration"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={DateTime.now()}
                  />
                )}
              />
              <TextField label="Description" multiline minRows={2} {...register('description')} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={!isValid}>
              Créer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={reveal !== null} onClose={() => setReveal(null)} fullWidth maxWidth="sm">
        <DialogTitle>Secret du client {reveal?.clientId}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ce secret est affiché <strong>une seule fois</strong>. Copiez-le maintenant et
            stockez-le dans votre coffre de secrets.
          </Alert>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField fullWidth value={reveal?.secret ?? ''} slotProps={{ input: { readOnly: true } }} />
            <Tooltip title="Copier">
              <IconButton
                aria-label="Copier le secret"
                onClick={() => reveal && navigator.clipboard.writeText(reveal.secret)}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setReveal(null)}>
            J&apos;ai copié le secret
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
