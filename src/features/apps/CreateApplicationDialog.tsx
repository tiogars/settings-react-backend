import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { createApplication } from './appsSlice'

interface FormValues {
  code: string
  name: string
  description: string
  owner: string
}

interface CreateApplicationDialogProps {
  open: boolean
  onClose: () => void
}

/** F01 – Application : validation en direct conforme aux règles de `formulaires.md`. */
export default function CreateApplicationDialog({ open, onClose }: CreateApplicationDialogProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const applications = useAppSelector((s) => s.apps.applications)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { code: '', name: '', description: '', owner: '' },
  })

  function close() {
    reset()
    onClose()
  }

  function onSubmit(values: FormValues) {
    dispatch(createApplication({ ...values, actor: user?.name ?? 'inconnu' }))
    close()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Créer une application</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code *"
              {...register('code', {
                required: 'Le code est obligatoire.',
                pattern: {
                  value: /^[a-z0-9-]{2,40}$/,
                  message: 'Format attendu : [a-z0-9-], 2 à 40 caractères.',
                },
                validate: (value) =>
                  applications.every((a) => a.code !== value) || 'Ce code existe déjà.',
              })}
              error={Boolean(errors.code)}
              helperText={errors.code?.message ?? 'Non modifiable après création.'}
            />
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
              label="Description"
              multiline
              minRows={3}
              {...register('description', {
                maxLength: { value: 2000, message: '2000 caractères maximum.' },
              })}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Markdown accepté.'}
            />
            <TextField
              label="Propriétaire / équipe *"
              {...register('owner', { required: 'Le propriétaire est obligatoire.' })}
              error={Boolean(errors.owner)}
              helperText={errors.owner?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            Créer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
