import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import EnvChip from '../../components/EnvChip'
import { FAMILIES, FAMILY_BY_ID, familyDefaults } from '../../data/families'
import type { FamilyValues, KeyValueItem, SettingSet } from '../../types'
import { MASKED } from '../../utils/format'
import GeneratedFamilyForm from './GeneratedFamilyForm'
import KeyValueGrid from './KeyValueGrid'
import { discardDraft, publish, saveDraft } from './settingsSlice'

function familyStateLabel(set: SettingSet | undefined): string {
  if (!set || (set.publishedValues === null && set.publishedItems === null && set.draftValues === null && set.draftItems === null)) {
    return '—'
  }
  if (set.draftValues !== null || set.draftItems !== null) return '● brouillon'
  return `✓ v${set.version}`
}

function maskedPreview(familyId: string, values: FamilyValues | null, items: KeyValueItem[] | null): string {
  if (items !== null) {
    return JSON.stringify(
      items.map((item) => ({ ...item, value: item.secret ? MASKED : item.value })),
      null,
      2,
    )
  }
  if (values === null) return '{}'
  const def = FAMILY_BY_ID.get(familyId)
  const secretFields = new Set((def?.fields ?? []).filter((f) => f.type === 'secret').map((f) => f.name))
  const masked = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, secretFields.has(key) ? MASKED : value]),
  )
  return JSON.stringify(masked, null, 2)
}

/** E06 – Éditeur de paramétrage : arbre des familles, formulaire généré, bandeau brouillon, aperçu JSON. */
export default function SettingsEditorPage() {
  const { appId, envCode } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAppSelector((s) => s.auth.user)
  const { applications, environments } = useAppSelector((s) => s.apps)
  const sets = useAppSelector((s) => s.settings.sets)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const app = applications.find((a) => a.id === appId)
  const environment = environments.find((e) => e.appId === appId && e.code === envCode)
  const familyId = searchParams.get('famille') ?? 'database'
  const family = FAMILY_BY_ID.get(familyId) ?? FAMILIES[0]

  if (!app || !environment || !envCode || !appId) {
    return <Typography>Application ou environnement introuvable.</Typography>
  }

  const appEnvironments = environments.filter((e) => e.appId === appId)
  const currentSet = sets.find(
    (s) => s.appId === appId && s.envCode === envCode && s.componentId === null && s.family === family.id,
  )
  const hasDraft = currentSet !== undefined && (currentSet.draftValues !== null || currentSet.draftItems !== null)
  const actor = user?.name ?? 'inconnu'

  const initialValues: FamilyValues =
    currentSet?.draftValues ?? currentSet?.publishedValues ?? familyDefaults(family)
  const initialItems: KeyValueItem[] = currentSet?.draftItems ?? currentSet?.publishedItems ?? []

  function doSaveDraft(values: FamilyValues | null, items: KeyValueItem[] | null) {
    if (!app) return
    dispatch(
      saveDraft({
        appId: app.id,
        envCode: environment!.code,
        componentId: null,
        family: family.id,
        values,
        items,
        actor,
        appCode: app.code,
      }),
    )
  }

  function doPublish() {
    if (!currentSet || !app) return
    if (environment!.protected && confirmText !== environment!.code) return
    dispatch(publish({ setId: currentSet.id, actor, appCode: app.code }))
    setConfirmOpen(false)
    setConfirmText('')
  }

  function requestPublish() {
    if (environment!.protected) {
      setConfirmOpen(true)
    } else {
      doPublish()
    }
  }

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="Fil d'Ariane">
        <Link component={RouterLink} to="/applications" underline="hover">
          Applications
        </Link>
        <Link component={RouterLink} to={`/applications/${app.id}`} underline="hover">
          {app.name}
        </Link>
        <Typography color="text.primary">Paramétrage — {family.label}</Typography>
      </Breadcrumbs>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="h4" component="h2">
          Éditeur de paramétrage
        </Typography>
        <EnvChip code={environment.code} size="medium" />
        <TextField
          select
          size="small"
          label="Environnement"
          value={environment.code}
          onChange={(e) =>
            navigate(`/applications/${app.id}/settings/${e.target.value}?famille=${family.id}`)
          }
          sx={{ width: 180 }}
        >
          {appEnvironments.map((env) => (
            <MenuItem key={env.id} value={env.code}>
              {env.label} ({env.code})
            </MenuItem>
          ))}
        </TextField>
        {environment.protected && (
          <Chip label="environnement protégé" color="error" variant="outlined" size="small" />
        )}
      </Stack>

      {hasDraft && (
        <Alert
          severity="warning"
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={requestPublish}>
                Publier
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  currentSet && dispatch(discardDraft({ setId: currentSet.id, actor, appCode: app.code }))
                }
              >
                Annuler
              </Button>
            </Stack>
          }
        >
          Modifications non publiées (brouillon). Les microservices ne voient que la dernière
          version publiée (v{currentSet?.version}).
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Card sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Familles de paramètres
            </Typography>
            <SimpleTreeView
              selectedItems={`family-${family.id}`}
              defaultExpandedItems={['scope-app']}
              onSelectedItemsChange={(_, itemId) => {
                if (typeof itemId === 'string' && itemId.startsWith('family-')) {
                  setSearchParams({ famille: itemId.slice('family-'.length) })
                }
              }}
            >
              <TreeItem itemId="scope-app" label={`${app.code} (application)`}>
                {FAMILIES.map((f) => {
                  const set = sets.find(
                    (s) =>
                      s.appId === app.id &&
                      s.envCode === envCode &&
                      s.componentId === null &&
                      s.family === f.id,
                  )
                  return (
                    <TreeItem
                      key={f.id}
                      itemId={`family-${f.id}`}
                      label={`${f.label}  ${familyStateLabel(set)}`}
                    />
                  )
                })}
              </TreeItem>
            </SimpleTreeView>
          </CardContent>
        </Card>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {family.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {family.description} — version publiée : {currentSet?.publishedValues !== null || currentSet?.publishedItems !== null ? `v${currentSet?.version ?? 0}` : 'aucune'}
              </Typography>
              {family.keyValue ? (
                <KeyValueGrid
                  key={`${family.id}-${envCode}-${currentSet?.updatedAt ?? 'new'}`}
                  items={initialItems}
                  onSaveDraft={(items) => doSaveDraft(null, items)}
                />
              ) : (
                <GeneratedFamilyForm
                  key={`${family.id}-${envCode}-${currentSet?.updatedAt ?? 'new'}`}
                  family={family}
                  envCode={envCode}
                  initialValues={initialValues}
                  publishedValues={currentSet?.publishedValues ?? null}
                  onSaveDraft={(values) => doSaveDraft(values, null)}
                />
              )}
            </CardContent>
          </Card>
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Aperçu JSON (secrets masqués)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{ m: 0, p: 2, bgcolor: '#263238', color: '#eceff1', borderRadius: 1, overflow: 'auto', fontSize: 13 }}
              >
                {maskedPreview(
                  family.id,
                  currentSet?.draftValues ?? currentSet?.publishedValues ?? null,
                  currentSet?.draftItems ?? currentSet?.publishedItems ?? null,
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Publication en environnement protégé</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Vous publiez vers « {environment.label} ». Saisissez le code de
            l&apos;environnement (<strong>{environment.code}</strong>) pour confirmer.
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
          <Button variant="contained" color="error" disabled={confirmText !== environment.code} onClick={doPublish}>
            Publier en {environment.code}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
