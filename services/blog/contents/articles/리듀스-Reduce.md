---
title: 리듀스 (Reduce)
tags:
  - 프론트엔드
date: 2019-05-12 11:01:13
draft: true
info: false
---

Reduce는 줄이다, 감속하다 라는 뜻으로써, JavaScript에서 배열 작업 할 때 원하는 부분을 줄여서 사용할 수 있다.

JavaScript의 Reduce는 Array의 고차함수로써, map 같은 함수들을 커스터마이징 해서 사용할 수 있다.

## 받는 인자 정보

```javascript {numberLines}
Array.prototype.reduce(callback: (accumulator, value, index, array), optional: initValue)
```

reduce 함수는 인자 callback 함수와 optional로 초기화 값을 받는다.

reduce의 callback은 4개의 인자를 순서대로 받는다.

- accumulator : 저장되는 값 (initValue를 기준으로 시작된다. initValue가 없다면, 첫번째 값을 넣습니다.
- now : 현재 값을 말한다.
- index : 인덱스 번호 (순서)
- array : 원본 전체 배열

## 사용 예시

간단한 사용 예를 들어보자

flatten 함수는 인자에 배열이 있다면 배열을 풀어서 대입 해주는 역할을 한다.

```javascript {numberLines}
const array = [1, 2, [3, 4], 5, 6, [7, 8], 9]

function flatten() {
  const result = array.reduce((acc, now) => {
    before = Array.isArray(before) ? before.concat(now) : (before = [before, now])

    return before
  })

  return result
}

const result = flatten()
console.log(result)
```

## 좀 더 깊게

- flatten 재귀 호출

```javascript {numberLines}
const array = [1, 2, [3, 4, [5, 6, [7, 8]]], 9, 10, [11, 12, [13, [14, 15], 16]]]

function flatten(array) {
  const result = array.reduce((accel, value) => {
    if (!Array.isArray(value)) accel.push(value)
    else {
      accel = accel.concat(flatten(value))
    }
    return accel
  }, [])

  return result
}

const result = flatten(array)
console.log(result)
```

- Map

```javascript {numberLines}
function map(arr, func) {
  return arr.reduce((stack, value) => {
    stack.push(func(value))
    return stack
  }, [])
}
```

- Filter

```javascript {numberLines}
function filter(arr, func) {
  return arr.reduce((stack, value) => {
    if (func(value)) stack.push(value)
    return stack
  }, [])
}
```
