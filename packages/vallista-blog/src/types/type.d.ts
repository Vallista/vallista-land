import { VFC } from 'react'

declare module '*.svg' {
  const content: any
  export default content
}

declare module '*.yaml' {
  const content: any
  export default content
}

declare module '*.jpg' {
  const content: any
  export default content
}

declare module '*.jpeg' {
  const content: any
  export default content
}

declare module '*.png' {
  const content: any
  export default content
}

declare module '*.css' {
  interface IClassNames {
    [className: string]: string
  }
  const classNames: IClassNames
  export = classNames
}

// export declare const Video: VFC<NeedVideoProp>;
