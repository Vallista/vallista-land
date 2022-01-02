import profile from '../../config/profile.json'

interface ReturningUseConfig {
  author: string
}

export function useConfig(): ReturningUseConfig {
  const { author } = profile

  return {
    author
  }
}
