---
title: 클로저 (Closure)
tags:
  - 프론트엔드
date: 2019-05-11 10:55:07
draft: true
info: false
---

클로저를 알기 위해, JavaScript는 Lexical Scope(유효 범위 지정)을 어떻게 하는지 알아야 한다.

참고:[호이스팅, 실행 컨텍스트](https://www.notion.so/312260b5-c1b9-4a66-8807-29f87da4c242)

## 유효 범위 지정 (Lexical Scope)

```javascript {numberLines}
function init() {
  var name = 'Vallista'
  function displayName() {
    alert(name)
  }
  displayName()
}

init()
```

init()은 지역 변수 name과 함수 displayName을 갖고있다. displayName은 init안에 있기 때문에 init 안에서만 사용할 수 있다. displayName는 변수가 없고, Parameter도 없다. 하지만 내부에서 alert (alert은 Global Object, Window에 정의되어 있다.)을 호출 할 때 상위 함수의 name을 가져와서 출력한다.

함수가 중첩 됐을 때 아래의 가이드 라인을 따른다.

- 동일한 변수 명이 내부 함수와 외부 함수에 있다면 내부 함수에 있는 변수가 사용된다.
- 변수 명이 내부 함수에 없다면 실행 컨텍스트로 생성된 scope chain을 거슬러 올라가 부모 함수에서 가지고 있는 변수를 찾아, 호출한다.

단어 **Lexical은 유효 범위를 지정할 때 변수가 사용가능한 범위를 결정하기 위해 소스 코드 내에서 변수가 선언된 위치를 사용한다는 뜻**이다.

즉 위 가이드 라인의 두 번째 이야기와 일맥상통 하는데, 변수가 현재 함수에 정의가 안되어 있으면, 소스코드에서 찾아서 (scope chain을 통해 거슬러 올라가) 찾는다는 이야기다.

## 클로저 (Closure)

```javascript {numberLines}
function A(x) {
  var y = 0
  return function B(z) {
    y = 100
    return x + y + z
  }
}

var a = A(10)
var b = A(100)

console.log(a(7)) // 117
console.log(b(3)) // 203
```

클로저는 환경을 저장한다. 즉 환경을 만든 함수를 만들어낸다. 위의 예제를 보면 쉽게 이해할 수 있다.

a 는 A(10)을 실행한다. 실행해서 받는 결과값은 function B인데, 이 function B는 함수이므로 실행이 안되어 있는 상태이다. 즉, 함수로 함수를 반환 받는 **고차함수**이다.

b도 a가 받은 형태와 비슷하다. 이때 a, b가 받는 결과값은 다음과 같다.

```javascript {numberLines}
a = function A(x = 10) {
  var y = 0
  return function B(z) {
    y = 100
    return x(10) + y(100) + z
  }
}

b = function A(x = 100) {
  var y = 0
  return function B(z) {
    y = 100
    return x(100) + y(100) + z
  }
}
```

a, b 에는 각각 x자리에 10, 100이 들어간 상황에 대해서 저장한다.
그래서 a, b를 함수로 호출하면,

```javascript {numberLines}
a(7) = function A(x = 10) {
  var y = 0
  return function B (z = 7) {
    y = 100
    return x(10) + y(100) + z(7)
  }
} // 117

b(3) = function A(x = 100) {
  var y = 0
  return function B (z = 3) {
    y = 100
    return x(100) + y(100) + z(3)
  }
} // 203
```

이라는 결과가 나오게 된다.

## 조금 더 활용

배열을 10번 돌려, 1초 후에 1,2,3,4,5,6,7,8,9,10 이 나오는 코드를 작성해보자.

```javascript {numberLines}
function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    setTimeout(function () {
      console.log(i + 1)
    }, 1000)
  }
}

printAfter1sec()
```

`printAfter1Sec`을 실행시키면 정상적인 결과가 나오지 않는다. 10번 모두 숫자 10이 출력된다.

그렇다면 여기서 클로저를 활용하여 함수가 실행되는 환경을 저장시켜 실행 해보자.

> setTimeout 함수의 첫번째 인자에 함수명을 작성하지 않고 정의했다. 이런 함수를 익명함수(Anonymous Function)라고 한다.

```javascript {numberLines}
function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    const closure = function () {
      const temp = i
      setTimeout(function () {
        console.log(temp + 1)
      }, 1000)
    }
    closure()
  }
}

printAfter1Sec()
```

내부 함수 closure를 호출할 때마다 i의 환경을 기억하도록 작성했다. 이는 다음과 같이 표현할 수 있다.

```javascript {numberLines}
function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    ;(function () {
      const temp = i
      setTimeout(function () {
        console.log(temp + 1)
      }, 1000)
    })()
  }
}

printAfter1Sec()

function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    ;(function (value) {
      setTimeout(function () {
        console.log(value + 1)
      }, 1000)
    })(i)
  }
}

printAfter1Sec()
```

익명함수를 불러서 바로 호출하는 (IIFE) 즉시호출 함수로 만들어서 부를 수 있다.

## ES6 (es2015)

ES6에서는 블록 스코프를 사용하여 해결할 수 있다.

```javascript {numberLines}
function printAfter1Sec() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      console.log(i + 1)
    }, 1000)
  }
}

printAfter1Sec()
```

ES6에서 새로 추가된 const, let은 기존의 Lexical Scope이 아닌, Block Scope 단위로 동작한다.

그러므로, i는 블록 단위로 변수가 만들어지기 때문에 값이 남지 않고 블록 단위로 값이 다르게 출력될 수 있다.

[클로저](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Closures)

## 잘못된 이해

Closure를 사용하는 이유는 es6 이전 block scope가 아닌, function scope로 JavaScript가 Scope을 잡으면서 생기는 문제를 해결하기 위해서 사용한다.

흔히 Closure를 이야기할 때 예시로 드는 setTimeOut으로 이야기를 들어보자. 간단하게 1초 후 로그를 찍는 함수를 만들어보자.

## 문제

```javascript {numberLines}
function printAfter1Sec() {
  setTimeout(function () {
    console.log('hi')
  }, 1000)
}
```

이 함수를 실행하면 1초 후에 hi가 출력되는 걸 볼 수 있다.

그렇다면 이 함수를 변형해서 1초 후 1부터 10까지 출력하는 함수를 만들어보자.

```javascript {numberLines}
function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    setTimeout(function () {
      console.log(i + 1)
    }, 1000)
  }
}
```

실행해보면 잘 나오는가? 아니, 10만 10번 출력된다.

## 왜 이럴까?

JavaScript는 C,C++등의 언어와 달리, Block Scope이 아니라 Function Scope인데, 이 Function Scope은 **Execute Context(실행 컨텍스트)**를 알면 쉽게 이해할 수 있다.

Function Scope를 지니므로, for loop에서 도는 i는 printAfter1Sec 내부의 실행컨텍스트에 등록되어, i++ 될 때마다 상태가 변경되고 setTimeout에서는 printAfter1Sec의 실행 컨텍스트에서 i를 불러와 1초후에 i의 값을 출력하므로 이미 i가 10일때를 기준으로 출력하게 된다.

## 해결하기

쉽게 생각하자. function 단위로 실행 컨텍스트가 만들어지므로, setTimeout을 실행하는 함수를 만들면 된다.

```javascript {numberLines}
function printAfter1Sec() {
  for (var i = 0; i < 10; i++) {
    ;(function () {
      var keep = i
      setTimeout(function () {
        console.log(keep + 1)
      }, 1000)
    })()
  }
}
```

for 내부에 익명 함수를 만들어 즉시 실행 함수 표현(Immediately invoked Function expression)을 만들었다. 이렇게 되면 for루프를 돌음과 동시에 익명함수를 만들어, 익명함수의 실행 컨텍스트에 keep을 등록하고 keep의 값에는 i를 대입하게 된다. 그 후, setTimeout에서 가져오는 keep값은 익명함수의 실행 컨텍스트의 keep을 가져와서 출력하므로 1부터 10까지 숫자가 나오게 된다.

여기서 익명 함수가 바로 클로저 (Closure) 이다.
