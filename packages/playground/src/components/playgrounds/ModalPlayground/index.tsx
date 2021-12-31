import styled from '@emotion/styled'
import { Button, Modal, useModal, Text } from '@vallista-land/core'
import { VFC } from 'react'

const ModalPlayground: VFC = () => {
  const { active, open, close } = useModal()

  return (
    <>
      <TemporaryContainer>
        <Button onClick={open}>알럿 출력</Button>
      </TemporaryContainer>

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
    </>
  )
}

const TemporaryContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 32px 0;
  padding: 0 8px;
`

export default ModalPlayground
