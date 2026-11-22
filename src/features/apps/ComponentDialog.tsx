import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { ComponentType } from '../../types'
import { addComponent } from './appsSlice'

const COMPONENT_TYPES: ComponentType[] = ['SERVICE', 'FRONTEND', 'BATCH', 'DATABASE', 'LIBRARY', 'AUTRE']

interface FormValues {
  code: string
  type: ComponentType
  name: string
  description: string
  repositoryUrl: string
  documentationUrl: string
}

interface ComponentDialogProps {
  appId: string
  open: boolean
  onClose: () => void
}

const URL_PATTERN = /^https?:\/\/.+/

/** F02 – Composant. */
export default function ComponentDialog({ appId, open, onClose }: ComponentDialogProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const components = useAppSelector((s) => s.apps.components)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      code: '',
      type: 'SERVICE',
      name: '',
      description: '',
      repositoryUrl: '',
      documentationUrl: '',
    },
  })

  function close() {
    reset()
    onClose()
  }

  function onSubmit(values: FormValues) {
    dispatch(
      addComponent({
        appId,
        code: values.code,
        type: values.type,
        name: values.name,
        description: values.description,
        repositoryUrl: values.repositoryUrl || undefined,
        documentationUrl: values.documentationUrl || undefined,
        actor: user?.name ?? 'inconnu',
      }),
    )
    close()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Ajouter un composant</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code *"
              {...register('code', {
                required: 'Le code est obligatoire.',
                validate: (value) =>
                  components.filter((c) => c.appId === appId).every((c) => c.code !== value) ||
                  "Ce code existe déjà dans l'application.",
              })}
              error={Boolean(errors.code)}
              helperText={errors.code?.message}
            />
            <TextField select label="Type *" defaultValue="SERVICE" {...register('type')}>
              {COMPONENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nom *"
              {...register('name', { required: 'Le nom est obligatoire.' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField label="Description" multiline minRows={2} {...register('description')} />
            <TextField
              label="Dépôt (URL)"
              {...register('repositoryUrl', {
                validate: (value) => !value || URL_PATTERN.test(value) || 'URL invalide.',
              })}
              error={Boolean(errors.repositoryUrl)}
              helperText={errors.repositoryUrl?.message}
            />
            <TextField
              label="Documentation (URL)"
              {...register('documentationUrl', {
                validate: (value) => !value || URL_PATTERN.test(value) || 'URL invalide.',
              })}
              error={Boolean(errors.documentationUrl)}
              helperText={errors.documentationUrl?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
