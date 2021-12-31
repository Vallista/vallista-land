import { Container, Badge } from '@vallista-land/core'
import { VFC } from 'react'

const BadgePlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <div>
          <Badge size='small'>Small</Badge>
        </div>
        <div>
          <Badge>Small</Badge>
        </div>
        <div>
          <Badge size='large'>Small</Badge>
        </div>
      </Container>
      <Container row>
        <Badge type='primary'>50</Badge>
        <Badge type='secondary'>50</Badge>
        <Badge type='success'>50</Badge>
        <Badge type='warning'>50</Badge>
        <Badge type='error'>50</Badge>
        <Badge type='violet'>50</Badge>
      </Container>
      <Container row>
        <Badge type='primary' outline>
          100
        </Badge>
        <Badge type='secondary' outline>
          100
        </Badge>
        <Badge type='success' outline>
          100
        </Badge>
        <Badge type='warning' outline>
          100
        </Badge>
        <Badge type='error' outline>
          100
        </Badge>
        <Badge type='violet' outline>
          100
        </Badge>
      </Container>
      <Container row>
        <Badge type='primary' variant='contrast'>
          150
        </Badge>
        <Badge type='secondary' variant='contrast'>
          150
        </Badge>
        <Badge type='success' variant='contrast'>
          150
        </Badge>
        <Badge type='warning' variant='contrast'>
          150
        </Badge>
        <Badge type='error' variant='contrast'>
          150
        </Badge>
        <Badge type='violet' variant='contrast'>
          150
        </Badge>
      </Container>
    </Container>
  )
}

export default BadgePlayground
