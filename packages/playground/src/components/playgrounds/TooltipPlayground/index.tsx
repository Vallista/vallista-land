import { Container, Tooltip } from '@vallista-land/core'
import { VFC } from 'react'

const TooltipPlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence'>
            <span>Top</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='bottom'>
            <span>Bottom</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='left'>
            <span>Left</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='right'>
            <span>Right</span>
          </Tooltip>
        </Container>
      </Container>

      <Container row>
        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' type='success'>
            <span>Top</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='bottom' type='error'>
            <span>Bottom</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='left' type='warning'>
            <span>Left</span>
          </Tooltip>
        </Container>

        <Container center>
          <Tooltip text='The Evil Rabbit Jumped over the Fence' position='right' type='secondary'>
            <span>Right</span>
          </Tooltip>
        </Container>
      </Container>
    </Container>
  )
}

export default TooltipPlayground
