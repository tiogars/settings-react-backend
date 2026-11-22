import DownloadIcon from '@mui/icons-material/Download'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import type { AuditEvent } from '../../types'
import { fmtDateTime } from '../../utils/format'
import { normalize } from '../../utils/search'

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PUBLICATION: 'success',
  BROUILLON: 'warning',
  RECOPIE: 'info',
  ROLLBACK: 'warning',
  REVOCATION: 'error',
  ARCHIVAGE: 'error',
}

function toCsv(events: AuditEvent[]): string {
  const header = 'date;acteur;action;objet;libelle;application;environnement;details'
  const lines = events.map((e) =>
    [e.date, e.actor, e.action, e.objectType, e.objectLabel, e.appCode ?? '', e.envCode ?? '', e.details]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(';'),
  )
  return [header, ...lines].join('\n')
}

/** E12 – Audit : filtres (acteur, objet, action, période), tableau chronologique, export CSV. */
export default function AuditPage() {
  const events = useAppSelector((s) => s.audit.events)
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('TOUTES')
  const [object, setObject] = useState('')
  const [from, setFrom] = useState<DateTime | null>(null)
  const [to, setTo] = useState<DateTime | null>(null)

  const actions = useMemo(() => [...new Set(events.map((e) => e.action))].sort(), [events])

  const rows = useMemo(
    () =>
      [...events]
        .filter((e) => (actor ? normalize(e.actor).includes(normalize(actor)) : true))
        .filter((e) => action === 'TOUTES' || e.action === action)
        .filter((e) =>
          object
            ? normalize(`${e.objectType} ${e.objectLabel} ${e.appCode ?? ''}`).includes(normalize(object))
            : true,
        )
        .filter((e) => (from ? DateTime.fromISO(e.date) >= from.startOf('day') : true))
        .filter((e) => (to ? DateTime.fromISO(e.date) <= to.endOf('day') : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [events, actor, action, object, from, to],
  )

  function exportCsv() {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-${DateTime.now().toFormat('yyyyLLdd-HHmm')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: GridColDef<AuditEvent>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 170,
      valueFormatter: (value: string) => fmtDateTime(value),
    },
    { field: 'actor', headerName: 'Acteur', width: 150 },
    {
      field: 'action',
      headerName: 'Action',
      width: 140,
      renderCell: (params: GridRenderCellParams<AuditEvent>) => (
        <Chip
          label={params.row.action}
          size="small"
          color={ACTION_COLORS[params.row.action] ?? 'default'}
          variant="outlined"
        />
      ),
    },
    { field: 'objectType', headerName: 'Objet', width: 130 },
    { field: 'objectLabel', headerName: 'Libellé', width: 160 },
    { field: 'appCode', headerName: 'Application', width: 120 },
    {
      field: 'envCode',
      headerName: 'Env.',
      width: 100,
      renderCell: (params: GridRenderCellParams<AuditEvent>) =>
        params.row.envCode ? (
          <Stack sx={{ justifyContent: 'center', height: '100%' }}>
            <EnvChip code={params.row.envCode} />
          </Stack>
        ) : null,
    },
    { field: 'details', headerName: 'Détails', flex: 1, minWidth: 220 },
  ]

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2">
          Audit
        </Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv}>
          Exporter CSV ({rows.length})
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Événements immuables : écritures et lectures par les microservices. Les valeurs des
        secrets sont masquées ; seul le fait du changement est tracé.
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Acteur" value={actor} onChange={(e) => setActor(e.target.value)} sx={{ width: 180 }} />
        <TextField
          select
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          sx={{ width: 170 }}
        >
          <MenuItem value="TOUTES">Toutes</MenuItem>
          {actions.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Objet" value={object} onChange={(e) => setObject(e.target.value)} sx={{ width: 200 }} />
        <DatePicker label="Du" value={from} onChange={setFrom} slotProps={{ textField: { size: 'small' } }} />
        <DatePicker label="Au" value={to} onChange={setTo} slotProps={{ textField: { size: 'small' } }} />
      </Stack>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
        pageSizeOptions={[15, 50, 100]}
        sx={{ bgcolor: 'background.paper' }}
      />
    </Stack>
  )
}
