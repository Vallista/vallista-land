---
title: 'Call By Value, Call By Reference'
tags:

date: 2019-05-10 19:14:14
draft: true
info: false
---

[자바스크립트 function - Call by Value, Call by Reference](https://emflant.tistory.com/64)

```javascript {numberLines}
const array = [1, 2, 3]

array = [] // const라 동작하지 않음

function changeArrayEmpty(changeArr) {
  changeArr = []
}

function changeArray(changeArr, index) {
  changeArr[index] = 1
}

changeArrayEmpty(array) // [1, 2, 3] NO!
changeArray(array, 2) // [1, 2, 1] OK!
```

- 기본 자료형(number, string, boolean, undefined, null)을 Function Parameter로 넘겼을 때 값(value)를 복사해서 넘겨준다. → 그러므로 해당 변수를 바꾸던 말던 원래의 값에는 변경이 없다.
- Object(유사배열), Array(배열)를 넘겼을 때 함수 안에서 속성 값을 변경할 수 있고 원 데이터에 영향을 끼친다.
- 새로운 객체를 따로 생성해서 값 자체를 새로 할당해서 변경할 수 없다.

> JavaScript는 function parameter로 던지는 값은 모두 Call By Value이다.
> 객체나 배열같은 참조형(Reference) 타입인 경우에도 실제로는 그 복사본을 만들어 value로 Parameter에 전달하게 된다. 그래서 Function으로 Parameter 안에 있는 해당 속성은 변경이 가능해도, 배열 전체를 대체할 수 없다. Parameter로 받은 객체 내부의 값들은 해당 값에 대한 Reference를 지니고 있으므로..
