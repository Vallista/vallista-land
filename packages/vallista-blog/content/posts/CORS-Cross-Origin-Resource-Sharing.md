---
title: CORS (Cross Origin Resource Sharing)
tags:
  - 프론트엔드
date: 2019-05-12 11:04:45
draft: true
info: false
---

CORS는 Cross-Origin Resource Sharing의 약자이다.

기본적으로 HTTP 요청은 Cross-Site HTTP Request가 가능하다. 즉, `<script>`, `<link>` 태그를 통해 다양한 사이트의 리소스를 불러오는 작업이 가능하다.

하지만 `<script></script>` 스크립트 태그 내부에서 생성된 HTTP Requests는[Same Origin Policy](https://www.notion.so/224ba591-c215-4d50-9f12-e29ad310ebbc) 를 적용 받기에 Cross-site HTTP Request가 불가능하다.

이는 Node.js 기반의 JavaScript 개발 환경에서 문제가 되는데, Ajax가 널리 쓰여지게 되며 `<script></script>` 내부에서 생성되는 `XMLHTTPRequests` 도 Cross-site HTTP Request가 가능해야 한다는 요구가 늘어나게 되었다.

- `Access-Control-` 계열의 Response Header만 정해주면 서버에서 설정과 Get, Post, HEAD, Put, Delete 등으로 오는 요청의 처리를 알아서 해준다.

- Simple/Preflight
- Credentials/Non-Credentials

## JSONP

해결 방법으로 JSONP 포맷을 이용해서 사용하는 방법도 존재한다.
JSONP는 `<script>`의 다른 스크립트 파일 임베드 기능을 이용해서 사용하는 방법이다.

![](http://dev.epiloum.net/wp-content/uploads/2015/03/comparison_between_ajax_and_jsonp.png)

[자바스크립트 예제로 살펴보는 JSONP의 기본원리](http://dev.epiloum.net/1311)
