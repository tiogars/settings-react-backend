import AddIcon from '@mui/icons-material/Add'
import ArchiveIcon from '@mui/icons-material/Archive'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowParams,
} from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILIES } from '../../data/families'
import type { Application } from '../../types'
import { fmtRelative } from '../../utils/format'
import { normalize } from '../../utils/search'
import { toggleArchive, toggleFavorite } from './appsSlice'
import CreateApplicationDialog from './CreateApplicationDialog'

interface Row extends Application {
  envCodes: string[]
  completeness: number
}

/** E03 – Liste des applications : filtres, pastilles d'environnement, complétude. */
export default function ApplicationsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const { applications, environments } = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'TOUS' | 'ACTIVE' | 'ARCHIVED'>('TOUS')
  const [createOpen, setCreateOpen] = useState(false)

  const rows = useMemo<Row[]>(() => {
    return applications
      .filter((app) => status === 'TOUS' || app.status === status)
      .filter((app) =>
        text
          ? normalize(`${app.code} ${app.name} ${app.owner} ${app.description}`).includes(normalize(text))
          : true,
      )
      .map((app) => ({
        ...app,
        envCodes: environments.filter((e) => e.appId === app.id).map((e) => e.code),
        completeness: new Set(
          sets
            .filter(
              (s) => s.appId === app.id && (s.publishedValues !== null || s.publishedItems !== null),
            )
            .map((s) => s.family),
        ).size,
      }))
  }, [applications, environments, sets, text, status])

  const columns: GridColDef<Row>[] = [
    { field: 'code', headerName: 'Code', width: 140 },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 160 },
    { field: 'owner', headerName: 'Propriétaire', width: 170 },
    {
      field: 'envCodes',
      headerName: 'Environnements',
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Row>) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          {params.row.envCodes.map((code) => (
            <EnvChip key={code} code={code} />
          ))}
        </Stack>
      ),
    },
    {
      field: 'completeness',
      headerName: 'Complétude',
      width: 160,
      renderCell: (params: GridRenderCellParams<Row>) => (
        <Stack spacing={0.5} sx={{ justifyContent: 'center', height: '100%', width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={(params.row.completeness / FAMILIES.length) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption">
            {params.row.completeness}/{FAMILIES.length} familles
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<Row>) => (
        <Chip
          label={params.row.status === 'ACTIVE' ? 'Active' : 'Archivée'}
          color={params.row.status === 'ACTIVE' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'updatedAt',
      headerName: 'Dernière modification',
      width: 180,
      valueFormatter: (value: string) => fmtRelative(value),
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params: GridRowParams<Row>) => [
        <GridActionsCellItem
          key="fav"
          icon={params.row.favorite ? <StarIcon sx={{ color: '#f9a825' }} /> : <StarBorderIcon />}
          label="Favori"
          onClick={() => dispatch(toggleFavorite(params.row.id))}
        />,
        <GridActionsCellItem
          key="archive"
          icon={params.row.status === 'ACTIVE' ? <ArchiveIcon /> : <UnarchiveIcon />}
          label={params.row.status === 'ACTIVE' ? 'Archiver' : 'Restaurer'}
          onClick={() =>
            dispatch(toggleArchive({ id: params.row.id, actor: user?.name ?? 'inconnu' }))
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
          Applications
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Créer une application
        </Button>
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Rechercher (code, nom, propriétaire)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ width: 320 }}
        />
        <TextField
          select
          label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          sx={{ width: 160 }}
        >
          <MenuItem value="TOUS">Tous</MenuItem>
          <MenuItem value="ACTIVE">Actives</MenuItem>
          <MenuItem value="ARCHIVED">Archivées</MenuItem>
        </TextField>
      </Stack>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        onRowClick={(params: GridRowParams<Row>) => navigate(`/applications/${params.row.id}`)}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        sx={{ bgcolor: 'background.paper', '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />
      <CreateApplicationDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Stack>
  )
}
