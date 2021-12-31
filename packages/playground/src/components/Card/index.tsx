import styled from '@emotion/styled'
import { Container as ContainerElement, Text } from '@vallista-land/core'
import { FC } from 'react'

export const Card: FC<{ title: string }> = ({ title, children }) => {
  return (
    <Container>
      <Header>
        <Text size={20} as='h3' weight={600}>
          {title}
        </Text>
      </Header>
      <Wrapper>
        <InnerWrapper>{children}</InnerWrapper>
      </Wrapper>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;

  &:last-of-type {
    margin-bottom: 0;
  }
`

const Header = styled.div`
  width: 1024px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-left: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-right: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
`

const Wrapper = styled.div`
  width: 1024px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 24px;
  padding-right: 24px;
  border: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
`

const InnerWrapper = styled(ContainerElement)`
  padding-top: 24px;
  padding-bottom: 24px;
`
