import { copy } from '../../utils/clipboard'
import { ReturningUseSnippet, SnippetProps } from './type'

export function useSnippet<T extends Partial<SnippetProps>>(props: T): T & ReturningUseSnippet {
  const { type = 'primary', prompt = true, onCopy, text = [] } = props

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
  }
}
