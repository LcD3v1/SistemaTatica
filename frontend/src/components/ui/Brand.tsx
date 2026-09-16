import { useLogo } from '@/hooks/useConfig'
import logoTatica from '@/assets/logo-tatica.png'

export default function Brand({ size = 56, className = '' }: { size?: number; className?: string }) {
  const { data: logoData } = useLogo()
  // Logo enviada nas Configurações tem prioridade; senão usa o emblema oficial da unidade.
  const src = logoData?.logo || logoTatica
  return (
    <img
      src={src}
      alt="Polícia Militar da Capital — Unidade Tática"
      width={size}
      height={size}
      className={`object-contain shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
