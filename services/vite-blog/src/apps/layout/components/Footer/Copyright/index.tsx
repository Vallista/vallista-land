import { Spacer, Text } from '@vallista/design-system'
import { Link } from 'react-router-dom'

import * as Styled from '../index.style'

export const Copyright = () => {
  const nowYear = new Date().getFullYear()

  return (
    <Styled._FooterAllRightReserve>
      <Text as='span' size={12}>
        Copyright ⓒ {nowYear} <Link to='https://vallista.kr'>Vallista</Link> All rights reserved.
      </Text>
      <Spacer y={0.1} />
      <Text as='span' size={12}>
        Created by <Link to='https://vallista.kr'>@Vallista</Link>. Powered By{' '}
        <Link to='https://github.com/Vallista/vallista-land'>@Vallista-land</Link>
      </Text>
      <Spacer y={0.5} />
    </Styled._FooterAllRightReserve>
  )
}
