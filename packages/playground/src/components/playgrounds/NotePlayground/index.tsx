import { Button, Container, Note } from '@vallista/core'
import { VFC } from 'react'

const ProgressPlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <div>
          <Note size='small'>A small note.</Note>
        </div>
        <div>
          <Note>A default note.</Note>
        </div>
        <div>
          <Note size='large'>A large note.</Note>
        </div>
      </Container>
      <Note>This note details some information.</Note>
      <Note>
        This note details a large amount information that could potentially wrap into two or more lines, forcing the
        height of the Note to be larger.
      </Note>
      <Note action={<Button>Upgrade</Button>}>This note details some information.</Note>
      <Note action={<Button>Upgrade</Button>}>
        This note details a large amount information that could potentially wrap into two or more lines, forcing the
        height of the Note to be larger.
      </Note>
      <Note type='secondary'>This note details some information.</Note>
      <Note type='success'>This note details some information.</Note>
      <Note type='warning'>This note details some information.</Note>
      <Note type='error'>This note details some information.</Note>
      <Note fill>This note details some information.</Note>
      <Note fill type='secondary'>
        This note details some information.
      </Note>
      <Note fill type='success'>
        This note details some information.
      </Note>
      <Note fill type='warning'>
        This note details some information.
      </Note>
      <Note fill type='error'>
        This note details some information.
      </Note>
      <Note variant='contrast' type='secondary'>
        This note details some information.
      </Note>
      <Note variant='contrast' type='success'>
        This note details some information.
      </Note>
      <Note variant='contrast' type='warning'>
        This note details some information.
      </Note>
      <Note variant='contrast' type='error'>
        This note details some information.
      </Note>
    </Container>
  )
}

export default ProgressPlayground
