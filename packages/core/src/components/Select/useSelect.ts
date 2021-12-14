import { useUniqueId } from '../../hooks/useUniqueId'
import { NeedSelectProps, ReturningUseSelect, SelectProps } from './type'

const initProps: NeedSelectProps = {
  disabled: false,
  icon: true
}

export function useSelect<T extends Partial<SelectProps>>(props: T): T & NeedSelectProps & ReturningUseSelect {
  const uniqueId = useUniqueId()

  return {
    ...initProps,
    ...props,
    uniqueId
  }
}
