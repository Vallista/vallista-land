---
title: SPA (Single Page Application)
tags:
  - 프론트엔드
date: 2019-05-05 19:06:21
draft: true
info: false
---

최근 PC 앱은[React.js](https://www.notion.so/a4b13e25-b67a-40af-87d3-c084a29c895c)[Vue.js](https://www.notion.so/a0a34ea8-52ad-44f8-b109-8ae1fb33bda1) 같은 Node.js 환경 JavaScript Framework로 개발하는 추세다.

위와 같은 기술로 만든 앱은 사용자가 마치 앱을 사용하는 부드럽고 좋은 사용자 경험을 전달하는 효과를 준다. 이런 앱을 `SPA (Single Page Application)`라고 표현한다.

## What's This?

SPA(Single Page Application)은 모던 웹 개발 패러다임으로, 전통적인 웹 개발 방식과 달리 Client Side와 Server Side에서 하는 역할에 대해 분리가 가능하며 배포가 기존 웹 개발보다 쉽다는 장점을 갖고있다.

기존의 웹 환경은 데이터를 불러올 때마다 스타일을 새로 갱신해서 가져오기 때문에 깜빡이거나(새로고침) 하는 좋지 않은 사용자 경험을 야기했다.

하지만 SPA는 최초 1회 모든 리소스를 가져오고 이후 새로운 페이지 요청이 오면, 전체 페이지를 렌더링 하지 않고 필요한 부분에 대한 데이터만 갱신되므로 새로고침이 발생하지 않아 네이티브 앱과 유사한 사용자 경험을 줄 수 있다.

또한 모바일 사용자 경험이 증대되는 현 시점에서 트래픽 감소(새로운 페이지 요청 시 매번 서버 콜 감소)와 사용성 강화는 `모바일 퍼스트(Mobile First)` 시대에 맞는 전략이다.

## 자연스러운 효과가 가능한 이유

- SPA는 최초 1회 모든 리소스를 가져오기 때문
- 데이터를 [Ajax](https://www.notion.so/5572b735-50ed-4490-a7f4-b3492c376d12) 로 비동기 통신을 해서 데이터를 받아 필요한 부분만 새로 그리므로

## 해쉬

[Ajax](https://www.notion.so/5572b735-50ed-4490-a7f4-b3492c376d12) 를 통해 값을 가져올 때 URI를 바꾸면 HTML5의 History가 적용되지 않는다. 그러므로 History.go나 History.back와 같은 뒤로가기, 앞으로 가기 기능이 먹지 않는 단점이 존재한다. 이를 `URI Fragment Identifier` 로 보완하는 방법이 해쉬이다.

Hash 방식은 `URI Fragment Identifier(#service)` 의 고유 기능인 Anchor를 사용한다. Fragment Identifier는 Hash Mark라고도 불린다.

이 방식을 사용하면 서버에 새로운 요청을 보내지 않지만, 페이지 고유의 논리적 URI가 존재하므로 History를 관리할 수 있다. 하지만 같은 URI를 또 요청하게 되면 어떠한 요청도 하지 않는다. hash는 변경되어도 서버에 새로운 요청을 보내지 않기 때문이다.

## 장점

- SPA는 좋은 사용자 경험을 준다
- 기존의 웹처럼 페이지를 새로 부를 때 마다 서버에 요청하지 않는다. (Ajax call로 필요한 부분만 통신)

## 단점

- [SEO (Search Engine Optimization)](https://www.notion.so/d40e6652-0cd7-4002-8c36-6958c023396d)를 적용하기 어렵다.
- 지속적인 사용자 경험에서는 대개 좋은 경험을 주지만, 처음 페이지를 진입할 때 모든 리소스를 1회 부르므로 앱의 규모가 커지면 불러오는 속도가 매우 느려서 첫 페이지를 사용자에게 보여주는데 시간이 오래 걸릴 수 있다. → 이런 문제를 막기위해 구글에서[PRPL 패턴 (Push Render Pre-cache Lazy-load)](https://www.notion.so/3fe0aebe-da78-49fe-b278-fdc6c0982178) 이라고 지칭하는 패턴이 있다.
