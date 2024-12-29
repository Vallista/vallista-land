---
title: Virtual DOM
tags:
  - 프론트엔드
date: 2019-05-04 19:04:34
draft: true
info: false
---

Virtual DOM은[Vue.js](https://www.notion.so/a0a34ea8-52ad-44f8-b109-8ae1fb33bda1), [React.js](https://www.notion.so/a4b13e25-b67a-40af-87d3-c084a29c895c) 와 같은 SPA 프레임워크에서 사용된다.

## 사용하는 이유

JavaScript로 DOM 조작을 하게 되면 브라우저의 렌더링 엔진에서 수많은 일들이 일어난다.

[DOM (Document Object Model)](https://www.notion.so/05b2fa44-e433-4bb2-9fc3-cd59110f6ddb) [브라우저 렌더링 과정](https://www.notion.so/f83ac03f-8261-4f78-82a2-7d415fb9eda2)

### 1. Parsing

- HTML을 [HTML 파싱 표준](https://html.spec.whatwg.org/multipage/parsing.html)에 맞게[DOM (Document Object Model)](https://www.notion.so/05b2fa44-e433-4bb2-9fc3-cd59110f6ddb) 를 만든다.
- StyleSheet를 [파싱 (Parsing)](https://www.notion.so/d21964c0-2af1-4b48-9719-94872efa722b) 알고리즘으로 파싱해 [CSSOM (CSS Object Model)](https://www.notion.so/66bd0de6-0972-4fd9-a82f-f557c172ea1b)을 만든다.

> HTML과 StyleSheer의 Parsing 방법이 다른 이유는 HTML은 [BNF (Backus-Naur Form)](https://www.notion.so/97878963-961a-4ae6-b6d4-40849fb33020) 로 명세할 수 없는 특징을 가지고 있기 때문이다.

### 2. Attachment

결과로 나온 DOM과 CSSOM을 대상으로 Attachment(결합)을 통해 [Create Rendering Tree](https://www.notion.so/0ee913e6-9ebe-44c5-821f-f43d1869fa59) 를 실시한다.

### 3. Layout

만들어진 Render Tree를 대상으로 해당 픽셀에 위치 시킨다.

### 4. Paint

해당 픽셀에 위치시킨 Render Tree Node에 해당하는 스타일을 입힌다.

DOM 조작을 하면 1, 2, 3, 4 번의 동작을 반복한다. 그러므로 DOM을 조작할 때 마다 렌더링 엔진은 쉼없이 돌아간다는 것을 알 수 있다. DOM 조작을 16번 했다고 가정하면 저 위의 단계를 16번 거치게 되는데 Node가 클수록 연산이 매우 힘들어지는 걸 쉽게 예상할 수 있다.

- Layout 잡는 과정과 Paint 잡는 과정은 별개이므로, 16번 DOM 조작이 발생한다면, 32번 이상의 재 연산이 일어날 수 있다.

이런 작업을 모아서 한번에 작업하는 매니저가 **Virtual DOM** 이다.

Virtual DOM은 DOM과 동일한 가상의 DOM을 만든다. 가상의 DOM을 제작한 후 모든 DOM을 움직이는 작업은 Virtual DOM에서 일어난다. Virtual DOM에서 변경될 요소와 변경되지 않을 요소를 판별한 후 최종으로 실제 DOM에 Virtual DOM 데이터를 적용한다.

- Virtual DOM은 변경되는 요소와 변경되지 않는 요소를 판별한다.
- 판별하고 실제 렌더링 될 때, Layout 과정과 Paint 과정의 연산을 줄인다.
- 연산의 횟수는 줄이지만, Layout 규모와 Paint의 규모는 상대적으로 크다.
- Virtual DOM 없이도, 변화된 데이터를 묶어서 DOM Fragment에 전달하면 동일한 효과를 얻을 수 있다.
- Virtual DOM의 중요한 역할은, DOM Fragment를 관리해준다. 또한 변화된 데이터 감지 및 묶는 작업을 자동화 해주며 사용자가 DOM에 접근하지 않고 Virtual DOM에서 작업해도 이런 작업을 자동으로 결과를 내서 DOM을 변경해준다.

## 환상

**Virtual DOM ≠ 빠르다**

React, Vue와 같은 프론트엔드 프레임워크는 Virtual DOM을 사용하므로써 빠르다고 말할 수 없다. 왜냐하면 Virtual DOM을 쓰지않고 손수 최적화 하는 게 대부분이 빠르기 때문이다.

하지만 React, Vue에서 Virtual DOM을 사용하는 이유는 적당히 빠르고, 개발자의 최적화 등의 요소들에서 자유롭게 하며 Product 개발에 집중할 수 있게끔 도와준다.
