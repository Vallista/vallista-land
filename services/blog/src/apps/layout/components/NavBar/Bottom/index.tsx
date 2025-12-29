import * as Styled from '../index.style'
import { NavBottom } from '@/../config/navbar'
import { useNavBar } from '../useNavBar'

export const Bottom = () => {
  const { moveToLocation } = useNavBar()
  const categories = NavBottom

  return (
    <nav className={Styled.wrapper}>
      {categories.map((it) => {
        if (it.path === '') return undefined

        return (
          <a className={Styled.category} key={it.name} onClick={() => moveToLocation(it.path, true)}>
            {it.icon}
          </a>
        )
      })}
    </nav>
  )
}
