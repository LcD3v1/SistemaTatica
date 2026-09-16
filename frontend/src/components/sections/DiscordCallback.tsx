import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function DiscordCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const contaId = params.get('contaId')
    const username = params.get('username')

    if (token && contaId && username) {
      setAuth(token, { contaId: Number(contaId), username })
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?reason=discord_erro', { replace: true })
    }
  }, [params, setAuth, navigate])

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white/70 font-mono text-sm">
      Autenticando via Discord…
    </div>
  )
}
