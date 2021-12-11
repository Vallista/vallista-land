import styled from '@emotion/styled'
import { Colors, Text, Spinner, Button, ThemeProvider, Modal, useModal } from 'core'
import ButtonPlayground from 'pages/ButtonPlayground'
import { VFC } from 'react'
import './App.css'

const App: VFC = () => {
  const { active, open, close } = useModal()

  return (
    <ThemeProvider>
      <Text size={32} color={Colors.HIGHLIGHT.PINK} weight={600}>
        홈!
      </Text>

      <ButtonPlayground />

      <TemporaryContainer>
        <Spinner />
        <Spinner size={50} />
      </TemporaryContainer>

      <Button onClick={open}>알럿 출력</Button>

      <Modal.Modal active={active} onClickOutSide={close}>
        <Modal.Body>
          <Modal.Header>
            <Modal.Title>안녕하세요?</Modal.Title>
            <Modal.SubTitle>This is a modal</Modal.SubTitle>
          </Modal.Header>
          <Modal.Inset>
            <Text>Content within the inset.</Text>
          </Modal.Inset>
          <br />
          <Text>Content outside the inset.</Text>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action onClick={close}>Cancel</Modal.Action>
          <Modal.Action onClick={close}>Submit</Modal.Action>
        </Modal.Actions>
      </Modal.Modal>
    </ThemeProvider>
  )
}

const TemporaryContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 32px 0;
  padding: 0 8px;
`

export default App
