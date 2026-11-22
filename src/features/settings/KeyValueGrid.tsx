import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Button from '@mui/material/Button'
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
import { nextId } from '../../data/demo'
import type { KeyValueItem, SettingType } from '../../types'
import { MASKED } from '../../utils/format'

const SETTING_TYPES: SettingType[] = ['STRING', 'INT', 'BOOL', 'URL', 'JSON', 'SECRET']

interface KeyValueGridProps {
  items: KeyValueItem[]
  onSaveDraft: (items: KeyValueItem[]) => void
}

/** E07 – Éditeur Key/Value : catégories, grille éditable en ligne, ajout/suppression. */
export default function KeyValueGrid({ items, onSaveDraft }: KeyValueGridProps) {
  const [rows, setRows] = useState<KeyValueItem[]>(items)
  const [category, setCategory] = useState('TOUTES')
  const [dirty, setDirty] = useState(false)

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort(),
    [rows],
  )

  const visibleRows = useMemo(
    () => (category === 'TOUTES' ? rows : rows.filter((r) => r.category === category)),
    [rows, category],
  )

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: nextId('kv'),
        category: category === 'TOUTES' ? 'general' : category,
        key: '',
        type: 'STRING',
        value: '',
        secret: false,
        description: '',
      },
    ])
    setDirty(true)
  }

  function deleteRow(id: string) {
    setRows((current) => current.filter((r) => r.id !== id))
    setDirty(true)
  }

  function processRowUpdate(updated: KeyValueItem): KeyValueItem {
    const next = { ...updated, secret: updated.type === 'SECRET' }
    setRows((current) => current.map((r) => (r.id === next.id ? next : r)))
    setDirty(true)
    return next
  }

  const columns: GridColDef<KeyValueItem>[] = [
    { field: 'category', headerName: 'Catégorie', width: 170, editable: true },
    { field: 'key', headerName: 'Clé', width: 200, editable: true },
    {
      field: 'type',
      headerName: 'Type',
      width: 110,
      editable: true,
      type: 'singleSelect',
      valueOptions: SETTING_TYPES,
    },
    {
      field: 'value',
      headerName: 'Valeur',
      flex: 1,
      minWidth: 180,
      editable: true,
      renderCell: (params: GridRenderCellParams<KeyValueItem>) =>
        params.row.secret ? MASKED : params.row.value,
    },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 160, editable: true },
    {
      field: 'actions',
      type: 'actions',
      width: 70,
      getActions: (params: GridRowParams<KeyValueItem>) => [
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => deleteRow(params.row.id)}
        />,
      ],
    },
  ]

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <TextField
          select
          label="Catégorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ width: 220 }}
        >
          <MenuItem value="TOUTES">Toutes</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addRow}>
          Ajouter un paramètre
        </Button>
        <Button variant="contained" disabled={!dirty} onClick={() => { onSaveDraft(rows); setDirty(false) }}>
          Enregistrer le brouillon
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Double-cliquez sur une cellule pour l&apos;éditer. Une clé est unique dans sa catégorie ;
        les valeurs de type SECRET sont masquées.
      </Typography>
      <DataGrid
        rows={visibleRows}
        columns={columns}
        autoHeight
        processRowUpdate={processRowUpdate}
        disableRowSelectionOnClick
        hideFooter={visibleRows.length <= 25}
        sx={{ bgcolor: 'background.paper' }}
      />
    </Stack>
  )
}
