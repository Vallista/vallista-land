---
title: HTTP 프로토콜에서 HTTPS URI 가져오기
tags:
  - 프론트엔드
date: 2019-05-13 11:05:53
draft: true
info: false
---

HTTP 프로토콜에서 HTTPS URI를 호출하면 에러가 난다. 왜냐하면 해당 프로토콜에서 다른 프로토콜의 URI를 불러올 때 자신과 같은 프로토콜을 가정하고 가져오기 때문이다.

HTTP의 포트는 80, HTTPS의 포트가 443 이므로 전혀 다른 URI로 접속해서 데이터를 받아오게 된다.

이 문제를 해결하기 위해서는 어떻게 해야할까?

## 해결 방법

1. HTTP와 HTTPS 두 프로토콜을 하나의 프로토콜 이전한다.
2. URI를 가져올 때 Full Path를 포트 포함해서 입력해 갖고온다.
   ex) [vallista.kr:80/image](http://vallista.kr:80/image), [vallista.kr:443/image](http://vallista.kr:443/imager)
3. HTTPS와 HTTP가 혼합해서 쓰이는 URL의 경우, 아래와 같이 경로를 지정하면 된다.
   앞에 `//도메인` 을 붙이면 현재 웹 페이지의 스키마를 적용해서 전달하게 된다. `<img src="//some.domain.com/img/background4.jpg"/>`
