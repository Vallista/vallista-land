declare module '*.svg' {
  const content: any
  export default content
}

declare module '*.yaml' {
  const content: any
  export default content
}

declare module '*.jpg'
declare module '*.jpeg'
declare module '*.png'
declare module '*.gif'

declare module '*.css' {
  interface IClassNames {
    [className: string]: string
  }
  const classNames: IClassNames
  export = classNames
}
