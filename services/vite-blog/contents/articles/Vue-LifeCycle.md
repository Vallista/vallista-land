---
title: Vue LifeCycle
tags:
  - 프론트엔드
date: 2018-01-15 18:40:06
draft: true
info: false
---

## 참고 자료

[Jeong Woo Ahn 그림그리는 프로그래머 insta@younmydrawing님의 자료](https://medium.com/witinweb/vue-js-%EB%9D%BC%EC%9D%B4%ED%94%84%EC%82%AC%EC%9D%B4%ED%81%B4-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0-7780cdd97dd4)

[Understanding Vue.js Lifecycle Hooks - Joshua Bemenderfer](https://alligator.io/vuejs/component-lifecycle/)

렌더링 전, 후 이벤트를 나눠야할 때, 어떠한 행위가 변경될 때 업데이트 해주어야 할 때 등
경우에 따라 변수를 만들어서 넣어주고 사용하고 해야하는 경우가 있다.

vue.js 에서 생성부터 파괴 될 때 까지의 한 사이클을 돌아가는 사이에
해당 컴포넌트에서 그 사이클에 돌아가는 시점에 호출 가능한 함수 호출하여 거기에 구동되도록 구현부를 만들 수 있다.

---

![vue 라이프 사이클](https://kr.vuejs.org/images/lifecycle.png)

위의 이미지는 vue에서의 생명주기 표이다. 양쪽에 있는 빨간색 폰트들이 component에서 사용할 수 있는 함수들이고 가운데 flow 막대를 따라서 아래로 내려가는 것이 뷰 라이프 사이클 전체 흐름이다.

---

### 컴포넌트 초기화

아래의 섹션은 컴포넌트를 초기화 하는 섹션이다. 컴포넌트들이 돔에 추가되어 있지 않으며, 서버사이드 렌더링에서 지원되는 섹션이다.

클라이언트, 서버 렌더링 단에서 처리해야할 일이 있다면 이 곳에서 처리하면 된다.

- new Vue()

Vue Instance를 생성하는 단계이다.

- Init (Events & Lifecycle)

Event와 Lifecycle을 초기화 하는 단계.

- **beforeCreate**

가장 처음으로 가져다 쓸 수 있는 함수이다.

```javascript {numberLines}
<script>
  export default {
    beforeCreate() {

    }
    // not es6
    beforeCreate: function() {

    }
  }
</script>
```

- Init (injections & reactivity)

주입하고 반응하는 단계.

- **created**

데이터, 이벤트 등이 주입되어 반응이 되었다.
template과 virtual DOM은 아직 mount 및 rendering 되지 않은 상황이라서 사용했다간 에러를 뱉는다.

```javascript {numberLines}
  export default {
    created() {

    }
    // not es6
    created: function() {

    }
  }
```

---

### 렌더링

- Has "el" option?, Has 'template' option?

new Vue를 작성시 instance 안에 el option으로 아이디나 클래스를 통해서 element를 가져왔으면 template이 있는가로 넘어간다.
만약 없을 경우 vm.$mount(el)을 통해서 mount 시킨다.

그 다음 템플릿 옵션이 있으면, 렌더 함수안에 템플릿을 컴파일 한다.
혹은 없을 경우 el의 outerHTML에 컴파일한다.

---

### DOM 삽입

처음 시작 후, 렌더링 직전에 코드를 넣을 수 있다.
**컴포넌트 초기에 세팅되어야 할 데이터는 Created에서 처리하는게 좋다.**

서버사이드 렌더링시 호출되지 않는다.

- beforeMount

렌더링 전 최초 1회 실행하는 함수.

```javascript {numberLines}
export default {
  beforeMount() {

  }

  // not es6
  beforeMount: function() {

  }
}
```

- Create vm.$el and replace "el" with it

vm.$el을 아까 컴파일 한 대상으로 만들고, el을 교체한다.

- mounted

렌더링 후 실행하는 함수, 컴포넌트, 템플릿, 렌더링 된 돔에 접근 할 수 있다. 근데 확실히 모든 컴포넌트의 마운트된 상태를 보장하진 않는다. vm.$nextTick을 사용하여 전체가 렌더링된 상태를 보장할 수 있다.

```javascript {numberLines}
export default {
  mounted() {
    this.$nextTick(function () {
      // 전체가 렌더링 된 상태 보장.
    })
  }
}
```

### Diff 및 재 렌더링 단계

컴포넌트에서 사용되는 반응형 속성들이 변경되거나 어떤 이유로 재 렌더링이 발생되면 생김.

서버렌더링 시에는 호출되지 않음.

- beforeUpdate
  컴포넌트의 데이터가 변하여 업데이트 사이클이 시작될 때 실행됨.
  돔이 재 렌더링되고 패치 직전 실행. 바로 전의 데이터들을 얻을 수 있어서 많은 변경이 가능해짐. 다만 여기서의 변경은 적용되지 않음.

```javascript {numberLines}
export default {
  beforeUpdate() {
    this.$nextTick(function () {
      // 전체가 렌더링 된 상태 보장.
    })
  }
}
```

- updated
  재 렌더링이 일어난 후에 실행되는 훅.
  DOM이 업데이트 되었으므로 돔 종속적인 연산이 가능.
  mount와 마찬가지로 vm.$nextTick을 사용해서 렌더링 확정을 걸 수 있다.

```javascript {numberLines}
export default {
  updated() {
    this.$nextTick(function () {
      // 전체가 렌더링 된 상태 보장.
    })
  }
}
```

### 해체 단계

서버 렌더링시 호출되지 않는다.

- beforeDestroy

이 훅은 뷰 인스턴스 제거 직전에 호출됨.
reactive subscription을 제거하고자 한다면 이 훅에 담으면 좋음.

- destroyed

이 훅은 해체 된 후에 호출된다. Vue 인스턴스의 모든 디렉티브가 바인딩 해제되고 모든 이벤트 리스너가 제거 및 모든 하위 vue 인스턴스도 삭제된다.
