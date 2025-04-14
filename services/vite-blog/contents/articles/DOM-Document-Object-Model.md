---
title: DOM (Document Object Model)
tags:
  - 프론트엔드
date: 2019-05-07 19:11:27
draft: true
info: false
---

DOM (Document Object Model)은 JavaScript로 HTML문서의 구조에 접근해서 변경하거나 추가하는 작업을 가능하게 하는 HTML 문서를 파싱하여 만든 Tree 형태의 Model을 말한다.

## DOM 생성 원리

HTML을 JavaScript에서 컨트롤 및 그려줄 수 있게 Render Tree를 구축하려면, **DOM**을 만들어야한다.

DOM은 객체를 Node로 만들어서 Tree 형태로 만들어야 한다. 여기서 쓰이는 파서는 문맥 자유 문법(HTML이므로)이 아니기 때문에 브라우저 별 구현이 되어있다. 하지만 브라우저 별 전혀 다른 방법으로 구현이 되어 있지는 않다. 어느정도 W3C에서 제정한 가이드라인을 따른다.

DOM은 아래와 같은 과정을 거친다.

![](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/images/full-process.png?hl=ko)

1. **변환:** 렌더링 엔진에서 OS의 네트워크 레이어나 디스크를 통해 데이터를 읽어와서 지정한 인코딩으로 (UTF-8) 개별 문자로 변환한다.
2. **토큰화:** 개별 문자로 변환된 문자열을 [W3C 표준](https://www.w3.org/TR/html5/)에 지정된 고유한 토큰으로 변환한다. 각 토큰은 특별한 의미와 고유한 규칙을 가진다. (ex: 'html', 'head' 등)
3. **렉싱**: 변환된 토큰을 속성 및 규칙을 정의하는 '객체'로 변환한다. (Node로 만듬)
4. **DOM에 링크**

HTML 마크업이 여러 태그간의 관계를 나타내므로 변환된 노드는 각 트리 데이터 구조로 연결된다.

이 트리 데이터 구조에는 상위, 하위 관계도 포함된다.

![](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/images/dom-tree.png?hl=ko)

위의 사진은 최종으로 나오는 결과인 DOM(Document Object Model)이다. 브라우저는 이후 모든 처리에 DOM을 사용한다.

이 DOM이 생성 되어있지 않으면 JavaScript는 이벤트 등록 등의 작업을 하지 못한다. 이 작업은 JavaScript에서 HTML 문서를 읽기 위한 과정이다. (getElementById 등의 함수로 element를 호출해서 inner html, text등을 변경한다던가 추가한다던가 하는 작업)

브라우저는 HTML 마크업을 처리할 때 마다 위의 단계를 수행한다.

**바이트 변환 → 토큰 식별 → 노드 변환 → DOM 트리 빌드**

그러므로 이 전체 프로세스를 런타임에서 진행하는데에는 많은 코스트가 든다. 그러므로 root node를 건드는 일을 최대한 자제하도록 하자.

### Deep Into DOM Process

DOM 프로세스를 조금 더 깊게 보도록 하자.

    <html>
       <body>
          Hello world
       </body>
    </html>

DOM 상태

- 자료 상태 : 자료를 처리하는 상태
- 태그 열림 상태 : '<'를 만나서 태그가 열려있는 상태
- 태그 이름 상태: 'a-Z'를 만나서 '<'나 '>'를 만날 때 까지 유지되는 상태. 만나게 되면 자료 상태로 변경된다.

DOM 토큰 종류

- 시작 태그 토큰 : '태그가 시작되었다'를 알리는 토큰
- 종료 태그 토큰 : '태그가 종료되었다'를 알리는 토큰

1. 초기 상태는 '**자료 상태**'이다.

- '<'를 만나면 '**태그 열림 상태**'로 변한다.
- 'a-Z'를 만나면 '**시작 태그 토큰**'을 생성하며 '**태그 이름 상태**'로 변경된다. 이 상태는 '>'를 만날 때 까지 유지된다.
- 각 문자에는 토큰 이름이 붙는다. (ex: html)
- '>' 문자에 도달하면 토큰이 발행된다. 상태는 다시 '자료 상태'

2. <를 읽고, 그 다음 html을 읽었다. '<'를 만났으니 '자료 상태'에서 '태그 열림 상태'가 되고, 'a-Z'를 만났으니 '태그 이름 상태'가 됐다. '>'를 만나서 다시 자료상태가 되었다. 이 때 태그 이름 상태에서 이름을 얻었다. 'html', 토큰으로 방출한다. '<html>'
3. 이 과정을 반복해서 html과 body가 토큰화 되었다. 그 다음 Hello World의 H를 만낫다. 'a-Z'를 만났으니 '태그 이름 상태' 가 되어 '<'를 만날때 까지 유지된다. '</body>'를 만나, 'Hello World'는 이름으로 발행되어 토큰화가 되었다.
4. </body>를 읽는데 '/'를 만낫다. '**종료 태그 토큰**'을 생성하고 태그 이름 상태로 변경된다.

![](https://d2.naver.com/content/images/2015/06/helloworld-59361-10.png)

![](https://d2.naver.com/content/images/2015/06/helloworld-59361-11.png)
