import { EffectCallback, useEffect } from 'react'

const useEffectOnce = (effect: EffectCallback): void => {
  useEffect(effect, [])
}

export const useMount = (fn: () => void): void => {
  useEffectOnce(() => {
    fn()
  })
}
