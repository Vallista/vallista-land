import { ReturningUseTag, TagProps } from './type'

export function useTag<T extends Partial<TagProps>>(props: T): T & ReturningUseTag {
  return {
    ...props,
    hasRemove: !!props.onRemove
  }
}
