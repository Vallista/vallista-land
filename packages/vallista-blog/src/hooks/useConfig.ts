import profile from '../../config/profile.json'

interface ReturningUseConfig {
  author: string
  title: string
  titleTemplate: string
  placeholder: string
  siteUrl: string
  description: string
  twitterUserName: string
  github: string
  secondary: string
}

export function useConfig(): ReturningUseConfig {
  return profile
}
