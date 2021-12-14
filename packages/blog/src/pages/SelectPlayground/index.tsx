import { Container, Select, Icon } from 'core'
import { useEffect, useState, VFC } from 'react'

const SelectPlayground: VFC = () => {
  const [select1, setSelect1] = useState('Second option')

  useEffect(() => {
    console.log(select1)
  }, [select1])

  return (
    <Container row>
      <Container center>
        <Select value={select1} onChange={setSelect1}>
          <option>First option</option>
          <option>Second option</option>
        </Select>
      </Container>
      <Container center>
        <Select icon={<Icon.ChevronUpDown size={18} />}>
          <option>First option</option>
          <option>Second option</option>
        </Select>
      </Container>
      <Container center>
        <Select disabled>
          <option>First option</option>
          <option>Second option</option>
        </Select>
      </Container>
    </Container>
  )
}

export default SelectPlayground
