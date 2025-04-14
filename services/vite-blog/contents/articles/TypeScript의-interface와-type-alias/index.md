---
title: TypeScript의 interface와 type alias
tags:
  - 프론트엔드
date: 2021-10-10 16:07:18
draft: false
info: false
image: ./assets/1.jpeg
---

![이미지1](./assets/1.jpeg)

타입스크립트의 Type Alias는 장점이면서 동시에 단점도 갖고있는 양날의 검입니다. 다양한 타입을 만들어낼 수도 있는 장점을 갖고 있지만, 다양한 타입을 만들어내므로써 쓸데없이 타입이 꼬이게 만들어 코드를 복잡하게 만든다는 단점도 존재합니다.

이번 글에서는 타입스크립트에서 interface와 type alias가 어떠한 용도로 쓰여야 하는지, 각자 어떤 장점을 갖고 있는지 이야기해보도록 하겠습니다.

## Type Alias

type alias는 타입스크립트에서 빼놓을 수 없는 아주 중요한 매커니즘이며 잊으면 안되는 키워드입니다. type으로 하여금 여러 타입의 유니온을 만들 수 있습니다.

```ts {numberLines}
type StringLiteralUnion = 'Hello' | 'World'
type NumberLiteralUnion = 1 | 2 | 3

type UnionType = StringLiteralUnion | NumberLiteralUnion
// 'Hello' | 'world' | 1 | 2 | 3
```

`StringLiteralUnion`과 `NumberLiteralUnion`은 각각의 리터럴 타입에 대한 유니온입니다. 이 유니온을 합쳐서 또 하나의 유니온을 만들 수 있습니다.

조금 더 복잡한 타입을 만들어보겠습니다.

```ts {numberLines}
interface IOS {
  type: 'iOS'
  AppleChipVersion: 'A5' | 'A6' | 'A7'
}

interface Android {
  type: 'android'
  apu: 'SnapDragon' | 'Exynos'
}

type MobilePhone = IOS | Android
// type이 iOS일 때 IOS의 인터페이스로 추론되고 android일 때 android의 인터페이스로 추론된다,

// ex)
const myIOSPhone: MobilePhone = {
  type: 'iOS',
  AppleChipVersion: 'A5'
}

const myAndroidPhone: MobilePhone = {
  type: 'android',
  AppleChipVersion: 'A5'
  //~~~~~~~~~~~~~~~~~~~~~~ Error!
}
```

예제는 두 개의 인터페이스를 하나의 타입 유니온에 병합하여, 두 케이스별로 타입 추론이 다르게 되도록 하는 예제입니다. 이 예제에서 알다시피, 타입을 합치거나 선언하여 named type(명명된 타입)을 만들 수 있습니다.

그런데 여기서 의문점이 생깁니다. type alias는 다양한 타입의 유니온을 만들 수 있다고 했습니다. 그렇다면 `interface IOS`와 `interface Android` 또한 type alias로 명명된 타입을 만들 수 있지 않을까요?

```ts {numberLines}
type IOS = {
  type: 'iOS'
  AppleChipVersion: 'A5' | 'A6' | 'A7'
}

type Android = {
  type: 'android'
  apu: 'SnapDragon' | 'Exynos'
}

type MobilePhone = IOS | Android
// type이 iOS일 때 IOS의 인터페이스로 추론되고 android일 때 android의 인터페이스로 추론된다,
```

잘 됩니다. 그렇다면 인터페이스를 쓸 필요 없이 명명된 타입으로 모든 타입을 제공하면 되겠네요?

## Interface

Type Alias로 모든 타입 명세를 변경하기 전에, 잠깐만요. 무언가 이상합니다. 그렇다면 타입스크립트에서 인터페이스를 왜 만들걸까요?

객체지향 프로그래밍에서 이야기하는 명세와 추상 인터페이스를 만들기 위해서 단순히 객체지향적 개념을 사용하는 사람을 위해서 제공한걸까요?

사실 그렇지 않습니다. Interface는 Type Alias와 다른 성격을 갖고있습니다.

아래의 타입에 대한 확장 예시를 보도록 하겠습니다.

```tsx {numberLines}
type ValidateProperties = {
  errorMessage: string
}

type FormProperties = {
  disabled: boolean
}

type ButtonProps =
  | Partial<ValidateProperties>
  | Partial<FormProperties>
  | {
      infoMessage?: string
    }
```

위의 예제는 ValidateProperties와 FormProperties 두 타입을 type ButtonProps에 확장의 개념으로 추가한 코드입니다.

위 ButtonProps를 설명하면 아래와 같이 해석할 수 있습니다.

```ts {numberLines}
const i_am_not_validate_properties: Partial<ValidateProperties> = {
  errorMessage: 'string'
}

const button: ButtonProps = i_am_not_validate_properties
```

그렇습니다. `type ButtonProps`는 `Partial<ValidateProperties> | Partial<FormProperties> | { infoMessage?: string }` 이므로, 세 개중 하나가 들어가도 문제가 없다는 코드가 되는 것입니다. (왜냐하면 |로 합집합을 만들었기 때문이죠.) 이는 인터페이스를 사용하여 읽는이에게 명확하게 전달해야합니다.

```ts {numberLines}
interface ValidateProperties {
  errorMessage: string
}

interface FormProperties {
  disabled: boolean
}

interface ButtonProps extends Partial<ValidateProperties>, Partial<FormProperties> {
  infoMessage?: string
}

const i_am_not_validate_properties: Partial<ValidateProperties> = {
  errorMessage: 'string'
}

const button: ButtonProps = i_am_not_validate_properties
```

물론 이렇게해도, 타입스크립트의 구조적 서브 타이핑 시스템은 `i_am_not_validate_properties`를 허용합니다. 하지만, `interface extends ?`로 인해, 확장이라는 명시를 해주게 되었습니다.

정리를 하자면.

- 개별적으로 타입이 허용될 수 있다는 의미를 부여하기보다, interface를 사용하여 ButtonProps에 확장하는 형태로 ButtonProps를 온전히 사용하라는 의미를 부여하므로써 협업하면서 장점을 가지도록 제공할 수 있습니다.
- | 로 인한 합집합을 해석하는것은 코드가 굉장히 길어지므로 별로 좋은 코드는 아닙니다. 또한 해당 코드는 Type Alias의 장점을 쓰지 않으므로, 굳이 사용할 이유가 없습니다.

### React Component Props

이러한 상황을 실제로 적용해보도록 합시다. 흔하게 쓰이는 리액트에서의 컴포넌트 코드입니다.

```tsx {numberLines}
// Button.tsx
import React, { ReactNode, forwardRef } from 'react'

type ButtonProps = {
  disabled?: boolean
  danger?: boolean
  errorMessage?: string
  infoMessage?: string
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props: ButtonProps, ref) => {
    const {
      errorMessage,
      infoMessage,
      danger,
      children,
      ...otherProps
    } = props

    return (
      <button {...otherProps} ref={ref}>
        {children}
        // {... 그 외 에러 메시지 처리}
      </button>
    )
  }
)
```

흔히, 이러한 코드를 많이 보았을 것입니다. 이 코드에서 ButtonProps를 type alias로 구현했습니다. 이 코드의 문제는 이렇게 구현했을 때가 아닙니다. 추후 확장을 할 때 불편함을 마주하게 됩니다.

아래의 상황을 보겠습니다.

```tsx {numberLines}
// type.ts
type CommonComponentProps = {
  disabled: boolean
  danger: boolean
}

// Button.tsx
...

type ButtonProps = Partial<CommonComponentProps> | {
  errorMessage?: string
  infoMessage?: string
  children: ReactNode
}

...
```

Button 뿐만 아니라, Input이나 다양한 Component에서 사용하는 공통된 Prop을 하나의 명명된 타입으로 만들었습니다.

앞으로 이러한 것들이 얼마나 추가가 될 지 모릅니다. 지금 당장은 몇 개 추가 안되므로 상관이 없지만, 이렇게 계속 생기게 되면 어디에 계속 추가해야할까요?

`Partial<CommonComponentProps>` 뒤에 계속 추가하는게 맞을까요? 아니면 ButtonProps가 실제로 갖고 있는 타입의 뒤에 붙이는게 맞을까요?

이러한 것들은 사실상 담당 개발자가 로테이셔닝되고 손보는 사람이 많아질수록 고민을 줄여야 하는 포인트입니다.

또한 위의 코드는 type alias의 장점 중 하나인 union type으로 만들어 복잡한 타입을 명명해서 사용하는 취지와 맞지도 않습니다.

그러므로 코드는 아래와 같이 작성해야합니다.

```tsx {numberLines}
// type.ts
interface CommonComponentProps {
  disabled: boolean
  danger: boolean
}

// Button.tsx
...

interface ButtonProps extends Partial<CommonComponentProps> {
  errorMessage?: string
  infoMessage?: string
  children: ReactNode
}

...
```

그렇습니다. 인터페이스의 장점중 하나를 길게 설명했습니다. 정리를 하면 다음과 같습니다.

- **로직의 확장에 대한 처리가 타입보다 유용하며, 다양한 개발자가 협업해야하는 환경에서 Type alias보다 명확성을 부여합니다**
- 무언가 데이터를 명세하고 공통 인터페이스를 만들어 제공할 때 interface를 써야합니다. type alias는 interface로 만들어진 이러한 날 것의 데이터를 실제 사용처에서 가공하여 이름을 명명하여 사용하는 곳에 집중해야합니다.

### 구조적 서브 타이핑

먼저, type과 명세는 다릅니다.

- type은 string, number, interface, object 등을 읽컫습니다. 조금 더 나아가 union type은 이러한 타입의 집합을 나타냅니다.
- 명세는 어떤 property가 존재하는지, 실제 어떤 데이터가 필요한지에 대해서 알 수 있는 이름과 타입의 나열입니다.

```ts {numberLines}
type Property = {
  a: string
}

interface Property {
  a: string
}
```

두 개는 읽히기에 다릅니다. `type alias로 명명된 Property`는 앞으로 단순 문자열이 들어올 지, 숫자가 들어올 지, 오브젝트가 들어올 지, 인터페이스가 들어올 지 알 수가 없습니다.
말 그대로 타입의 모음이기 때문이죠. 그래서 이름에 큰 의존을 해야합니다. 예제처럼 Property라고 하면 무엇인 지 쉽게 알 수가 없죠.

`interface Property`는 이와 다르게, object 형태로 기본적인 틀이 지정됩니다. 그렇기 때문에 object 안에 어떤 키와 type이 들어갈 지 명세로 인지할 수 있죠.

그렇기 때문에, interface는 명세적인 성격이 강하며, type은 어떤 타입들의 모음의 성격이 강합니다.

그렇다면, 현재 챕터인 구조적 서브 타이핑과는 어떤 연관관계가 있을까요?

```ts {numberLines}
interface Vector1D {
  x: number
}

interface Vector2D {
  x: number
  y: number
}

interface Vector3D {
  x: number
  y: number
  z: number
}

function Distance(base: Vector2D, target: Vector2D): number {
  return Math.sqrt(Math.pow(target.x - base.x, 2) + Math.pow(target.y - base.y, 2))
}

const a: Vector3D = { x: -7, y: 6, z: 0 }
const b: Vector2D = { x: 5, y: 11 }
console.log(Distance(a, b)) // 13
```

일반적인 정적타입 언어에서는 타입이 동일해야 연산이 된다는. nominal typing의 방식을 취하고 있었습니다. 하지만 structural(구조적) typing 방식에서는 이러한 서브타입들이 동일한 집합을 갖고 있다면 타입 체커가 통과시킵니다.

여기서 얻을 수 있는 중요한 점은 명세를 구성할 때 같은 집합을 들고 있다면, 또 명명할 필요 없이 중복되는 속성을 줄이는게 핵심입니다.

그렇기에 아래와 같이 작성할 수 있습니다.

```ts {numberLines}
interface Vector1D {
  x: number
}

interface Vector2D extends Vector1D {
  y: number
}

interface Vector3D extends Vector2D {
  z: number
}

function Distance(base: Vector2D, target: Vector2D): number {
  return Math.sqrt(Math.pow(target.x - base.x, 2) + Math.pow(target.y - base.y, 2))
}

const a: Vector3D = { x: -7, y: 6, z: 0 }
const b: Vector2D = { x: 5, y: 11 }
console.log(Distance(a, b)) // 13
```

정리하면 다음과 같습니다.

- 구조적 서브 타이핑에서는 집합에 포함되어있는지로 타입체커가 통과판단을 진행합니다.
- 그러므로, 명세 단계에서 최대한 중복을 줄이는 형태로 extends 를 진행하여 설계를 하는게 핵심입니다.
- 만약 중복이 여기저기서 되는 구조로 설계가 된다면, 왜 타입이 통과되는지 모를 수 있으며 큰 문제 발생을 야기시킬 수 있습니다.

### 인터페이스 선언 병합 (declaration merging)

인터페이스는 선언 병합이라는 기능을 가지고 있습니다. 선언 병합은 주로, type declaration 파일 (.d.ts) 등에서 사용됩니다.

이 선언 병합이 가장 잘 활용되는 곳은 라이브러리간의 adapter를 만들때 주로 사용됩니다.

```ts {numberLines}
// @emotion/react/types
...
// tslint:disable-next-line: no-empty-interface
export interface Theme {}
...


// emotion.d.ts
import '@emotion/react'

declare module '@emotion/react' {
  export interface Theme {
    colors: typeof Colors
    layers: typeof Layers
    shadow: { default: string; large: string }
    weight: {
      bold: number
      medium: number
      regular: number
    }
  }
}
```

예시로 emotion.js의 theme 확장 기능을 예시로 들었습니다.

emotion.js의 react 내 types를 보면, `export interface Theme`을 빈 공간으로 제공합니다.
이 공간으로 하여금, 실제 사용하는 코드로 갖고와서 선언 병합을 진행할 수 있습니다.

아래의 emotion.d.ts 처럼 선언병합을 진행하게되면 이제 해당 property들을 사용할 수 있게 됩니다.

- 라이브러리와 같이 다양한 부분에서 interface를 활용해 확장시킬 수 있도록 제공합니다.
- 해당 확장을 통해 커스터마이징을 할 수 있고, 이런 기능을 통해 개발자간 작업 캡슐화 및 확장을 유연하게 하도록 제공할 수 있습니다.

## Type Alias를 적극 활용해야할 때

그렇다면, Type Alias를 적극 활용해야할 때는 언제일까요?

```ts {numberLines}
type NumberTuple = [number, number]
type StringTuple = [string, string]
type A = [NumberTuple, StringTuple, ...string[]]
```

먼저, 튜플을 사용할 때는 type alias를 사용하는 것이 좋습니다. 이 것을 interface로 사용하면 다음과 같습니다.

```ts {numberLines}
interface A {
  0: NumberTuple
  1: StringTuple
  length: 2
}
```

굳이 이렇게 할 필요가 없겠죠? 한 줄을 구현하기 위해서 몇 줄을 코딩을 더 했습니다. 그럴 필요가 없습니다. 이런 경우는 type alias로 해주는게 낫습니다.

또 다른 경우는 공변성과 반변성을 활용하여 적절히 타입을 제작할 수 있는데, 요 이야기는 길어지니 다음에 하도록 하겠습니다.

정리하면,

- Type Alias를 이용해 튜플 타입을 만들면 편합니다.
- 유니온 타입, 복잡한 타입일 때 적극적으로 사용하세요.

## 결론

1. 명세는 interface로 작성하세요. type alias로 명세를 해봐야 장점이 없으며, interface를 통해 extends 확장과 의미를 더 명확하게 부여할 수 있습니다.
2. interface의 property를 중복되지 않도록 명세 설계를 하고, 실제 사용처에서 type alias를 이용해 명명된 타입을 만들어 사용하세요.
3. 선언 병합을 사용하여 각 모듈간 커뮤니케이션을 쉽게 진행할 수 있도록 제공하세요.
4. 튜플과 같은 타입은 type alias로 만드세요.
5. interface와 type alias의 장점을 잘 파악해서 사용하세요.
