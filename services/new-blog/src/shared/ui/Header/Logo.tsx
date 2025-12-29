import { useNavigate } from 'react-router-dom'
import { Text, Spacer } from '@vallista/design-system'
import LogoIcon from '@/assets/icons/logo.svg?react'
import * as Styled from './Header.css'

export const Logo = () => {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <button onClick={handleLogoClick} className={Styled.wrap}>
      <LogoIcon />
      <Spacer x={0.5} />
      <div className={Styled.logoText}>
        <Text size={20} weight={700} color='primary'>
          vallista.dev
        </Text>
      </div>
    </button>
  )
}
