import { useGlobalProvider } from '@/context/useProvider'

export const useHeader = () => {
  const { state } = useGlobalProvider()
  const { fold } = state

  return {
    fold
  }
}
