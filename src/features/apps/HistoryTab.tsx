import CompareIcon from '@mui/icons-material/Compare'
import HistoryIcon from '@mui/icons-material/History'
import RestoreIcon from '@mui/icons-material/Restore'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILY_BY_ID, familyLabel } from '../../data/families'
import type { SettingVersion } from '../../types'
import { fmtDateTime, MASKED } from '../../utils/format'
import { rollback } from '../settings/settingsSlice'

interface HistoryTabProps {
  appId: string
  appCode: string
}

function isSecretField(family: string, fieldName: string): boolean {
  const def = FAMILY_BY_ID.get(family)
  return def?.fields.some((f) => f.name === fieldName && f.type === 'secret') ?? false
}

function display(family: string, key: string, value: unknown): string {
  if (isSecretField(family, key)) return MASKED
  if (Array.isArray(value)) return value.join(', ')
  return String(value ?? '')
}

interface DiffRow {
  key: string
  left: string
  right: string
  changed: boolean
}

function computeDiff(a: SettingVersion, b: SettingVersion): DiffRow[] {
  const keys = new Set([...Object.keys(a.values), ...Object.keys(b.values)])
  return [...keys].map((key) => {
    const left = display(a.family, key, a.values[key])
    const right = display(b.family, key, b.values[key])
    return { key, left, right, changed: left !== right }
  })
}

/** E09 – Historique et versions : liste, comparaison entre deux versions, rollback. */
export default function HistoryTab({ appId, appCode }: HistoryTabProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const versions = useAppSelector((s) => s.settings.versions)
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const appVersions = useMemo(
    () =>
      versions
        .filter((v) => v.appId === appId)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [versions, appId],
  )

  const selectedVersions = useMemo(
    () => appVersions.filter((v) => selected.includes(v.id)),
    [appVersions, selected],
  )

  const comparable =
    selectedVersions.length === 2 &&
    selectedVersions[0].family === selectedVersions[1].family &&
    selectedVersions[0].items === null &&
    selectedVersions[1].items === null

  const [older, newer] = useMemo(() => {
    const sorted = [...selectedVersions].sort((a, b) => a.version - b.version)
    return [sorted[0], sorted[1]]
  }, [selectedVersions])

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current.slice(-1), id],
    )
  }

  if (appVersions.length === 0) {
    return (
      <Alert severity="info" icon={<HistoryIcon />}>
        Aucune version publiée pour le moment.
      </Alert>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Cochez deux versions d&apos;une même famille pour les comparer.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CompareIcon />}
          disabled={!comparable}
          onClick={() => setCompareOpen(true)}
        >
          Comparer
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>Famille</TableCell>
            <TableCell>Environnement</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Publiée par</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appVersions.map((version) => (
            <TableRow key={version.id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.includes(version.id)}
                  onChange={() => toggle(version.id)}
                  slotProps={{ input: { 'aria-label': `Sélectionner la version ${version.version}` } }}
                />
              </TableCell>
              <TableCell>{familyLabel(version.family)}</TableCell>
              <TableCell>
                <EnvChip code={version.envCode} />
              </TableCell>
              <TableCell>
                <Chip label={`v${version.version}`} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{version.publishedBy}</TableCell>
              <TableCell>{fmtDateTime(version.publishedAt)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Republier cette version (rollback)">
                  <Button
                    size="small"
                    startIcon={<RestoreIcon />}
                    onClick={() =>
                      dispatch(
                        rollback({
                          versionId: version.id,
                          actor: user?.name ?? 'inconnu',
                          appCode,
                        }),
                      )
                    }
                  >
                    Rollback
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Comparaison — {older ? familyLabel(older.family) : ''} (v{older?.version} → v{newer?.version})
        </DialogTitle>
        <DialogContent>
          {older && newer && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Champ</TableCell>
                  <TableCell>v{older.version}</TableCell>
                  <TableCell>v{newer.version}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {computeDiff(older, newer).map((row) => (
                  <TableRow
                    key={row.key}
                    sx={row.changed ? { bgcolor: 'rgba(239, 108, 0, 0.12)' } : undefined}
                  >
                    <TableCell sx={{ fontWeight: row.changed ? 600 : 400 }}>{row.key}</TableCell>
                    <TableCell>{row.left}</TableCell>
                    <TableCell>{row.right}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
