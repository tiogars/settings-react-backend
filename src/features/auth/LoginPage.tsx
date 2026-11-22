import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { loginDemo, loginSso } from './authSlice'

/**
 * E01 – Connexion : authentification SSO via l'IdP (simulée ici) et
 * **accès en mode démo** (jeu de données local, sans IdP).
 */
export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockOutlinedIcon />
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="h1">
                Settings — Backoffice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Distribution centralisée du paramétrage
              </Typography>
            </Box>
            <Alert severity="info" sx={{ width: '100%' }}>
              Accès réservé aux administrateurs. Aucun mot de passe local :
              l&apos;authentification passe par le fournisseur d&apos;identité (OIDC).
            </Alert>
            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={<VpnLockIcon />}
              onClick={() => dispatch(loginSso())}
            >
              Se connecter avec le SSO
            </Button>
            <Divider sx={{ width: '100%' }}>ou</Divider>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              color="secondary"
              startIcon={<PlayCircleOutlinedIcon />}
              onClick={() => dispatch(loginDemo())}
            >
              Accéder en mode démo
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Le mode démo charge un jeu de données fictif en local : explorez toutes les
              fonctionnalités sans compte ni backend. Aucune donnée réelle n&apos;est modifiée.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
