---
title: TypeScript 디자인 패턴 - 팩토리 패턴
date: 2020-05-05 20:44:56
image: ./assets/0.jpg
tags:
  - 프론트엔드
draft: false
info: false
series: TypeScript 디자인 패턴
seriesPriority: 1
---

![이미지0](./assets/0.jpg)

## 팩토리 패턴이란

설계 문제에 대해서 해답을 문서화 해놓은 디자인 패턴에는 생성, 구조, 행동, 동시실행과 같은 분류가 있습니다. 그 중에서 팩토리 패턴은 생성과 관련된 디자인 패턴 입니다.

팩토리 패턴은 말 그대로 공장이라고 생각하면 편합니다. 하나의 클래스나 객체를 생성하는데 쓰이며, 주요로 사용되는 것은 **추상 팩토리**와 **팩토리 매서드** 패턴이 있습니다.

오늘은 이 두 패턴에 대해서 알아볼 것이며, 이름이 비슷하다보니 햇갈릴 수도 있고, 정리가 안될수도 있는데 이를 타입스크립트로 코딩을 해보며 직접 알아보도록 합시다.

## 팩토리 메서드 패턴

팩토리 메서드는 부모 클래스에서 타입에 따라 클래스를 생성하는 방법입니다. 자식 클래스를 생성하는 상황에서 부모 클래스의 팩토리를 호출하여 생성해주는 방식으로 처리하며, 이러한 방법의 장점은 자식 클래스 생성에 대해 파편화를 막아주며, 자식 클래스가 늘어나는 상황에서 효과적으로 코드 수정을 할 수 있게 도와줍니다.

### 코드

```jsx {numberLines}
enum InputType {
    DEFAULT = 0,
    ANIMATED,
    UNSHAPED
}

class Input {
    public static InputFactory(type: InputType): Input {
        switch (type) {
            default:
                return new Input()
            case InputType.ANIMATED:
                return new AnimatedInput()
            case InputType.UNSHAPED:
                return new UnShapedInput()
        }
    }

    render() {
        return `<input />`
    }
}

class AnimatedInput extends Input {
    render() {
        return `<input class="animated-input" />`
    }
}

class UnShapedInput extends Input {
    render() {
        return `<input class="unshaped-input" />`
    }
}

const inputArr: Input[] = []

inputArr.push(Input.InputFactory(InputType.DEFAULT))
inputArr.push(Input.InputFactory(InputType.ANIMATED))
inputArr.push(Input.InputFactory(InputType.UNSHAPED))

inputArr.forEach((input) => { console.log(input.render()) })
```

위 코드를 보면, InputArr 배열을 만들고 InputFactory로 넣어주었습니다. 그렇게 결과값을 보니 input element가 적절히 출력되는걸 볼 수 있습니다.

### 언제 쓰이는가

![이미지1](./assets/1.jpg)

팩토리 매서드 패턴이 사용되는 곳은 다양한 자식 클래스가 생기며 파편화되는 상황에서 매니지먼트를 하기위해 사용됩니다. 위의 예처럼 다양한 Input이 있고, 해당 Input 생성을 타입별로 생성을 해주고 있습니다. Input.InputFactory 사용만으로 다양한 타입에 대해서 생성을 쉽게 해줄 수 있습니다.

즉, 객체 생성을 팩토리 클래스로 위임하므로써 팩토리 클래스에서 객체를 생성합니다.

### 심화

![이미지2](./assets/2.jpg)

그렇다면 팩토리 매서드 패턴을 이용해서 조금 심화된 위의 구조를 코드로 구현해보도록 합시다.

```jsx {numberLines}
enum InputType {
    DEFAULT = 0,
    ANIMATED,
    UNSHAPED
}

class Input {
    public static InputFactory(type: InputType): Input {
        switch (type) {
            default:
                return new Input()
            case InputType.ANIMATED:
                return new AnimatedInput()
            case InputType.UNSHAPED:
                return new UnShapedInput()
        }
    }

    render() {
        return `<input />`
    }
}

class AnimatedInput extends Input {
    render() {
        return `<input class="animated-input" />`
    }
}

class UnShapedInput extends Input {
    render() {
        return `<input class="unshaped-input" />`
    }
}

enum ButtonType {
    DEFAULT = 0,
    IMAGE,
    TEXT
}

interface IButton {
    text: string
    src?: string
}

class Button {
    text: string

    public static ButtonFactory(type: ButtonType, { text, src }: IButton): Button {
        switch (type) {
            default:
                return new Button(text)
            case ButtonType.IMAGE:
                return new ImageButton(text, src!)
            case ButtonType.TEXT:
                return new TextButton(text)
        }
    }

    constructor(text: string) {
        this.text = text
    }

    render() {
        return `<button>${this.text}</button>`
    }
}

class ImageButton extends Button {
    src: string

    constructor(text: string, src: string) {
        super(text)
        this.src = src
    }

    render() {
        return `<button class="none">
            ${this.text}
            <img src="${this.src} alt="button-img"/>
        </button>`
    }
}

class TextButton extends Button {
    constructor(text: string) {
        super(text)
    }

    render() {
        return `
            <button class="none">
                ${this.text}
            </button>
        `
    }
}

enum FormType {
    ONE = 0,
    TWO,
    THREE
}

class Form {
    public static FormFactory(type: FormType) {
        let input = null
        let button = null

        switch (type) {
            case FormType.ONE:
                input = Input.InputFactory(InputType.DEFAULT)
                button = Button.ButtonFactory(ButtonType.DEFAULT, { text: '버튼' })

                break;
            case FormType.TWO:
                input = Input.InputFactory(InputType.ANIMATED)
                button = Button.ButtonFactory(ButtonType.IMAGE, { text: '버튼', src: 'https://asdasd.net' })

                break;
            case FormType.THREE:
                input = Input.InputFactory(InputType.UNSHAPED)
                button = Button.ButtonFactory(ButtonType.TEXT, { text: '버튼' })

                break;
        }

        return `<div>
            ${input.render()}
            ${button.render()}
        </div>`
    }
}

console.log(Form.FormFactory(FormType.ONE))
console.log(Form.FormFactory(FormType.TWO))
console.log(Form.FormFactory(FormType.THREE))
```

이번에는 Form을 만드는 코드입니다. 팩토리 메서드 패턴을 이용해 Input과 Button을 팩토리 메서드를 호출하여 생성했습니다.

이 코드가 원하는 결과값은 `ONE`에 해당하는 Form이면 기본 버튼과 인풋, `TWO`에 해당하는 Form이면 각각 인풋과 버튼 타입의 두 번째 요소 (ANIMATED, IMAGE) 그리고 `THREE`에 해당하는 Form이면 세 번째 요소 (UNSHAPED, TEXT)를 출력해야 합니다.

그래서 결과값이 만들어질 때 보면 각각의 요소가 타입에 맞게 정돈되어 들어가 있는 형태를 확인할 수 있죠. 하지만 이렇게 점점 비대해지다보면 Switch문의 내부가 복잡해질 것 입니다.

이러한 상황에서 사용할 수 있는게 바로 추상 팩토리 패턴입니다.

## 추상 팩토리 패턴

추상 팩토리 패턴은 객체의 집합을 만들때 사용합니다. 관련이 있는 객체를 묶어 하나의 팩토리 클래스로 만든 후, 팩토리를 조건에 따라서 생성하도록 팩토리를 다시 만들어 객체를 생성합니다.

위의 예제를 추상 팩토리 패턴으로 설계를 변경해보도록 합시다.

![이미지3](./assets/3.jpg)

간단하게 추상 팩토리 패턴을 적용해보았습니다. 여기서 중요한 점은, 팩토리 메서드로 직접 받던 부분을 클래스 단위로 묶어서 만들고, 그 클래스를 팩토리 메서드로 한번 더 묶었다는 점입니다.

### 코드

```jsx {numberLines}
enum InputType {
    DEFAULT = 0,
    ANIMATED,
    UNSHAPED
}

class Input {
    public static InputFactory(type: InputType): Input {
        switch (type) {
            default:
                return new Input()
            case InputType.ANIMATED:
                return new AnimatedInput()
            case InputType.UNSHAPED:
                return new UnShapedInput()
        }
    }

    render() {
        return `<input />`
    }
}

class AnimatedInput extends Input {
    render() {
        return `<input class="animated-input" />`
    }
}

class UnShapedInput extends Input {
    render() {
        return `<input class="unshaped-input" />`
    }
}

enum ButtonType {
    DEFAULT = 0,
    IMAGE,
    TEXT
}

interface IButton {
    text: string
    src?: string
}

class Button {
    text: string

    public static ButtonFactory(type: ButtonType, text: string, src?: string): Button {
        switch (type) {
            default:
                return new Button(text)
            case ButtonType.IMAGE:
                return new ImageButton(text, src!)
            case ButtonType.TEXT:
                return new TextButton(text)
        }
    }

    constructor(text: string) {
        this.text = text
    }

    render() {
        return `<button>${this.text}</button>`
    }
}

class ImageButton extends Button {
    src?: string

    constructor(text: string, src: string) {
        super(text)
        this.src = src
    }

    render() {
        return `<button class="none">
            ${this.text}
            <img src="${this.src} alt="button-img"/>
        </button>`
    }
}

class TextButton extends Button {
    constructor(text: string) {
        super(text)
    }

    render() {
        return `
            <button class="none">
                ${this.text}
            </button>
        `
    }
}

interface IFormFactory {
    createInput(): Input
    createButton(): Button

    render(): string
}

class NormalForm implements IFormFactory {
    createInput(): Input {
        return Input.InputFactory(InputType.DEFAULT)
    }

    createButton(): Button {
        return Button.ButtonFactory(ButtonType.DEFAULT, 'normal')
    }

    render() {
        return `
            <div>
                ${this.createInput().render()}
                ${this.createButton().render()}
            </div>
        `
    }
}

class AnimatedImageForm implements IFormFactory {
    createInput(): AnimatedInput {
        return Input.InputFactory(InputType.ANIMATED)
    }

    createButton(): ImageButton {
        return Button.ButtonFactory(ButtonType.IMAGE, 'image', 'hihi')
    }

    render() {
        return `
            <div>
                ${this.createInput().render()}
                ${this.createButton().render()}
            </div>
        `
    }
}

class UnShapedTextForm implements IFormFactory {
    createInput(): UnShapedInput {
        return Input.InputFactory(InputType.UNSHAPED)
    }

    createButton(): TextButton {
        return Button.ButtonFactory(ButtonType.TEXT, 'text')
    }

    render() {
        return `
            <div>
                ${this.createInput().render()}
                ${this.createButton().render()}
            </div>
        `
    }
}

enum FormType {
    ONE = 0,
    TWO,
    THREE
}

class Form {
    public static FormFactory(type: FormType) {
        let factory: IFormFactory | null = null

        switch (type) {
            case FormType.ONE:
                factory = new NormalForm()

                break;
            case FormType.TWO:
                factory = new AnimatedImageForm()

                break;
            case FormType.THREE:
                factory = new UnShapedTextForm()

                break;
        }

        return factory.render()
    }
}

console.log(Form.FormFactory(FormType.ONE))
console.log(Form.FormFactory(FormType.TWO))
console.log(Form.FormFactory(FormType.THREE))
```

코드상에서도 많이 변경되지 않았습니다. 지금의 경우 케이스가 적어 상대적으로 코드가 비대해졌지만, 추후 코드가 많아지고 파일 분리가 되면 장점을 발휘할 것입니다.

## 결론

팩토리 메서드 패턴을 이용하여 객체 생성에 대해 쉽게 관리를 하고, 관리가 비대해지면 추상 팩토리 패턴을 이용해 팩토리 메서드로 생성하는 객체를 한 곳에 모아서 객체로 만들어 관리할 수 있습니다.
