import { Container, Radio } from '@vallista/core'
import { VFC } from 'react'

const RadioPlayground: VFC = () => {
  return (
    <Container row>
      <Container center>
        <Radio.RadioGroup>
          <Container>
            <Container>
              <Radio.Radio value='col1'>Hello</Radio.Radio>
            </Container>
            <Container>
              <Radio.Radio value='col2'>World</Radio.Radio>
            </Container>
          </Container>
        </Radio.RadioGroup>
      </Container>
      <Container center>
        <Radio.RadioGroup disabled>
          <Container>
            <Container>
              <Radio.Radio value='col1'>Hello</Radio.Radio>
            </Container>
            <Container>
              <Radio.Radio value='col2'>World</Radio.Radio>
            </Container>
          </Container>
        </Radio.RadioGroup>
      </Container>
    </Container>
  )
}

export default RadioPlayground
