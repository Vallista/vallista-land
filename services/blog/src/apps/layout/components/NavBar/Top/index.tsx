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
    <nav className={Styled.wrapper}>
      {categories.map((it) => (
        <a
          className={isCategoryActive(it.id) ? Styled.categoryActive : Styled.category}
          key={it.name}
          onClick={() => changeCategory(it.id)}
        >
          {it.icon}
        </a>
      ))}
    </nav>
  )
}
