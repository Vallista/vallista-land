import styled from '@emotion/styled'
import { Button } from 'core'
import { VFC } from 'react'

const ButtonPlayground: VFC = () => {
  return (
    <>
      <TemporaryContainer>
        <Button size='small'>small + color</Button>
        <Button size='small' color='warning'>
          small + color
        </Button>
        <Button size='small' color='violet'>
          small + color
        </Button>
        <Button size='small' color='success'>
          small + color
        </Button>
        <Button size='small' color='error'>
          small + color
        </Button>
        <Button size='small' color='alert'>
          small + color
        </Button>
        <Button size='small' color='secondary'>
          small + color
        </Button>
      </TemporaryContainer>
      <TemporaryContainer>
        <Button variant='shadow'>medium + color + shadow</Button>
        <Button variant='shadow' color='warning'>
          medium + color + shadow
        </Button>
        <Button variant='shadow' color='violet'>
          medium + color + shadow
        </Button>
        <Button variant='shadow' color='success'>
          medium + color + shadow
        </Button>
        <Button variant='shadow' color='error'>
          medium + color + shadow
        </Button>
        <Button variant='shadow' color='alert'>
          medium + color + shadow
        </Button>
        <Button variant='shadow' color='secondary'>
          medium + color + shadow
        </Button>
      </TemporaryContainer>
      <TemporaryContainer>
        <Button size='large' variant='ghost'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='warning'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='violet'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='success'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='error'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='alert'>
          large + color + ghost
        </Button>
        <Button size='large' variant='ghost' color='secondary'>
          large + color + ghost
        </Button>
      </TemporaryContainer>
      <TemporaryContainer>
        <Button size='small' color='warning' variant='shadow' disabled>
          small + color + shadow + disabled
        </Button>
        <Button variant='ghost' color='violet' loading>
          medium + color + ghost + loading
        </Button>
        <Button width={210}>고정 크기 지정도 가능 넘어갈시 잘림</Button>
      </TemporaryContainer>
    </>
  )
}

// 김덕원: 겹쳐서 컴포넌트 확인하기가 힘들어가지고 추가했슴다..
const TemporaryContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 32px 0;
  padding: 0 8px;
`

export default ButtonPlayground