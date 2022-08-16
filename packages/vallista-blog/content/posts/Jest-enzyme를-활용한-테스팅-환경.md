---
title: 'Jest, enzyme를 활용한 테스팅 환경'
tags:
  - 프론트엔드
date: 2019-05-13 11:08:23
draft: true
info: false
---

먼저 설명에 들어가기 앞서, 테스트에 대해서 조금 알아보도록 하자.

## 왜 테스트를 해야하는가?

Product를 만들면서 다양한 상황에 대해 프로그래머가 시뮬레이션을 펼치는 건 한계가 있다. 대표적으로 safari, chrome, firefox 등의 다양한 브라우저의 늪에서 모든 브라우저를 켜서 어떤 부분이 다른지 체크하는 일을 계속 하다간 작업할 시간도 없어질 게 분명하다. 그러므로 이런 과정을 테스트 코드를 작성해서 모든 브라우저에서 잘 작동 하는지 모의를 하는게 E2E Test(End to End Test)이다. E2E Test는 UI 테스트라고도 불린다. E2E Test는 최종적으로 거치는 테스트 flow 중 하나이고, 테스트에는 다양한 종류가 있다.

[testing pyramid - Google Search](https://www.google.com/search?q=testing+pyramid)

위 문서의 Testing Pyramid를 보면 한 눈에 볼 수 있는 그림이 있는데, 해당 그림처럼 테스트는 피라미드 구조로 되어 있고 크게 3가지로 분류할 수 있다.

- Unit Tests
- Integration Tests
- E2E Tests

보통 테스팅을 할 때 '피라미드의 흐름대로 따라간다' 라고 이야기하는데 대부분은 Unit Test를 작성하고, 이어서 Integration Test를 작성한 뒤, 몇 가지 E2E Test를 작성한다는 의미이다.

하지만 React는 주로 Component 단위로 개발되기 때문에 테스트할 때 위의 일반적인 접근 방법이 아닌, 다른 방법으로 접근한다. 바로, '**Integeration Tests를 많이 작성하고, Unit Test를 최소한으로 작성하는**' 전략으로 접근한다.

## Unit(단위), Integration(통합), E2E(UI, 전체)

**단위 테스트 :** 애플리케이션 일부 (컴포넌트 단위)를 독립적으로 테스트하는 걸 일컫는다.

**통합 테스트 :** 서로 다른 부분(여러 컴포넌트)이 모여 특정 상황에서 잘 동작 하는지 체크하는 걸 일컫는다.

**전체 테스트 :** 애플리케이션을 브라우저 환경에서 테스트하는 행위

통합 테스트에 대해 조금 더 예를 들면, 특정 컴포넌트의 모든 필수 속성값(Props)이 Child Component에 제대로 전달되었는지 확인하는 경우 등이 있다.

전체 테스트에 대해 조금 더 예를 들면, 로그인 시, 이메일 주소와 비밀번호를 입력한 뒤에 백엔드 서버로 Form을 제출하는 회원가입 과정을 흉내낼 수 있다.

## Why Jest?

Jest는 내장

## 문법

Test Tool은 기본적으로 비슷한 문법을 공유하는데, 아래를 보면 쉽게 알 수 있다.

```javascript {numberLines}
describe('Local State', () => {
  it ('state의 counter가 하나 올려짐', () => {
    ...
  })

  it ('state의 Counter가 하나 줄여짐', () => {
    ...
  })

})
```

- describe

describe는 블록 단위로 테스트 묶음을 정의한다.

- it

it은 테스트 케이스를 정의한다.

it 블록에서 테스트를 할 때 보통 세 단계를 거친다. 값을 정의(arrage), 실행(act), 단언(assert)한다.

## Enzyme를 이용한 React 컴포넌트 테스팅

enzyme를 이용해 react component를 단위, 통합 테스팅을 할 수 있다.

```javascript {numberLines}
describe('App Component', () => {
  it('Counter 래퍼 그려낸다', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find(Counter)).to.have.length(1)
  })
})
```

- shallow
  shallow는 컴포넌트를 그리는 함수이다. 딱 해당 컴포넌트만 그려내고, 컴포넌트의 자식 컴포넌트는 그리지 않는다. 컴포넌트를 분리해서 테스트 할 수 있기 때문에 단위 테스트에 적합하다.

- expect
  expect는 shallow등으로 가져온 element의 갯수 및 데이터를 확인할 수 있다.
  위의 예제에서, to.have.length 를 통해, 가지고 있는 자식 컴포넌트의 개수가 몇 개인지 가져와서 제대로 출력이 잘 됐는지 확인할 수 있다.

위 두 개의 함수로 컴포넌트 단위를 그려서 단위 테스트를 할 수 있는 반면, 더 넓은 범위로 통합 테스트도 가능하다.

예를 들어, 단순히 HTML 태그가 제대로 그려졌는지 확인하는 행위 뿐만 아니라 컴포넌트에 정확하게 속성이 전달되었는지 확인할 수 있다.

```javascript {numberLines}
describe('App Component', () => {
  it('Counter 래퍼를 그려낸다', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find(Counter)).to.have.length(1)
  })

  it('Counter 래퍼에 있는 모든 Prop이 전달된다', () => {
    const wrapper = shallow(<App />)
    let counterWrapper = wrapper.find(Counter)

    expect(counterWrapper.props().counter).to.equal(0)

    wrapper.setState({ counter: -1 })

    counterWrapper = wrapper.find(Counter)
    expect(counterWrapper.props().counter).to.equal(-1)
  })
})
```

예제 두 개를 보면서 단위 테스트와 통합 테스트의 경계가 애매할 수 있다. 하지만 이번 테스트는 두 컴포넌트 사이의 기능이 제대로 동작 하는지 체크하는 테스트이므로 통합 테스트로 볼 수 있다.

위의 예제와 비슷하게 상태 변화를 테스트 하면서, 상태 변화에 따라 렌더링이 변경되는 부분은 렌더링이 되어 있는지 되어있지 않은 지 테스트 할 수 있다.
