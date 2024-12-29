---
title: 제너레이터 (Generator)
tags:
  - 프론트엔드
date: 2019-07-12 12:05:15
draft: false
info: false
---

얼마 전, Generator가 무엇인가요? 라는 질문을 들었을 때 대답을 명확히 하지 못했다. 많이 쓰고 있지만 실제로 사용법 혹은 대략적인 개념밖에 설명을 못해서 이 개회에 정확히 알아야겠다는 생각이 들어 Generator의 개념과 사용방법에 대해서 이야기 해보려 한다.

## Generator

컴퓨터 과학에서 Generator는 루프의 `반복 동작을 제어`하는데 사용될 수 있는 루프이다. 여기서 알 수 있는 사실은, 모든 Generator는 `Iterator(반복자)`라는 것이다. Generator는 매개변수를 가지고 있고, 호출 할 수 있으며, 값을 생성한다는 점에서 배열을 반환하는 행동과 비슷한데, 모든 값을 포함하는 배열을 만들어서 반환하는게 아니라 한번에 한 작업을 처리하고 하나씩 산출한다. 그래서 전체 배열을 반환하는 로직보다 메모리가 적게 필요하며 첫 실행시에 갯수 제한 없이 즉시 작업을 처리하도록 명령할 수 있다. 쉽게 말해서, Generator는 기능이 붙은 Iterator(반복자)라고 볼 수 있다.

Generator는 `Coroutine`이나, `First-class continuations`처럼 흐름을 제어하는 구조적인 측면에서 구현될 수 있다.

> **Coroutine**
> Coroutine(코루틴)은 실행 중지 및 재시작이 가능하도록 하여 non-preemptive multitasking(선제적 다중작업) 서브루틴을 일반화하는 컴퓨터 프로그램 구성 요소이다. 말이 좀 어려운데, 조금 더 펼쳐서 이야기를 해보자. 어떤 프로세스가 CPU를 할당 받으면 그 프로세스가 종료되거나 IO Request가 발생한다. 그래서 자발적으로 대기 상태로 들어갈 때 까지 계속 실행이 된다. 즉, 한 작업이 끝나고 다음 작업을 한다는 이야기이다. Coroutine은 프로그래밍 언어마다 지원하는 경우가 많다. 코루틴은 해당 로직이 동작하면서 정지하거나 재개하는 등의 행위를 할 수 있다.

> **First-class continuations**
> First-class continuations(1등급 연속체)는 명령의 실행 순서를 완전히 제어할 수 있는 구문이다. 지금 실행시킨 함수 호출이 끝나고 "발생시킨 함수" 혹은 "발생시키기 이전 함수"로 점프하는 데 사용된다. 이는, 프로그램의 실행 상태를 유지하는 것으로 생각할 수 있다. 설명이 어려운데, 보통 "Continuation Sandwich"(연속적인 샌드위치)로 설명한다.
> `주방 안의 냉장고 앞에서 샌드위치 재료를 꺼낸다고 생각해보자. 냉장고 안에서 칠면조나 빵과 같은 재료를 연속적으로 꺼내 샌드위치를 만들게 된다. 만든 샌드위치를 식탁위에 놓고 보니, 배가 차지 않을 것 같아서 샌드위치에 패티를 추가하기 위해 냉장고 앞으로 향했다. 냉장고 안에는 재료가 모두 소진되어 없었고 만든 샌드위치를 먹기위해 식탁으로 향했다.`
>
> 연속적인 샌드위치 예제에서 알 수 있는 것은 `샌드위치는 프로그램 데이터`이며, `샌드위치 만들기` 루틴을 호출한 후 돌아오는게 아닌, `현재 지속되는 샌드위치 만들기` 루틴을 호출하여 샌드위치를 만든 다음, 실행이 중단된 곳에서 다시 진행된다.
> 대표적인 예는, `async` `await`로 들 수 있다.

## History

제너레이터는 CLU(1975년)이라는 언어에 처음 대두가 되었다. 이후에 나온 Icon(1977년)이라는 문자열 조작 언어에서 제너레이터는 돋보이는 특징이었다. Python부터 JavaScript ES6에 이르기까지 많은 부분에 점차 Generator가 추가되었다. (각 언어마다 이름이 다를 수 있다. C#에서는 Generator를 Iterator로 명칭한다)

## Why use?

> 하단의 소스코드는 JavaScript를 기준으로 설명한다.

먼저, 일반적인 반복문을 보자

```javascript {numberLines}
for (let i = 0; i < 10; i++) {
  console.log(i)
}

const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] // Symbol.iterator

for (const val of arr) {
  // ES6 for ... of
  console.log(val)
}
```

동일한 값을 출력하지만, for ... of 문법은 Symbol.iterator 속성을 가지는 컬렉션에 대해서 반복을 할 수 있다는 특징이 있다. 즉 iterable한 객체에 대해서 사용할 수 있다는 뜻이다. JavaScript에서 Iterable한 객체는 `Symbol.iterator`를 속성으로 가지고 있고 iterator를 반환하는 객체를 뜻한다.

> JavaScript에서는 `Symbol.iterator`로 정의하여 사용했지만 다른 언어에서는 언어 내의 스펙이 따로 있을 것이다.

이런 규칙을 `Iterable Protocol (이터러블 프로토콜)`이라 명칭하며, 이러한 규칙을 따르는 객체를 `Iterable Object (이터러블 객체)`라고 한다.

## Iterator

앞서 말한대로 Symbol.iterator를 속성으로 가지고 있으며, Iterator를 반환하는 객체를 Iterable 객체라고 한다.

`[Symbol.iterator]()` 객체로 반환하는 iterator 객체는 `next` 메소드를 가지고 있으며, `next` 메소드는 반환값으로 iterator 종료가 되었는가에 대한 플래그인 `done`과 값을 나타내는 `value` 두 가지를 반환한다. 이런 규칙을 `Iterator Protocol (이터레이터 프로토콜)`이라고 한다.

일반적으로 아래와 같이 하나의 객체에 Iterator Protocol과 Iterable Protocol을 구현한다.

```javascript {numberLines}
const iterator = {
  // iterator 객체
  [Symbol.iterator]: function () {
    // iterable 객체
    return this // iterator 객체를 반환
  },
  next: function () {
    // iterator 객체는 next 함수를 내장하고 있어야 한다.
    return { done: false, value: 'Hello' } // iterator protocol 규칙
  }
}

console.log(iterator[Symbol.iterator]()) // this 반환
console.log(iterator.next()) // { done: false, value: 'Hello' }
```

해당 소스는 종료 시점 없이 계속 값으로 'Hello'를 반환하는 예제이다.

Iterator의 장점은 다양한 Iterable 객체에 대해 하나의 Iterator Protocol을 구현하여 순회할 수 있다는 장점이 있다.

## Generator Function

왜 Generator를 설명하는 곳에서 Iterator를 설명했는가? 그 이유는 1) Iterable과 Iterator를 알아야 이해할 수 있기 때문이며 2) JavaScript의 Generator는 위에서 설명한 일련의 과정을 쉽게 만드는 방법이기 때문이다.

### Create

예시로 덧셈과 곱셈을 하는 프로세스를 이터레이터로 구현해보자.

```javascript {numberLines}
class calculatingIterator {
  constructor(start, dest) {
    this.value = 1
    this.start = start
    this.dest = dest
  }

  [Symbol.iterator]() {
    // Iterable Protocol
    return this
  }

  next() {
    let value = this.value
    this.start++

    if (this.start > this.dest) {
      return { done: true, value: undefined }
    }

    if (this.start === 2) this.value *= 10
    else this.value += 1

    return { done: false, value }
  }
}

const iterator = new calculatingIterator(0, 3)

console.log(iterator.next()) // { done: false, value: 1 }
console.log(iterator.next()) // { done: false, value: 2 }
console.log(iterator.next()) // { done: false, value: 20 }
console.log(iterator.next()) // { done: true, value: undefined }
```

이 코드를 ES6의 제너레이터를 사용하여 변경해보도록 하자.

```javascript {numberLines}
function* calculatingGenerator(start, dest) {
  let value = 0

  for (let i = start; i < dest; i++) {
    if (i == 2) value *= 10
    else value += 1

    yield value
  }
}

const iterator = calculatingGenerator(0, 3)

console.log(iterator.next()) // { done: false, value: 1 }
console.log(iterator.next()) // { done: false, value: 2 }
console.log(iterator.next()) // { done: false, value: 20 }
console.log(iterator.next()) // { done: true, value: undefined }
```

제너레이터의 소스코드를 보면, 직접 iterable protocol과 iterator protocol를 구현한 객체처럼 결과가 나오는 걸 볼 수 있다. 그렇다면 Generator를 효과적으로 사용할 수 있는 비동기 예제를 통해서 사용 예를 조금 더 보도록 하자.

### Asynchronous Processing

메인 페이지에서 세션체크 후 포스트, 인기있는 포스트, 이 달의 포스트를 가져오려고 한다. 이럴 때 구상할 수 있는 방법은 아래와 같다.

```javascript {numberLines}
function getSessionCheck() { /* 비동기 처리 */ }
function getPostList() { /* 비동기 처리 */ }
function getFavoritePostList() { /* 비동기 처리 */ }
function getMontlyPostList() { /* 비동기 처리 */ }

function loadMainPage() {
  getSessionCheck() // 세션 체크
  getPostList() // 전체 포스트
  getFavoritePostList() // 인기있는 포스트
  getMontlyPostList() // 이 달의 포스트

  ...
}
```

세션체크가 끝나고 포스트리스트 부르기, 그 다음 인기있는 포스트, 그 다음...
순차적인 진행을 의도했으나 JavaScript에서 위와 같은 구문은 제대로 실행되지 않는다.
각 변수에는 올바른 값이 들어가지 않는 이유는 네트워크를 처리 하기 전에 반환이 되기 때문이다.

그렇다면 이를 해결할 수 있는 방법은 무엇일까? ES6에는 Promise라는 문법이 존재한다.

#### Promise를 이용해서 비동기 처리

Promise를 이용해서 비동기 처리 코드를 작성해보자.

```javascript {numberLines}
function getSessionCheck() {
  /* 비동기 처리 */
} // promise 객체 반환
function getPostList() {
  /* 비동기 처리 */
} // promise 객체 반환
function getFavoritePostList() {
  /* 비동기 처리 */
} // promise 객체 반환
function getMontlyPostList() {
  /* 비동기 처리 */
} // promise 객체 반환

const loadMainPage = () => new Promise((resolve) => resolve(getSessionCheck()))

loadMainPage().then(getPostList()).then(getFavoritePostList()).than(getMontlyPostList())
```

promise를 사용하게 되면, than을 통해서 동기로 실행할 수 있다. 동기로 실행할 수 있다는 말은 네트워크 작업이 처리되고, 그 이후 순차적으로 다음 함수를 방문하여 일을 처리한다는 말이다.
즉, `loadMainPage`는 `resolve(getSessionCheck())`를 반환하므로 Promise function이 되었고 해당 함수를 실행후 `.then`을 통해 `getPostList()` 그 다음은 `getFavoritePostList()` 그 다음은 `getMontlyPostList()`를 실행하게 된다.

하지만 위의 호출 flow는 우리가 생각했던 그런 구조와 다른 방향으로써의 해결이라는 생각이 든다. 왜냐하면 Promise를 통해 `.then`을 호출해서 다음 함수를 호출하게 되면 다음 함수에 대한 제어권이 없어지기 때문이다. 또한 실행되는 환경이 다르기 때문에 클로저나 멤버변수를 사용하기 힘들어진다.

#### Generator를 이용해서 비동기 처리

그렇다면 Promise가 아닌, Generator를 사용하여 처리해보자. 위의 문제점을 generator는 해결할 수 있으며 오히려 더 직관적으로 보이게 코딩할 수 있다.

```javascript {numberLines}
function getSessionCheck() {
  /* 비동기 처리 */
}
function getPostList() {
  /* 비동기 처리 */
}
function getFavoritePostList() {
  /* 비동기 처리 */
}
function getMontlyPostList() {
  /* 비동기 처리 */
}

function* loadMainPage() {
  yield getSessionCheck()
  yield getPostList()
  yield getFavoritePostList()
  yield getMontlyPostList()
}

const iterator = loadMainPage()

console.log(iterator.next()) // { value: getSessionCheck()값, done: false }
```

처음 우리가 설계했던대로 얼추 비슷하게 코딩이 되었다. 그런데 조금 다른 부분이 보인다.
generator는 iterator를 반환하는 함수인데, 반환하기 위해서는 `.next()`함수를 통해 다음으로 넘어가야하는 문제가 있다.

그렇다면 이 부분을 해결할 수 있는 방법이 무엇일까?

1. 함수 내 호출

```javascript {numberLines}
function getSessionCheck(itr) {
  /* 비동기 처리 */
  itr.next()
} // promise 객체 반환

function getPostList() {
  /* 비동기 처리 */
  itr.next()
} // promise 객체 반환

function getFavoritePostList() {
  /* 비동기 처리 */
  itr.next()
} // promise 객체 반환

function getMontlyPostList() {
  /* 비동기 처리 */
  itr.next()
}
```

심플하다. 함수를 사용하고 끝나면 next()를 함수 내에서 호출해준다.
하지만 이렇게되면 함수간에 의존성이 생기므로 별로 좋은 코딩으로 보이지 않는다.

2. 재귀호출

```javascript {numberLines}
function getSessionCheck() {
  /* 비동기 처리 */
}
function getPostList() {
  /* 비동기 처리 */
}
function getFavoritePostList() {
  /* 비동기 처리 */
}
function getMontlyPostList() {
  /* 비동기 처리 */
}

function* loadMainPage() {
  yield getSessionCheck()
  yield getPostList()
  yield getFavoritePostList()
  yield getMontlyPostList()
}

function runner(generator) {
  const iterator = generator()

  ;(function repeatIterator({ done, value }) {
    if (done) return value // done이 true가 될 때 까지
    repeatIterator(iterator.next()) //다음 iterator 호출
  })(iterator.next()) // 시작
}

runner(loadMainPage)
```

재귀호출을 통해, 해당 generator에 맞는 컨디션을 제작하여 한번 호출시 연속해서 실행 할 수 있는 로직을 구현할 수 있다.

#### 번외 - Async/Await를 이용하여 좀 더 normalize하기

한편, Generator는 caller와 callee가 명확하게 구분되어 있어 동기적 프로그래밍을 하기위해서 위의 runner를 만들어 줬는데, 이는 ES6의 Async/Await를 사용하여 우리가 궁극적으로 추구하던 방향과 비슷하게 코딩을 할 수 있다.

```javascript {numberLines}
function getSessionCheck() {
  /* 비동기 처리 */
}
function getPostList() {
  /* 비동기 처리 */
}
function getFavoritePostList() {
  /* 비동기 처리 */
}
function getMontlyPostList() {
  /* 비동기 처리 */
}

async function loadMainPage() {
  await getSessionCheck()
  await getPostList()
  await getFavoritePostList()
  await getMontlyPostList()
}

loadMainPage()
```

Javascript ES6부터 Async/Await 구문을 지원하게 되었다. 문법을 사용하여 async function, 즉 일종의 코루틴 함수로 만든다.
`loadMainPage()`을 호출하면 순차적으로 `getSessionCheck()`, `getPostList()`, `getFavoritePostList()`, `getMontlyPostList()`를 호출한다.

## Finish

흔히 쓰고 있었지만 정의를 내리기 힘들었던 Generator를 사석에서 누군가에게 설명할 줄 알게 되었다. 또한 사용방법과 어떤 상황에서 쓰이는지, 더 좋은 대안은 무엇이 있는지도 알아보면서 과거에 이런 정의를 내리던 프로그래머들이 대단하다는 생각이 들었다.

공부를 하면서 다양한 개념을 알게 되었다. `Cooperative`, `Coroutine`, `Continuation`, `Concurrency`, `parallelism`과 같은 용어들의 정의를 쭉쭉 살펴보고 파봐야겠다. 이런 용어들의 개념을 정확히 알고 사용한다면 커뮤니케이션과 검색 키워드 그리고 개발에 많은 도움이 되지 않을까 생각한다.

## Reference

- [Generator (computer_programming) - wikipedia](<https://en.wikipedia.org/wiki/Generator_(computer_programming)>)
- [Coroutine - wikipedia](https://en.wikipedia.org/wiki/Coroutine)
- [what is the difference between an iterator and a generator - stack overflow](https://stackoverflow.com/questions/1022564/what-is-the-difference-between-an-iterator-and-a-generator)
- [Cooperative multitasking - wikipedia](https://en.wikipedia.org/wiki/Cooperative_multitasking)
- [Continuation - wikipedia](https://en.wikipedia.org/wiki/Continuation)
- [Understanding Generators in ES6 JavaScript with Examples](https://codeburst.io/understanding-generators-in-es6-javascript-with-examples-6728834016d5)
- [Iteration Protocol](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Iteration_protocols)
