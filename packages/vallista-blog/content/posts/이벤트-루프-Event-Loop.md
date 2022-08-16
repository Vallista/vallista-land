---
title: 이벤트 루프 (Event Loop)
tags:
  - 프론트엔드
date: 2019-05-09 19:14:14
draft: true
info: false
---

JavaScript는 단일 쓰레드 기반의 언어이다. 하지만 작동하는 걸 보면 단일 쓰레드에서 돌아가는 거라는 생각이 들지 않는다. CSS 애니메이션이 돌아가면서 클릭 이벤트도 받고 다양한 동작이 동시에 작동한다.

이런 작업이 가능한 이유는 이벤트 루프(Event Loop) 라는 개념이 있기 때문이다.

Node.js를 소개할 때 '**이벤트 루프 기반의 비동기 방식으로 Non-blocking IO를 지원하고**' 를 많이 보게 되는데 실제로 Node.js는 이벤트 루프를 이용해서 비동기 방식으로 동시성을 지원한다. 그렇기 때문에 이벤트 루프는 중요하고, 잘 이해하고 있어야한다.

## ECMAScript에는 이벤트 루프가 없다

ECMAScript 스펙에 이벤트 루프에 대한 내용을 찾기 어렵다. 다시 말해서, ECMAScript에는 동시성이나 비동기와 같은 언급이 없다. (ES6이후는 조금 다르다.)

V8과 같은 JavaScript 엔진은 **단일 호출 스택(Call Stack)**을 사용하며, 요청이 들어올 때 마다 해당 요청을 순차적으로 담아놓고 처리할 때마다 순서대로 실행한다.

비동기 요청이나 동시성에 대한 처리는 브라우저나 Node.js에서 처리한다.

- V8과 같은 자바스크립트 엔진은 단일 호출 스택을 사용하여 단순히 순차적으로 처리한다.
- 비동기나 동시성 작업은 Node.js 환경이나 브라우저에서 담당한다.

![](https://cloud.githubusercontent.com/assets/12269489/16215491/b1493856-379d-11e6-9c16-a9a4cf841567.png)

실제로 비동기 호출을 위해 사용하는 setTimeout, XMLHttpRequest는 Web API 라는 JavaScript Engine 영역이 아닌, 브라우저 영역에 정의되어 있다. 또한 이벤트 루프나 Task Queue도 JavaScript Engine 외부에서 작동한다.

- JavaScript Engine은 단일 호출 스택과 Heep 영역을 관할한다.
- setTimeOut과 같은 함수들은 (Global Function) JavaScript 외부에 WebAPI 형태로 존재한다.
- Task Queue와 이벤트 루프도 JavaScript Engine 외부에 존재한다.

![](https://pbs.twimg.com/media/Bt5ywJrIEAAKJQt.jpg)

- Node.JS는 비동기 IO를 지원하기 위해 LIBUV 라이브러리를 사용한다.
- LIBUV 라이브러리는 이벤트 루프를 제공한다.
- JavaScript Engine은 비동기 작업을 위해 Node.js의 API 호출한다.

- '**JavaScript는 단일 쓰레드**' 라는 이야기는 '**JavaScript 엔진이 단일 호출 스택을 사용한다**' 관점에서 사실이다.
- Node.js, 브라우저에서의 처리는 여러개의 쓰레드를 활용해 처리하며, 이러한 구동 환경이 JavaScript 환경과 상호 연동 되기 위해서 사용하는 게 이벤트 루프이다.

## 단일 스택 호출 과 Run-To-Completion

JavaScript에서 함수를 실행하는 방식을 Run-to-Completion 라고 말한다.

이는, function을 실행해서 작업이 끝날 때까지 다른 작업을 하지 못한다는 의미이다.

JavaScript를 처리하는 JavaScrfipt Engine은 단일 호출 스택으로 하나의 작업만 처리하기 때문에 현재 스택에 쌓여있는 모든 함수들이 실행이 끝나서 스택에서 제거되기 전까지는 다른 함수도 실행될 수 없다. 9

```javascript {numberLines}
function delay() {
  for (var i = 0; i < 10000000; i++);
}

function foo() {
  delay()
  bar()
  console.log('foo!')
}

function bar() {
  delay()
  console.log('bar!')
}

function baz() {
  console.log('baz')
}

setTimeout(baz, 10)
foo()
```

예제는 JavaScript의 Run-to-Completion을 확인할 수 있는 간단한 예제이다.

- delay 함수는 1000만회 반복하는 for loop
- foo 함수는 delay 이후, bar를 실행하고, console.log로 foo!를 실행한다.
- bar 함수는 delay 이후, console.log('bar!')를 실행한다.
- baz 함수는 console.log('baz!')를 실행한다.
- setTimeout으로 baz를 0.01초 후에 출력한다.

![](Slide1-0ab0eb99-8bfd-470f-99e0-afec00992e8c.png)

1. Browser Web API, 10ms 후 baz를 실행하는 setTimeout을 실행한다.
2. setTimeout은 Browser의 Task queue에 추가된다.
3. JavaScript Engine에서 실행 컨텍스트 스택에 foo를 push 한다.
4. foo를 실행하고, delay, bar 함수를 순차적으로 실행 컨텍스트 스택에 push하고 실행하고 제거 행위를 반복한다.
5. foo 자체가 실행 컨텍스트에 계속 유지되므로, 마지막까지 돌고, 그 다음 마지막 페이즈에 setTimeout으로 돌린 baz가 실행된다.

JavaScript는 함수가 실행되면 함수가 완료될 때까지 다른 임무를 시작하지 않는다. 함수 단위로 실행 컨텍스트가 생성되어 쌓이므로 함수의 마지막 라인이 실행되어야 비로소 다른 실행 컨텍스트 및 이벤트를 실행하게 된다.

setTimeout 함수는 브라우저의 타이머 이벤트를 요청하여 브라우저는 Task Queue에 담아놓는다. 그 후 foo 함수가 스택에 추가되고 foo 함수 내부에서 실행되는 함수들을 전부 실행한 후, 마지막 라인이 되어서야 foo() 함수가 스택에서 삭제된다.그 이후, baz가 스택에 추가되어 실행된다. 이러한 루프를 돌다보니 baz는 10ms 보다 오랜 시간이 걸려서 실행된다.

## Task Queue와 Event Loop

Web API의 setTimeout 함수가 어떤 과정으로 실행이 마지막에 되는지 보면, Task Queue와 Event Loop와 밀접한 관련이 있다.

Task Queue는 Web API에서 호출한 함수들을 담아놓는 FIFO 형태의 Stack으로 이루어져 있다. 그래서, JavaScript Engine에서 전달받은 API 함수를 보관하고 있다가, 현재 stack frame이 끝나면 Event Loop가 현재 JavaScript Engine 내의 Executation Context Stack에 어떤 작업이 처리 되는 지 확인하고 작업이 비어 있다면 Task Queue의 작업을 꺼내와서 실행한다.

이벤트 루프는 간단하게 아래와 같이 되어있다.

```javascript {numberLines}
while (queue.waitForMessage()) {
  queue.processNextMessage()
}
```

waitForMessage() 메소드는 현재 실행중인 태스크가 없을 때 다음 태스크가 큐에 추가될 때 까지 대기한다.

'현재 실행중인 태스크가 없는지', '태스크 큐에 태스크가 있는지'를 반복적으로 확인한다.

- 모든 비동기 API 작업이 끝나면 콜백 함수를 테스크 큐에 추가한다.
- 이벤트 루프는 '현재 실행중인 태스크가 없을 때' (주로 호출 스택이 비워졌을 때) 태스크 큐의 첫 번째 태스크를 꺼내와 실행한다.

![](https://image.toast.com/aaaadh/real/2018/techblog/eventloop.jpg)

## 비동기 API와 try-catch

```javascript {numberLines}
$('.btn').click(function () {
  // A
  try {
    $.getJSON('/api/members', function (res) {
      // B
      // 에러 발생!
    })
  } catch (err) {
    console.log('Error : ' + e.message)
  }
})
```

click시 네트워크 통신을 하는 간단한 소스인데, 이 소스의 네트워크 callback 내부에서 에러가 났다면 try catch로 잡히지 않는다.

1. A 함수가 실행될 때 `$.getJSON` 함수를 통해 `/api/members` 로 `XMLHttpRequest` 를 요청한다. call stack에서 A 함수는 삭제된다.
2. 브라우저에서 비동기 처리를 마치고 task queue에 등록된다.
3. Call Stack에 등록된 A 함수가 실행을 마치고 브라우저 task queue의 첫번째 callback인 B함수를 실행한다.
4. B 함수에서 에러가 나온다.
5. 하지만 에러를 반환하지 않는다. 그 이유는 A함수의 내부에서 try와 catch를 해줬으나 A의 환경에서 구동되는게 아닌, task queue를 지나 javascript engine의 call stack에 등록되어서 새로운 환경에서 작동된다.

### 해결 방법

```javascript {numberLines}
$('.btn').click(function () {
  // A
  try {
    $.getJSON('/api/members', function (res) {
      // B
      try {
      } catch (err) {}
    })
  } catch (err) {
    console.log('Error : ' + e.message)
  }
})
```

해결 방법은 B 함수 내부에도 try catch를 설치하는 방법이다. 하지만 이와 같은 경우에도 네트워크 에러나 서버 에러는 따로 error callback을 통해 잡아야 한다.

### setTimeout(fn, 0)

setTimeout 함수를 활용하면 무궁무진한 일을 할 수 있다. 이는 setTimeout 뿐만 아니라, 다양한 Web API로도 가능하다.

```javascript {numberLines}
setTimeout(function () {
  console.log('1')
}, 0)
console.log('2')
```

위 소스를 실행하면 이제는 2가 찍힌 후, 1이 찍힌다는 걸 알 수 있다.

그렇다면 이걸 이용해서 다음 코드를 수정해보자.

```javascript {numberLines}
$('.btn').click(function () {
  showWaitingMessage()
  longTakingProcess()
  hideWaitingMessage()
  showResult()
})
```

- showWaitingMessage : 로딩을 브라우저에 띄우는 함수
- longTakingProcess : 매우 긴 (동기) 작업
- hideWaitingMessage : 로딩을 끄는 함수
- showResult : 작업 결과 보여주는 함수

매우 긴 동기 작업(longTakingProcess) 대기 시간에는 로딩 브라우저를 띄우고, 동기 작업이 끝나면 로딩을 종료하고 결과를 보여주는 함수를 만드는게 목표이다.

위에서 이벤트 루프에 대해서 공부했으므로 이 문제의 원인을 대강 알 수 있을꺼라 생각한다. 자세한 함수의 내부 구현로직은 보여주지 않았으나, showWaitingMessage와 hideWaitingMessage 두 함수는 HTML을 변경하는, 즉 DOM 조작을 하는 함수를 내부적으로 호출하는 소스를 작성했다. 이 두 함수는 브라우저의 Rendering Engine에 요청하는 작업을 가지므로, task queue에 넣는 작업을 하게 된다.

순서는 아래와 같다.

1. 익명함수 function() {}, JavaScript Engine call stack에 추가된다.
2. showWaitingMessage가 실행된다. 내부에서 로딩을 여는 작업을 Web API로 요청한다. 브라우저의 task queue에 쌓인다.
3. task queue에 쌓였지만 아직 익명함수 function이 call stack에 남아있으므로, task queue의 데이터를 가져오지 못한다.
4. 그 상태로 longTakingProcess 작업에 들어간다.
5. 작업을 완료하고, hideWaitingMessage를 호출한다. hideWaitingMessage 내부에서 로딩을 닫는 Web API로 작업을 요청한다. 브라우저의 task queue에 쌓인다.
6. 그 후 결과를 보여주는 showResult() 함수를 호출한다.
7. 익명함수 function이 JavaScript Engine의 call stack에서 사라진다.
8. task queue에서 JavaScript engine의 call stack이 비어 있는 걸 확인하고 task queue의 첫 번째 callback인 showWaitingMessage WebAPI를 실행한다.
9. 실행 후, 빈 call stack을 체크하여 hideWaitingMessage WebAPI를 실행한다.

결과를 봤을 때 showWaitingMessage와 hideWaitingMessage는 원하는 시점에 실행이 되지 않는다.

그러므로 아래와 같이 바꾸면 해결할 수 있다.

```javascript {numberLines}
$('.btn').click(function () {
  showWaitingMessage()
  setTimeout(function () {
    longTakingProcess()
    hideWaitingMessage()
    showResult()
  }, 0)
})
```

이렇게 실행하게 되면, showWaitingMessage() 의 WebAPI 호출이 task queue에 추가되고, 그 후 setTimeout으로 추가된 익명함수가 showWaitingMessage() WebAPI 호출 다음의 task queue에 호출되므로 순차적으로 작업이 일어난다.

꼭 렌더링 관련이 아니어도, setTimeout으로 작업 단위를 나눠 주면 좋다.

여기서 한 가지 팁은, setTimeout(fn, 0)은 실제로 바로 실행을 하는게 아니다. 브라우저 내부 타이머는 최소 단위를 정하여 관리하기 때문에 실제로 그 단위를 지나야 실행된다. 크롬의 경우 기본적으로 4ms를 가지므로, setTimeout(fn, 4)와 동일하다.

이런 문제를 해결하기 위해, IE10애서 지원되는 setImmediate라는 API가 제안되었으나 표준은 되지 못했다.

## Promise와 Event Loop

이런 Event Loop 개념은 [HTML 공식문서](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)에 정의 되어 있다. 문서를 보면, 도중에 마이크로 태스크(micro task)라는 단어가 보이는데, 이 단어는 Promise같은 비동기 이벤트에서 쓰이는 task를 일컫는다.

```javascript {numberLines}
setTimeout(function () {
  console.log('1')
}, 0)
Promise.resolve()
  .then(function () {
    console.log('2')
  })
  .then(function () {
    console.log('3')
  })
```

이 코드에서 실행 순서는 어떻게 될 지 예상할 수 있는가?

예상 프로세스를 생각해보면 아래와 같다.

1. Promise.resolve의 최소 동작 시간이 없다는 가정

1) setTimeout를 실행하고 최소 동작 시간(4ms → chrome)후 callback function은 task queue에 쌓인다.
2) Promise.resolve().then 을 통해, then의 callback 함수가 실행된다. 이 때, 최소 동작 시간이 없으므로 바로 실행되어 task queue에 setTimeout callback task보다 빠르게 실행된다.
3) 출력은 '2', '3', '1' 순으로 된다.

2. 동일하게 갖고 있다면 '1', '2', '3' 순으로 출력된다.

정답은 '2' - '3' - '1' 순으로 출력이 된다. 이렇게 출력이 되는 이유가 위에서 살펴본 대로 Promise는 최소 동작 시간 때문에 일까?

이 때 적용되는 개념이 마이크로 테스크(Microtask)이다. Promise는 Microtask를 사용해서 setTimeout보다 우선순위로 사용된다.

### 마이크로 테스크(micro task)

마이크로 테스크는 일반 테스크보다 더 높은 우선순위를 갖는 테스크라 보면 된다. 태스크 큐에 대기중인 테스크가 있더라도, 마이크로 테스크가 먼저 실행된다.

위의 예제를 조금 더 살펴보면,

1. setTimeout 함수는 callback을 테스크 큐에 추가한다.
2. Promise 의 then 메서드는 callback을 테스크 큐가 아닌, 별도의 **microtask queue**에 추가한다.
3. event loop는 microtask queue가 비어졌는지 확인하고 promise의 첫번째 callback을 실행한다.
4. 실행 후, chain되어 있던 다음 then의 callback이 microtask queue에 추가된다.
5. event loop는 microtask queue가 비어있지 않으므로 microtask queue의 callback을 실행한다.
6. 여기까지 '2', '3'이 출력되었고, microtask queue가 이제 비어있으므로 task queue를 확인하고 실행한다.
7. '2' '3' '1'이 출력된다.

[자바스크립트와 이벤트 루프 : TOAST Meetup](https://meetup.toast.com/posts/89)
