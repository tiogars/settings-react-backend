import Chip from '@mui/material/Chip'
import { envColor } from '../data/demo'

interface EnvChipProps {
  code: string
  size?: 'small' | 'medium'
}

/** Pastille d'environnement : couleur + code (couleur doublée d'un texte, accessibilité). */
export default function EnvChip({ code, size = 'small' }: EnvChipProps) {
  const color = envColor(code)
  return (
    <Chip
      label={code}
      size={size}
      sx={{
        bgcolor: color,
        color: '#fff',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    />
  )
}
