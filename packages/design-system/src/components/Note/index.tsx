import { NoteProps } from './type'
import { note } from './Note.css'

export const Note = (props: Partial<NoteProps>) => {
  const {
    label = 'Note',
    fill = false,
    variant = 'standard',
    type = 'primary',
    action = null,
    size = 'medium',
    children
  } = props

  const noteClass = note({
    size,
    type,
    ...(fill && { fill: type }),
    ...(variant === 'contrast' && { contrast: type })
  })

  return (
    <div className={noteClass}>
      <span>
        {!!label && <span>{label}: </span>}
        {children}
      </span>
      <div>{action && action}</div>
    </div>
  )
}
