import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Controller, useForm, type Control, type FieldErrors } from 'react-hook-form'
import type { FamilyDef, FieldDef } from '../../data/families'
import type { FamilyValues, FieldValue } from '../../types'
import { MASKED } from '../../utils/format'

/**
 * E06 / F04 – Formulaire généré à partir du schéma de la famille.
 * Validation en direct ; secrets en écriture seule (masqués + « Remplacer »).
 */

interface GeneratedFamilyFormProps {
  family: FamilyDef
  envCode: string
  initialValues: FamilyValues
  publishedValues: FamilyValues | null
  onSaveDraft: (values: FamilyValues) => void
}

type FormShape = Record<string, FieldValue>

const HTTPS_PATTERN = /^https:\/\/.+/
const URL_PATTERN = /^https?:\/\/.+/

function fieldRules(field: FieldDef, envCode: string) {
  return {
    validate: (value: FieldValue) => {
      if (field.required && field.type !== 'secret' && (value === '' || value === undefined)) {
        return 'Champ obligatoire.'
      }
      if (field.type === 'int' && value !== '' && value !== undefined) {
        const n = Number(value)
        if (Number.isNaN(n)) return 'Nombre attendu.'
        if (field.min !== undefined && n < field.min) return `Minimum : ${field.min}.`
        if (field.max !== undefined && n > field.max) return `Maximum : ${field.max}.`
      }
      if (field.type === 'url' && typeof value === 'string' && value !== '') {
        const pattern = envCode === 'dev' ? URL_PATTERN : HTTPS_PATTERN
        if (!pattern.test(value)) {
          return envCode === 'dev' ? 'URL invalide.' : 'URL https obligatoire hors développement.'
        }
      }
      return true
    },
  }
}

interface SecretFieldProps {
  field: FieldDef
  control: Control<FormShape>
  hasExistingValue: boolean
  errors: FieldErrors<FormShape>
}

function SecretField({ field, control, hasExistingValue, errors }: SecretFieldProps) {
  const [replacing, setReplacing] = useState(!hasExistingValue)
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      {replacing ? (
        <Controller
          name={field.name}
          control={control}
          rules={{
            validate: (value) =>
              !field.required || hasExistingValue || value !== '' || 'Un secret obligatoire ne peut pas être vide.',
          }}
          render={({ field: rhf }) => (
            <TextField
              fullWidth
              type="password"
              label={`${field.label}${field.required ? ' *' : ''} 🔒`}
              value={typeof rhf.value === 'string' ? rhf.value : ''}
              onChange={rhf.onChange}
              autoComplete="new-password"
              error={Boolean(errors[field.name])}
              helperText={
                (errors[field.name]?.message as string | undefined) ??
                'Écriture seule : la valeur ne sera jamais réaffichée.'
              }
            />
          )}
        />
      ) : (
        <TextField
          fullWidth
          label={`${field.label} 🔒`}
          value={MASKED}
          disabled
          helperText="Secret enregistré ; remplacement uniquement."
        />
      )}
      {hasExistingValue && !replacing && (
        <Button size="small" onClick={() => setReplacing(true)} sx={{ mt: 1 }}>
          Remplacer
        </Button>
      )}
    </Stack>
  )
}

export default function GeneratedFamilyForm({
  family,
  envCode,
  initialValues,
  publishedValues,
  onSaveDraft,
}: GeneratedFamilyFormProps) {
  const [testResult, setTestResult] = useState<string | null>(null)
  const secretSentinel = ''

  const defaults: FormShape = {}
  for (const field of family.fields) {
    if (field.type === 'secret') {
      defaults[field.name] = secretSentinel
    } else {
      defaults[field.name] =
        initialValues[field.name] ??
        field.defaultValue ??
        (field.type === 'multiselect' || field.type === 'tags' ? [] : field.type === 'bool' ? false : '')
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<FormShape>({ mode: 'onChange', defaultValues: defaults })

  function onSubmit(values: FormShape) {
    const result: FamilyValues = {}
    for (const field of family.fields) {
      const value = values[field.name]
      if (field.type === 'secret') {
        // Secret inchangé : on conserve la valeur existante (écriture seule).
        result[field.name] = value === '' ? (initialValues[field.name] ?? '') : value
      } else if (field.type === 'int') {
        result[field.name] = value === '' ? 0 : Number(value)
      } else {
        result[field.name] = value
      }
    }
    onSaveDraft(result)
  }

  function modifiedHint(name: string): string | null {
    if (!publishedValues) return null
    if (dirtyFields[name]) return 'Modifié (non enregistré)'
    const published = publishedValues[name]
    const initial = initialValues[name]
    if (JSON.stringify(published) !== JSON.stringify(initial)) return 'Modifié par rapport à la version publiée'
    return null
  }

  const hasConnectionTest = family.id === 'database' || family.id === 'urls'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        {family.fields.map((field) => {
          const hint = modifiedHint(field.name)
          const label = `${field.label}${field.required ? ' *' : ''}`
          if (field.type === 'secret') {
            return (
              <SecretField
                key={field.name}
                field={field}
                control={control}
                hasExistingValue={Boolean(initialValues[field.name])}
                errors={errors}
              />
            )
          }
          return (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              rules={fieldRules(field, envCode)}
              render={({ field: rhf }) => {
                const error = errors[field.name]
                const helper =
                  (error?.message as string | undefined) ??
                  ([field.help, hint].filter(Boolean).join(' — ') || undefined)
                switch (field.type) {
                  case 'bool':
                    return (
                      <FormControlLabel
                        control={<Checkbox checked={Boolean(rhf.value)} onChange={(e) => rhf.onChange(e.target.checked)} />}
                        label={
                          <span>
                            {label}
                            {hint && (
                              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                                {hint}
                              </Typography>
                            )}
                          </span>
                        }
                      />
                    )
                  case 'select':
                    return (
                      <TextField
                        select
                        label={label}
                        value={rhf.value ?? ''}
                        onChange={rhf.onChange}
                        error={Boolean(error)}
                        helperText={helper}
                      >
                        {(field.options ?? []).map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    )
                  case 'multiselect':
                  case 'tags':
                    return (
                      <Autocomplete
                        multiple
                        freeSolo={field.type === 'tags'}
                        options={field.options ?? []}
                        value={Array.isArray(rhf.value) ? rhf.value : []}
                        onChange={(_, value) => rhf.onChange(value)}
                        renderInput={(params) => (
                          <TextField {...params} label={label} error={Boolean(error)} helperText={helper} />
                        )}
                      />
                    )
                  case 'int':
                    return (
                      <TextField
                        type="number"
                        label={label}
                        value={rhf.value ?? ''}
                        onChange={rhf.onChange}
                        error={Boolean(error)}
                        helperText={helper}
                      />
                    )
                  case 'textarea':
                    return (
                      <TextField
                        multiline
                        minRows={3}
                        label={label}
                        value={rhf.value ?? ''}
                        onChange={rhf.onChange}
                        error={Boolean(error)}
                        helperText={helper}
                      />
                    )
                  default:
                    return (
                      <TextField
                        label={label}
                        value={rhf.value ?? ''}
                        onChange={rhf.onChange}
                        error={Boolean(error)}
                        helperText={helper}
                      />
                    )
                }
              }}
            />
          )
        })}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained">
            Enregistrer le brouillon
          </Button>
          {hasConnectionTest && (
            <Button
              variant="outlined"
              onClick={() => setTestResult('Test de connexion réussi (simulation en mode démo).')}
            >
              Tester la connexion
            </Button>
          )}
        </Stack>
      </Stack>
      <Snackbar
        open={testResult !== null}
        autoHideDuration={4000}
        onClose={() => setTestResult(null)}
        message={testResult}
      />
    </form>
  )
}
