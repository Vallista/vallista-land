import * as Styled from './Sidebar.style'
import { Text } from '@vallista/design-system'

interface Props {
  name: string
  slug: string
  isActive: boolean
  onClick: () => void
}

export const PostItem = (props: Props) => {
  const { name, isActive, onClick } = props

  return (
    <Styled._ListStyleItem isActive={isActive} onClick={onClick}>
      <div>
        <svg
          viewBox='0 0 24 24'
          width='20'
          height='20'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z' />
          <path d='M13 2v7h7' />
        </svg>
      </div>
      <Text>{name}</Text>
    </Styled._ListStyleItem>
  )
}
