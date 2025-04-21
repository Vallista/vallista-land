import * as Styled from '../index.style'
import { NavTop } from '@/../config/navbar'
import { useNavBar } from '../useNavBar'

export const Top = () => {
  const { selectedCategory, changeCategory } = useNavBar()
  const categories = NavTop

  const isCategoryActive = (target: string) => {
    return selectedCategory === target
  }

  return (
    <Styled._Wrapper>
      {categories.map((it) => (
        <Styled._Category checked={isCategoryActive(it.id)} key={it.name} onClick={() => changeCategory(it.id)}>
          {it.icon}
        </Styled._Category>
      ))}
    </Styled._Wrapper>
  )
}
