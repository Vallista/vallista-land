import { Button, Colors, Container, Progress, Spacer } from '@vallista/core'
import { useState, VFC } from 'react'

const ProgressPlayground: VFC = () => {
  const [value, setValue] = useState(0)

  return (
    <Container>
      <Container>
        <Progress value={30} />
      </Container>
      <Spacer />
      <Container>
        <Progress value={30} max={40} />
      </Container>
      <Spacer />
      <Container>
        <Progress value={10} type='primary' />
        <Progress value={20} type='secondary' />
        <Progress value={30} type='success' />
        <Progress value={40} type='warning' />
        <Progress value={50} type='error' />
      </Container>
      <Spacer />
      <Container>
        <Progress
          value={value}
          colors={{
            0: Colors.PRIMARY.FOREGROUND,
            25: Colors.PRIMARY.ACCENT_5,
            50: Colors.WARNING.DEFAULT,
            75: Colors.HIGHLIGHT.PINK,
            100: Colors.SUCCESS.DEFAULT
          }}
        />
        <Container row>
          <Button
            onClick={() => {
              if (value < 100) setValue(value + 10)
            }}
            size='medium'
          >
            Increase
          </Button>

          <Button
            onClick={() => {
              if (value > 0) setValue(value - 10)
            }}
            color='secondary'
          >
            Decrease
          </Button>
        </Container>
      </Container>
    </Container>
  )
}

export default ProgressPlayground
