export interface ImageProps {
  src: string
  width: number
  height: number
  margin?: number
  caption?: string
  captionSpacing?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
}
