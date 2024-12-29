---
title: Redux
tags:
  - React
date: 2019-05-15 11:16:29
draft: true
info: false
---

Redux는 React에만 속한 프레임워크가 아닌, 광범위로 사용할 수 있는 프레임워크이다.

일반적으로 React에 많이 사용되므로, React를 이해하면 Redux도 쉽게 알 수 있을거라 생각했지만 그게 아니었다. 개념을 이해하는데 시간이 다소 걸렸고 이를 작성하면서 한번 더 이해하려 한다.

## 기본 개념

Redux를 이해하기 위해서는 [Flux Architecture](https://haruair.github.io/flux/docs/overview.html)를 이해해야 한다. Flux는 MVC와 같은 모델링 구조로 보면 편하다.

Flux는 핵심적인 세 가지 부분으로 구성되어 있다. Dispatcher, Stores, Views(Front-end Framworks) 세 가지 부분으로 구성을 하면서 MVC와 비슷하게 볼 수 있으나, MVC와 가장 큰 다른점은 Flux는 단방향으로 데이터가 흐른다. view는 중앙의 dispatch를 통해 action을 전파한다. 어플리케이션의 데이터와 비즈니스 로직을 가지고 있는 store는 action이 전파되면 이 action에 영향이 있는 모든 view를 갱신한다.

이는 React가 선호하는 개발과 비슷하다. 아래 자료 참고.

- Container, Presentational

[Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

### 구조와 데이터 흐름

![](https://haruair.github.io/flux/img/flux-simple-f8-diagram-1300w.png)

Flux에서 데이터 흐름은 위의 그림과 같이 이어진다. Action을 실행하면 DIspatcher가 동작하고, Store가 데이터를 변경하여, View에서 데이터를 주입받는다. 각각의 레이어는 독립적으로 움직이며, action은 새로운 데이터를 포함하고 있는 간단한 객체로 type 프로퍼티로 구분할 수 있다.

![](https://haruair.github.io/flux/img/flux-simple-f8-diagram-with-client-action-1300w.png)

View는 사용자의 상호작용에 응답하기 위해서 새로운 Action을 생성하여 시스템에 전파한다.

모든 데이터는 중앙 시스템인 Dispatcher를 통해 흐르며, action은 dispatcher에게 action creator 메소드를 제공한다. 대부분의 action은 view에서 사용자 상호작용에서 발동한다.

1. dispatcher는 store를 등록하기 위한 콜백을 실한한 이후, action을 모든 store로 전달한다.
2. 등록된 콜백을 활용해 store는 관리하고 있는 상태 중 어떤 액션이라도 관련이 있다면 전달한다.
3. store는 change 이벤트를 controller-views에게 알려주고, 그 결과로 데이터 계층에서 변화가 일어난다.
4. Controller-views는 이 이벤트를 듣고 있다가 이벤트 헨들러가 있는 store에서 데이터를 다시 가져온다.
5. Controller-views는 스스로의 setState() 메소드를 호출하고 컴포넌트 트리에 속해있는 자식 모두를 다시 렌더링한다.

## Redux

Redux는 Flux 개념을 프레임워크화 시킨 모듈이다.

## Redux-saga

[Redux-Saga: 제너레이터와 이펙트 : TOAST Meetup](https://meetup.toast.com/posts/140)

[redux-thunk에서 redux-saga로](https://orezytivarg.github.io/from-redux-thunk-to-sagas/)

take는 call, put과 비슷하게 특정 액션을 기다리기 위해서 미들웨어에 알려주는 명령 오브젝트를 생성한다.

- Helper Functions

[헬퍼 함수 · GitBook](https://mskims.github.io/redux-saga-in-korean/basics/UsingSagaHelpers.html)
