import { Container, Icon, Input } from '@vallista/core'
import { VFC } from 'react'
import { SearchInput } from '../../../../../core/src/components/Input/SearchInput'

const BadgePlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <Input size='small' placeholder='search...' />
        <Input placeholder='search...' />
        <Input size='large' placeholder='search...' />
      </Container>
      <Container row>
        <Input prefix={<Icon.Activity />} size='small' placeholder='search...' />
        <Input suffix={<Icon.Activity />} size='small' placeholder='search...' />
        <Input prefix={<Icon.Activity />} suffix={<Icon.Activity />} size='small' placeholder='search...' />
      </Container>
      <Container row wrap='nowrap'>
        <Input prefix={<Icon.Activity />} placeholder='search...' />
        <Input suffix={<Icon.Activity />} placeholder='search...' />
        <Input prefix={<Icon.Activity />} suffix={<Icon.Activity />} placeholder='search...' />
      </Container>
      <Container row wrap='nowrap'>
        <Input size='large' prefix={<Icon.Activity />} placeholder='search...' />
        <Input size='large' suffix={<Icon.Activity />} placeholder='search...' />
        <Input size='large' prefix={<Icon.Activity />} suffix={<Icon.Activity />} placeholder='search...' />
      </Container>
      <Container row wrap='nowrap'>
        <Input size='large' prefix={<Icon.Activity />} placeholder='search...' prefixStyling={false} />
        <Input size='large' suffix={<Icon.Activity />} placeholder='search...' suffixStyling={false} />
        <Input
          size='large'
          prefix={<Icon.Activity />}
          suffix={<Icon.Activity />}
          placeholder='search...'
          prefixStyling={false}
          suffixStyling={false}
        />
      </Container>
      <Container row wrap='nowrap'>
        <Input size='small' placeholder='search...' disabled />
        <Input size='small' prefix={<Icon.Activity />} placeholder='search...' prefixStyling={false} disabled />
        <Input size='small' suffix={<Icon.Activity />} placeholder='search...' suffixStyling={false} disabled />
        <Input
          size='large'
          prefix={<Icon.Activity />}
          suffix={<Icon.Activity />}
          placeholder='search...'
          prefixStyling={false}
          suffixStyling={false}
          disabled
        />
      </Container>
      <Container row wrap='nowrap'>
        <SearchInput size='small' placeholder='search...' />
        <SearchInput size='small' placeholder='search...' disabled />
      </Container>
      <div>
        <SearchInput size='large' placeholder='search...' />
      </div>
    </Container>
  )
}

export default BadgePlayground
