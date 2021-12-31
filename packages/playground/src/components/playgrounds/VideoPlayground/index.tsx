import { Video, Container } from '@vallista-land/core'
import { VFC } from 'react'

const VideoPlayground: VFC = () => {
  return (
    <Container>
      <Container>
        <p>Default</p>
        <Video width={480} src='https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_30mb.mp4' />
      </Container>
      <Container>
        <p>AutoPlay + Loop</p>
        <Video
          autoPlay
          loop
          width={480}
          src='https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_30mb.mp4'
        />
      </Container>
    </Container>
  )
}

export default VideoPlayground
