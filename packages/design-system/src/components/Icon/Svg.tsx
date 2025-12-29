import { IconProps } from './type'
import { svgAlign, svgBase } from './Svg.css'

interface SvgProps extends Partial<Pick<IconProps, 'align' | 'size' | 'color'>>, React.SVGProps<SVGSVGElement> {
  children?: React.ReactNode
}

export default function Svg({ align, children, ...props }: SvgProps) {
  return (
    <svg className={`${svgBase} ${align ? svgAlign[align] : ''}`} {...props}>
      {children}
    </svg>
  )
}
