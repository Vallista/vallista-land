---
title: SSR (Server Side Rendering)
tags:
  - 프론트엔드
date: 2019-05-05 19:07:15
draft: true
info: false
---

SSR(Server Side Rendering)은 서버에서 렌더링이 끝난 html 파일을 사용자에게 serve 하는 방식이다. 그러므로 페이지 이동마다 서버에 페이지를 요청하게 된다. 그래서 사용성은 떨어지지만 각 페이지마다 html을 들고 있기 때문에 SEO(Search Engine Optimization)가 가능하다.

페이지마다 렌더링 된 html 파일을 받는 작업은 과거에 전통적으로 사용되던 웹 개발 기법이다. 대표적으로 jsp를 들 수 있다.

장점은 SPA에 비해서 JavaScript 연산을 통해 HTML을 생성하므로 초기 스타트 비용이 큰 반면, SSR 처리를 하게 되면 완성된 HTML을 받으므로 초기 스타트 비용이 매우 적다.

단점은 사용자 경험이 매우 좋지 않게 되는데, 페이지 전환마다 깜빡임이 일어날 수 있고, 어플리케이션을 쓰는 느낌을 주기 힘들다.
