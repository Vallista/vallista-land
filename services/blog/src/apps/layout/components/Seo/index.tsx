import { FC, useEffect } from 'react'

interface SeoProps {
  description: string
  name: string
  image?: string
  isPost?: boolean
  pathname: string
  siteUrl?: string
}

export const Seo: FC<SeoProps> = ({ name }) => {
  useEffect(() => {
    document.title = `${name} - vallista.dev`
  }, [name])

  return null
}
export default Seo
