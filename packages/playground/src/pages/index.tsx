import styled from '@emotion/styled'
import { VFC } from 'react'

import { Card } from '../components/Card'
import BadgePlayground from '../components/playgrounds/BadgePlayground'
import ButtonPlayground from '../components/playgrounds/ButtonPlayground'
import CapacityPlayground from '../components/playgrounds/CapacityPlayground'
import CheckboxPlayground from '../components/playgrounds/CheckboxPlayground'
import CollapsePlayground from '../components/playgrounds/CollapsePlayground'
import TogglePlayground from '../components/playgrounds/CollapsePlayground'
import ContainerPlayground from '../components/playgrounds/ContainerPlayground'
import FooterPlayground from '../components/playgrounds/FooterPlayground'
import IconPlayground from '../components/playgrounds/IconPlayground'
import ImagePlayground from '../components/playgrounds/ImagePlayground'
import LoadingDotsPlayground from '../components/playgrounds/LoadingDotsPlayground'
import ModalPlayground from '../components/playgrounds/ModalPlayground'
import NotePlayground from '../components/playgrounds/NotePlayground'
import ProgressPlayground from '../components/playgrounds/ProgressPlayground'
import RadioPlayground from '../components/playgrounds/RadioPlayground'
import SelectPlayground from '../components/playgrounds/SelectPlayground'
import ShowMorePlayground from '../components/playgrounds/ShowMorePlayground'
import SnippetPlayground from '../components/playgrounds/SnippetPlayground'
import SpacerPlayground from '../components/playgrounds/SpinnerPlayground'
import SpinnerPlayground from '../components/playgrounds/SpinnerPlayground'
import SwitchPlayground from '../components/playgrounds/SwitchPlayground'
import TabsPlayground from '../components/playgrounds/TabsPlayground'
import TagPlayground from '../components/playgrounds/TagPlayground'
import TooltipPlayground from '../components/playgrounds/TooltipPlayground'
import VideoPlayground from '../components/playgrounds/VideoPlayground'

const IndexPage: VFC = () => {
  return (
    <Wrap>
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
      <Card title='Tooltip'>
        <TooltipPlayground />
      </Card>
    </Wrap>
  )
}

const Wrap = styled.div`
  padding: 0 24px 50px 24px;
`

export default IndexPage
