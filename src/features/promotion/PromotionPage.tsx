import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILY_BY_ID, familyLabel } from '../../data/families'
import type { PromotionMode, SettingSet } from '../../types'
import { MASKED } from '../../utils/format'
import { applyPromotion } from '../settings/settingsSlice'

type DiffStatus = 'AJOUT' | 'MODIFICATION' | 'CONSERVE'

interface DiffRow {
  family: string
  key: string
  sourceValue: string
  targetValue: string
  status: DiffStatus
}

const STATUS_COLORS: Record<DiffStatus, string> = {
  AJOUT: 'rgba(46, 125, 50, 0.12)',
  MODIFICATION: 'rgba(239, 108, 0, 0.12)',
  CONSERVE: 'transparent',
}

function isSecretKey(family: string, key: string): boolean {
  const def = FAMILY_BY_ID.get(family)
  return def?.fields.some((f) => f.name === key && f.type === 'secret') ?? false
}

function displayValue(family: string, key: string, value: unknown, secret?: boolean): string {
  if (secret || isSecretKey(family, key)) return MASKED
  if (value === undefined) return '—'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function computeFamilyDiff(family: string, source: SettingSet, target: SettingSet | undefined): DiffRow[] {
  const rows: DiffRow[] = []
  if (source.publishedValues !== null) {
    const targetValues = target?.publishedValues ?? {}
    for (const [key, value] of Object.entries(source.publishedValues)) {
      const targetValue = targetValues[key]
      const status: DiffStatus =
        targetValue === undefined
          ? 'AJOUT'
          : JSON.stringify(targetValue) !== JSON.stringify(value)
            ? 'MODIFICATION'
            : 'CONSERVE'
      rows.push({
        family,
        key,
        sourceValue: displayValue(family, key, value),
        targetValue: displayValue(family, key, targetValue),
        status,
      })
    }
  }
  if (source.publishedItems !== null) {
    const targetItems = target?.publishedItems ?? []
    for (const item of source.publishedItems) {
      const match = targetItems.find((t) => t.category === item.category && t.key === item.key)
      const status: DiffStatus =
        match === undefined ? 'AJOUT' : match.value !== item.value ? 'MODIFICATION' : 'CONSERVE'
      rows.push({
        family,
        key: `${item.category}/${item.key}`,
        sourceValue: displayValue(family, item.key, item.value, item.secret),
        targetValue: match ? displayValue(family, match.key, match.value, match.secret) : '—',
        status,
      })
    }
  }
  return rows
}

/** E08 – Comparaison et recopie : source/cible, mode, périmètre, écarts, confirmation renforcée. */
export default function PromotionPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { applications, environments } = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)

  const activeApps = applications.filter((a) => a.status === 'ACTIVE')
  const [appId, setAppId] = useState(activeApps[0]?.id ?? '')
  const [sourceEnv, setSourceEnv] = useState('')
  const [targetEnv, setTargetEnv] = useState('')
  const [mode, setMode] = useState<PromotionMode>('FUSIONNER')
  const [includeSecrets, setIncludeSecrets] = useState(false)
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([])
  const [preview, setPreview] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [done, setDone] = useState(false)

  const app = applications.find((a) => a.id === appId)
  const appEnvironments = useMemo(
    () => environments.filter((e) => e.appId === appId).sort((a, b) => a.rank - b.rank),
    [environments, appId],
  )
  const target = appEnvironments.find((e) => e.code === targetEnv)

  const sourceFamilies = useMemo(
    () =>
      sets
        .filter(
          (s) =>
            s.appId === appId &&
            s.envCode === sourceEnv &&
            s.componentId === null &&
            (s.publishedValues !== null || s.publishedItems !== null),
        )
        .map((s) => s.family),
    [sets, appId, sourceEnv],
  )

  const diffs = useMemo(() => {
    if (!preview) return []
    const rows: DiffRow[] = []
    for (const family of selectedFamilies) {
      const source = sets.find(
        (s) => s.appId === appId && s.envCode === sourceEnv && s.componentId === null && s.family === family,
      )
      if (!source) continue
      const targetSet = sets.find(
        (s) => s.appId === appId && s.envCode === targetEnv && s.componentId === null && s.family === family,
      )
      rows.push(...computeFamilyDiff(family, source, targetSet))
    }
    return rows
  }, [preview, selectedFamilies, sets, appId, sourceEnv, targetEnv])

  const changeCount = diffs.filter((d) => d.status !== 'CONSERVE').length

  function toggleFamily(family: string) {
    setSelectedFamilies((current) =>
      current.includes(family) ? current.filter((f) => f !== family) : [...current, family],
    )
    setPreview(false)
  }

  function execute() {
    if (!app) return
    dispatch(
      applyPromotion({
        appId,
        appCode: app.code,
        sourceEnv,
        targetEnv,
        mode,
        families: selectedFamilies,
        includeSecrets,
        actor: user?.name ?? 'inconnu',
      }),
    )
    setConfirmOpen(false)
    setConfirmText('')
    setPreview(false)
    setDone(true)
  }

  function requestExecute() {
    if (target?.protected) setConfirmOpen(true)
    else execute()
  }

  const ready = appId && sourceEnv && targetEnv && sourceEnv !== targetEnv && selectedFamilies.length > 0

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h2">
        Comparaison et recopie
      </Typography>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Application *"
              value={appId}
              onChange={(e) => {
                setAppId(e.target.value)
                setSourceEnv('')
                setTargetEnv('')
                setSelectedFamilies([])
                setPreview(false)
              }}
              sx={{ minWidth: 200 }}
            >
              {activeApps.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Source *"
              value={sourceEnv}
              onChange={(e) => { setSourceEnv(e.target.value); setSelectedFamilies([]); setPreview(false) }}
              sx={{ minWidth: 160 }}
            >
              {appEnvironments.map((env) => (
                <MenuItem key={env.id} value={env.code}>
                  {env.label} ({env.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Cible *"
              value={targetEnv}
              onChange={(e) => { setTargetEnv(e.target.value); setPreview(false) }}
              sx={{ minWidth: 160 }}
            >
              {appEnvironments
                .filter((env) => env.code !== sourceEnv)
                .map((env) => (
                  <MenuItem key={env.id} value={env.code}>
                    {env.label} ({env.code}) {env.protected ? '🔒' : ''}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Mode *"
              value={mode}
              onChange={(e) => setMode(e.target.value as PromotionMode)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="CREER">Créer</MenuItem>
              <MenuItem value="FUSIONNER">Fusionner</MenuItem>
              <MenuItem value="REMPLACER">Remplacer</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox checked={includeSecrets} onChange={(e) => setIncludeSecrets(e.target.checked)} />
              }
              label="Inclure les secrets"
            />
          </Stack>
          {sourceEnv && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Périmètre (familles publiées dans la source)</Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {sourceFamilies.map((family) => (
                  <Chip
                    key={family}
                    label={familyLabel(family)}
                    color={selectedFamilies.includes(family) ? 'primary' : 'default'}
                    variant={selectedFamilies.includes(family) ? 'filled' : 'outlined'}
                    onClick={() => toggleFamily(family)}
                  />
                ))}
                {sourceFamilies.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aucune famille publiée dans cet environnement.
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" disabled={!ready} onClick={() => setPreview(true)}>
              Prévisualiser les écarts
            </Button>
            <Button variant="contained" disabled={!ready || !preview} onClick={requestExecute}>
              Recopier vers {targetEnv || '…'}
            </Button>
          </Stack>
          {!includeSecrets && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Les secrets ne sont pas recopiés par défaut : les valeurs existantes de la cible sont conservées.
            </Alert>
          )}
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Écarts</Typography>
              <EnvChip code={sourceEnv} />
              <Typography>→</Typography>
              <EnvChip code={targetEnv} />
              <Chip label={`${changeCount} changement(s)`} size="small" color={changeCount > 0 ? 'warning' : 'default'} />
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Famille</TableCell>
                  <TableCell>Clé</TableCell>
                  <TableCell>Valeur source ({sourceEnv})</TableCell>
                  <TableCell>Valeur cible ({targetEnv})</TableCell>
                  <TableCell>Écart</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diffs.map((row) => (
                  <TableRow key={`${row.family}-${row.key}`} sx={{ bgcolor: STATUS_COLORS[row.status] }}>
                    <TableCell>{familyLabel(row.family)}</TableCell>
                    <TableCell>{row.key}</TableCell>
                    <TableCell>{row.sourceValue}</TableCell>
                    <TableCell>{row.targetValue}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status === 'CONSERVE' ? 'conservé' : row.status.toLowerCase()}
                        size="small"
                        color={row.status === 'AJOUT' ? 'success' : row.status === 'MODIFICATION' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Recopie vers un environnement protégé</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            La cible « {target?.label} » est protégée. Saisissez son code (
            <strong>{target?.code}</strong>) pour confirmer la recopie.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Code de l'environnement"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button variant="contained" color="error" disabled={confirmText !== target?.code} onClick={execute}>
            Confirmer la recopie
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={done}
        autoHideDuration={5000}
        onClose={() => setDone(false)}
        message="Recopie effectuée et publiée. Consultez l'historique pour le détail."
      />
    </Stack>
  )
}
