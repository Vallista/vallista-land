import { Checkbox, Container } from 'core'
import { useState, VFC } from 'react'

const CheckboxPlayground: VFC = () => {
  const [checked, setChecked] = useState(false)
  return (
    <Container>
      <Container row>
        <Checkbox checked={checked} onChange={() => setChecked(!checked)}>
          checkbox
        </Checkbox>
        <Checkbox label='label' checked={checked} onChange={() => setChecked(!checked)}>
          label
        </Checkbox>
        <Checkbox indeterminate>checkbox indeterminate</Checkbox>
        <Checkbox disabled>checkbox disabled</Checkbox>
        <Checkbox disabled indeterminate>
          checkbox disabled + indeterminate
        </Checkbox>
      </Container>
      <Checkbox fullWidth checked={checked} onChange={() => setChecked(!checked)}>
        fullWidth
      </Checkbox>
    </Container>
  )
}

export default CheckboxPlayground
