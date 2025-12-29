import { copy } from '../../utils/clipboard'
import { useToastContext } from '../Toast/ToastProvider'
import { ReturningUseSnippet, SnippetProps } from './type'

export function useSnippet<T extends Partial<SnippetProps>>(props: T): T & ReturningUseSnippet {
  const { type = 'primary', prompt = true, onCopy, text = [] } = props

  // 토스트 컨텍스트를 항상 호출 (React Hook 규칙 준수)
  const toastContext = useToastContext()

  return {
    ...props,
    type,
    text: typeof text === 'string' ? [text] : text,
    prompt,
    handleCopy
  }

  function handleCopy(text_: string): void {
    copy(text_)
    onCopy?.()

    // 토스트 메시지 표시
    if (toastContext) {
      toastContext.success('복사하였습니다')
    }
  }
}
