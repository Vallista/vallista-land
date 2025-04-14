---
title: CSSOM (CSS Object Model)
tags:
  - 프론트엔드
date: 2019-05-07 19:12:24
draft: true
info: false
---

CSS는 앞서 말한 '**문맥 자유 문법**' 이므로 [BNF (Backus-Naur Form)](https://www.notion.so/97878963-961a-4ae6-b6d4-40849fb33020)로 표현할 수 있다.

웹킷은 CSS 문법 파일로부터 자동으로 파서를 생성하기 위해서 'flex', 'bison'을 사용한다. (파이어폭스는 직접 작성한 하향식 파서를 사용한다.) 두 경우 모두 각 CSS파일은 스타일시트에 객체로 파싱되며, 각 객체는 CSS 규칙을 포함한다. CSS 규칙 객체는 선택자와 선언 그리고 CSS 문법과 일치하는 다른 객체를 포함한다.

---

브라우저가 [DOM (Document Object Model)](https://www.notion.so/05b2fa44-e433-4bb2-9fc3-cd59110f6ddb) 을 생성하는 동안 CSS 스타일시트는 독립적으로 CSS를 처리해서 CSSOM을 만든다. CSSOM은 DOM과 마찬가지로 브라우저가 이해하고 처리할 수 있는 형식으로 변환된다.

예시:

    body { font-size: 16px }
    p { font-weight: bold }
    span { color: red }
    p span { display: none }
    img { float: right }

위의 css를 처리하기 위해 아래의 과정을 진행한다. CSSOM을 만드는 작업은[DOM (Document Object Model)](https://www.notion.so/05b2fa44-e433-4bb2-9fc3-cd59110f6ddb) 과 Attachment를 쉽게 하기 위해서 비슷한 과정을 진행하게 된다.

![](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/images/cssom-construction.png?hl=ko)

1. **변환:** 렌더링 엔진에서 OS의 네트워크 레이어나 디스크를 통해 데이터를 읽어와서 지정한 인코딩으로 (UTF-8) 개별 문자로 변환한다.
2. **토큰화:** 개별 문자로 변환된 문자열을 [W3C 표준](https://www.w3.org/TR/html5/)에 지정된 고유한 토큰으로 변환한다. 각 토큰은 특별한 의미와 고유한 규칙을 가진다. (ex: 'html', 'head' 등)
3. **렉싱**: 변환된 토큰을 속성 및 규칙을 정의하는 '객체'로 변환한다. (Node로 만듬)
4. **CSSOM 에 링크**

CSSOM이 트리 구조를 가지는 이유는 페이지에 있는 최종 스타일을 계산할 때 브라우저는 해당 노드에 적용 가능한 가장 일반적인 규칙 (body의 하위의 경우 모든 body 스타일 적용)으로 시작한 후 더욱 구체적인 규칙을 적용하는 방식으로, '하향식'으로 규칙을 적용하는 방식으로 계산된 스타일을 재귀적으로 세분화한다.

CSS 적용은 **일반적인 CSS 규칙 → 구체적인 CSS 규칙** 순으로 적용된다.

### CSS 규칙

---

아래와 같은 스타일이 있다고 하자.

    body { font-size: 16px }
    p { font-weight: bold }
    span { color: red }
    p span { display: none }
    img { float: right }

CSS를 적용할 때 상위 태그의 모든 하위 태그에는 상위 태그의 스타일이 적용된다. (하향식 적용)

![](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/images/cssom-tree.png?hl=ko)

즉, body 영역에 공통으로 사용될 수 있는 property를 적용하면 하위 Element에 모두 적용된다.

- body 태그와 body 태그의 하위 태그에는 font-size: 15px이 하향식으로 적용된다.
- p 태그와 p 태그의 하위 태그에는 font-weight: bold가 하향식으로 적용된다.
- span 태그와 span태그의 하위 태그에는 color: red가 붙는다. 하지만 p 안의 span 태그에는 color: red가 적용되지 않는다.
- p 태그 안에 있는 span 태그는 display: none 속성을 갖는다. 하지만 body 하위의 span 태그는 적용되지 않는다.

> 모든 브라우저는 '사용자 에이전트 스타일' 이라고 하는 기본 스타일 집합, 즉 개발자가 고유한 스타일을 제공하지 않을 경우 표시되는 스타일을 제공한다.

개발자가 작성하는 스타일은 이러한 기본 스타일 (예: [기본 IE 스타일](https://www.iecss.com/))을 간단하게 재정의 한다.
