import { Container, Text, Spacer } from '@vallista/design-system'

import { PageHeaderProps } from '@shared/types'
import { Heading } from '@shared/ui/Heading'

/**
 * 페이지 헤더 컴포넌트
 * 제목과 설명을 표시하는 공통 헤더입니다.
 */
export function PageHeader({ title, description, size = '3xl' }: PageHeaderProps) {
  return (
    <Container>
      <Spacer y={8} />
      <Heading as='h1' size={size}>
        {title}
      </Heading>
      {description && (
        <>
          <Spacer y={4} />
          <Text size={20} color='secondary'>
            {description}
          </Text>
        </>
      )}
      <Spacer y={8} />
    </Container>
  )
}
