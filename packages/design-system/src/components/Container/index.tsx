import { ContainerProps } from './type'

export const Container = ({
  row,
  flex = 1,
  gap = 1,
  center,
  wrap = 'wrap',
  children,
  ...rest
}: Partial<ContainerProps> & { children?: React.ReactNode }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: row ? 'row' : 'column',
        position: 'relative',
        minWidth: '1px',
        maxWidth: '100%',
        justifyContent: center ? 'center' : 'flex-start',
        alignItems: center ? 'center' : 'stretch',
        flexBasis: 'auto',
        boxSizing: 'border-box',
        flex,
        flexWrap: wrap,
        gap: row ? `calc(${gap} * 1rem)` : undefined
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
