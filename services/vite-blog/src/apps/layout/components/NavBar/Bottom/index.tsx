import * as Styled from '../index.style'
import { NavBottom } from '@/../config/navbar'
import { useNavBar } from '../useNavBar'

export const Bottom = () => {
  const { moveToLocation } = useNavBar()
  const categories = NavBottom

  return (
    <Styled._Wrapper>
      {categories.map((it) => {
        if (it.path === '') return undefined

        return (
          <Styled._Category key={it.name} onClick={() => moveToLocation(it.path, true)}>
            {it.icon}
          </Styled._Category>
        )
      })}
    </Styled._Wrapper>
  )
}
