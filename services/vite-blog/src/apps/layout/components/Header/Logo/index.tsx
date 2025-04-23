import { Spacer, Text } from '@vallista/design-system'
import * as Styled from './index.style'

import LogoIcon from '@/assets/icons/logo.svg?react'
import { useNavigate } from 'react-router-dom'
import { useGlobalProvider } from '@/context/useProvider'
import { useScrollTo } from '@/hooks/useScrollTo'

export const Logo = () => {
  const { dispatch } = useGlobalProvider()
  const navigate = useNavigate()
  const { scrollToTop } = useScrollTo()

  const moveToHome = () => {
    navigate('/')
    scrollToTop(false)
    dispatch({
      type: 'changeMobileSidebarVisible',
      visible: false
    })
  }

  return (
    <Styled._Wrap onClick={moveToHome}>
      <LogoIcon />
      <Spacer x={0.5} />
      <Text size={20} weight={800}>
        vallista.dev
      </Text>
    </Styled._Wrap>
  )
}
