import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Controller, useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addEnvironment } from './appsSlice'

interface FormValues {
  code: string
  label: string
  rank: number
  protected: boolean
}

interface EnvironmentDialogProps {
  appId: string
  open: boolean
  onClose: () => void
}

/** F03 – Environnement. */
export default function EnvironmentDialog({ appId, open, onClose }: EnvironmentDialogProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const environments = useAppSelector((s) => s.apps.environments)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { code: '', label: '', rank: 1, protected: false },
  })

  function close() {
    reset()
    onClose()
  }

  function onSubmit(values: FormValues) {
    dispatch(
      addEnvironment({
        appId,
        code: values.code,
        label: values.label,
        rank: Number(values.rank),
        protected: values.protected,
        actor: user?.name ?? 'inconnu',
      }),
    )
    close()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>Ajouter un environnement</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code *"
              placeholder="dev, qa, preprod, prod…"
              {...register('code', {
                required: 'Le code est obligatoire.',
                validate: (value) =>
                  environments.filter((e) => e.appId === appId).every((e) => e.code !== value) ||
                  "Ce code existe déjà dans l'application.",
              })}
              error={Boolean(errors.code)}
              helperText={errors.code?.message}
            />
            <TextField
              label="Libellé *"
              {...register('label', { required: 'Le libellé est obligatoire.' })}
              error={Boolean(errors.label)}
              helperText={errors.label?.message}
            />
            <TextField
              label="Rang *"
              type="number"
              {...register('rank', {
                required: 'Le rang est obligatoire.',
                min: { value: 1, message: 'Rang ≥ 1.' },
              })}
              error={Boolean(errors.rank)}
              helperText={errors.rank?.message ?? 'Ordre de promotion.'}
            />
            <Controller
              name="protected"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={field.onChange} />}
                  label="Protégé (confirmation renforcée pour toute écriture)"
                />
              )}
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
