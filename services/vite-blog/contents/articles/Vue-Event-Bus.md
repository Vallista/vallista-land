---
title: Vue Event Bus
tags:
  - 프론트엔드
date: 2018-01-14 18:38:29
draft: true
info: false
---

vue에서 component간 통신을 하기 위해서는 상위의 컴포넌트에서 하위로 이벤트를 내려보내고, 하위에서 props로 받아서 전달할 수 밖에 없다.

이러한 특성은 vue는 one-direction data flow (단방향 데이터 플로우)의 형태를 가지기 때문인데, 이러한 형태를 통해서 캡슐화 등, 객체지향의 개념을 접목시킬 수 있다는 장점이 있다.

하지만 이러한 특성은 상위 컴포넌트로 데이터를 못보낸다는 단점이 존재하는데 이렇게 될 경우 노드 반대쪽에 있는 데이터와는 이벤트 전달을 못하게 된다.

전달을 못하게 되므로 EventBus라는 꼼수? 테크닉을 사용하기로 하였다.

## Event Bus 란?

Event Bus는 기본적으로 제작한 vue 컴포넌트에서 새로운 vue instance를 하나 제작하여, 해당 instance를 싱글톤 개념처럼 사용하는 방식이다.

vue instance를 새로 만들어서 $on으로 이벤트를 만들어주고, $emit으로 호출하면 끝이다. 아래의 예제를 보도록 하자.

```javascript {numberLines}
Vue.component('button-component', {
  name: 'button-component',
  template: '<button @click="this.clickEvent">Alert Print!</button>',
  methods: {
    clickEvent: function () {
      EventBus.$emit('addAlert', { description: Math.random().toString() })
    }
  }
})

Vue.component('alert-box', {
  name: 'alert-box',
  props: {
    index: '',
    description: ''
  },
  mounted: function () {
    setTimeout(function () {
      EventBus.$emit('deleteAlert')
    }, 2000)
  },
  template:
    '<div :class="`alert-box-${this.index}`" class="alert-box alert-box-start flex-container flex-center-sort flex-column">' +
    '<div class="title flex-container flex-center-sort flex-column"><div class="title-image-background"></div><img class="title-image" src="image.png"/></div>' +
    '<div class="description flex-container flex-center-sort flex-column">{{this.description}}</div>' +
    '</div>'
})

Vue.component('alert-box-list', {
  name: 'alert-box-list',
  data: function () {
    return {
      alertList: []
    }
  },
  methods: {
    addAlert: function ({ description }) {
      this.alertList.push({ description })
    },
    deleteAlert: function () {
      this.alertList.shift()
    }
  },
  created: function () {
    this.alertList = []
    EventBus.$on('addAlert', this.addAlert)
    EventBus.$on('deleteAlert', this.deleteAlert)
  },
  template:
    '<ul><li v-for="(value, index) in alertList">' +
    '<alert-box :description="value.description" :index="index" :key="index">' +
    '</alert-box>' +
    '</li></ul>'
})

var EventBus = new Vue()

new Vue({
  el: '#app'
})
```

해당 소스는 alert-box-list 컴포넌트와 button-component가 통신하는 과정을 보여준다.

제일 아래에 있는 new Vue와 EventBus를 보면 각각 다른 vue instance를 생성해주었다.

EventBus의 vue instance는 아무것도 가지고 있지 않으며 new Vue 인스턴스는 element로 app 이라는 이름의 id를 가지고 있다.

그 다음은 해당 소스코드의 alert-box-list의 methods 부분을 보도록 하자.

methods 부분에는 addAlert과 deleteAlert이 있다. addAlert은 alertList에 push로 데이터를 넣어주며 deleteAlert은 alertList의 첫번째 인자를 shift를 이용하여 삭제해준다.

다음은 중요한 created function 부분이다. 해당 component가 life cycle hook 에 있는 created 를 지나게 되면 this.alertList에서 초기화를 하고, EventBus를 호출하여 $on 함수로 등록을 하게 된다. 이름과 함수를 받아서 등록을 하게 되는 소스코드이다.

다음은 해당 소스코드를 사용하는 button-component의 methods를 보도록 하자.

해당 clickEvent는 상단의 template에서 button element가 클릭 이벤트를 바인딩 하고 있다. 클릭되면 EventBus.$emit을 통해서 'addAlert' 이벤트를 호출한다. parameter로는 object를 전달한다.

다음은 alert-box component의 mounted 인데, 이 함수 또한 application life cycle hook 중 하나이며, 생성되고 나서 시간이 2초 지나면 EventBus.$emit을 호출하도록 하였다.

## 핵심 함수

#### $on

target.$on은 target의 상위 객체에 넘긴 함수를 string과 함께 전달한다.

#### $emit

target.$emit은 $on으로 등록한 이벤트를 실행시키는 역할을 맡는다.

## 추가

사실 vue는 양방향 데이터 바인딩을 지원한다. 이는 $emit을 이용해서 자신의 parent에 보내고 전달을 하면 되기 때문인데, 나는 이러한 구조가 컨트롤과 명시성이 애매해진다고 생각한다.

그래서 emit 자체를 싱글톤 처럼 하나의 new instance로 만들어줫다.
