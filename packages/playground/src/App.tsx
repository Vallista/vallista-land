import styled from '@emotion/styled'
import { ThemeProvider } from 'core'
import { VFC } from 'react'

import { Card } from './components/Card'
import BadgePlayground from './pages/BadgePlayground'
import ButtonPlayground from './pages/ButtonPlayground'
import CapacityPlayground from './pages/CapacityPlayground'
import CheckboxPlayground from './pages/CheckboxPlayground'
import CollapsePlayground from './pages/CollapsePlayground'
import ContainerPlayground from './pages/ContainerPlayground'
import FooterPlayground from './pages/FooterPlayground'
import IconPlayground from './pages/IconPlayground'
import ImagePlayground from './pages/ImagePlayground'
import LoadingDotsPlayground from './pages/LoadingDotsPlayground'
import ModalPlayground from './pages/ModalPlayground'
import NotePlayground from './pages/NotePlayground'
import ProgressPlayground from './pages/ProgressPlayground'
import RadioPlayground from './pages/RadioPlayground'
import SelectPlayground from './pages/SelectPlayground'
import ShowMorePlayground from './pages/ShowMorePlayground'
import SnippetPlayground from './pages/SnippetPlayground'
import SpacerPlayground from './pages/SpacerPlayground'
import SpinnerPlayground from './pages/SpinnerPlayground'
import SwitchPlayground from './pages/SwitchPlayground'
import TabsPlayground from './pages/TabsPlayground'
import TagPlayground from './pages/TagPlayground'
import TogglePlayground from './pages/TogglePlayground'
import VideoPlayground from './pages/VideoPlayground'

const App: VFC = () => {
  return (
    <Wrap>
      <ThemeProvider>
        <Card title='Container'>
          <ContainerPlayground />
        </Card>
        <Card title='Button'>
          <ButtonPlayground />
        </Card>
        <Card title='Modal'>
          <ModalPlayground />
        </Card>
        <Card title='Spinner'>
          <SpinnerPlayground />
        </Card>
        <Card title='Toggle'>
          <TogglePlayground />
        </Card>
        <Card title='Radio'>
          <RadioPlayground />
        </Card>
        <Card title='Select'>
          <SelectPlayground />
        </Card>
        <Card title='Spacer'>
          <SpacerPlayground />
        </Card>
        <Card title='Icon'>
          <IconPlayground />
        </Card>
        <Card title='Tabs'>
          <TabsPlayground />
        </Card>
        <Card title='Tag'>
          <TagPlayground />
        </Card>
        <Card title='Checkbox'>
          <CheckboxPlayground />
        </Card>
        <Card title='ShowMore'>
          <ShowMorePlayground />
        </Card>
        <Card title='Snippet'>
          <SnippetPlayground />
        </Card>
        <Card title='Progress'>
          <ProgressPlayground />
        </Card>
        <Card title='LoadingDots'>
          <LoadingDotsPlayground />
        </Card>
        <Card title='Note'>
          <NotePlayground />
        </Card>
        <Card title='Switch'>
          <SwitchPlayground />
        </Card>
        <Card title='Video'>
          <VideoPlayground />
        </Card>
        <Card title='Collapse'>
          <CollapsePlayground />
        </Card>
        <Card title='Capacity'>
          <CapacityPlayground />
        </Card>
        <Card title='Image'>
          <ImagePlayground />
        </Card>
        <Card title='Badge'>
          <BadgePlayground />
        </Card>
        <Card title='Footer'>
          <FooterPlayground />
        </Card>
      </ThemeProvider>
    </Wrap>
  )
}

const Wrap = styled.div`
  padding: 0 24px 50px 24px;
`

export default App
