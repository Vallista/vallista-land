---
title: RESTFUL API
tags:

date: 2019-05-02 18:46:16
draft: true
info: false
---

`REST` 는 REpresentational State Transfer의 약자이다. ~ful 이라는 형용사형 어미를 붙여 REST한 API라고 보면 된다. REST는 디자인 패턴인데 REST 패턴을 잘 지킨 서비스 디자인을 'RESTful' 하다고 표현한다.

REST는 `Resource Oriented Architecture` 라는 아키텍쳐로 볼 수 있다.
즉, API 설계할 때 `자원(Resource)`를 기반으로 `HTTP Method`를 통해 자원을 처리하도록 설계하는 아키텍쳐이다.

자원이라 하면, 서버에서 전송되는 데이터 전체를 이야기 할 수 있다. `/blog/1` 같은 URI를 통해서 자원을 `get` `post` `patch` `delete` `put` 등 메소드를 통해 전달하거나 받는 패턴이다. 같은 URI라도 통신 메소드에 따라 (post, get..) 다른 행동을 줄 수 있다.

- 자원 (Resource) : URI
- 행위 (Verb) : HTTP Method
- 표현 (Representations)

> URI (Uniform Resource Identifier)

인터넷에 있는 자원을 나타내는 고유 주소
URI의 하위 개념으로 URL, URN등이 있다.

## REST의 특징

1. Uniform Interface (유니폼 인터페이스)
   URI로 지정한 리소스에 대한 조작을 통일되고 한정적인 인터페이스로 수행하는 아키텍처 스타일을 말한다.
   get, post, patch, put, delete등의 조작을 통일되고 한정적으로 제공한다.

2. Stateless (무상태성)
   REST는 무상태성 성격을 갖는다. 다시 말해 작업을 위한 상태 정보를 따로 저장하지 않는다. 세션 정보나 쿠키 정보를 따로 저장하지 않기 때문에 들어오는 요청만 단순히 처리하면 된다. 때문에 자유도가 높아지고 서버에서 불필요한 정보를 가지고 있지 않기 때문에 구현이 쉽게 가능해진다.

3. Casheable (캐시 가능)
   HTTP 웹 표준을 그대로 사용하기 때문에, 웹에서 사용하는 기존 인프라를 그대로 활용 할 수 있다. 따라서 HTTP가 가진 캐싱 기능을 적용할 수 있다. HTTP 프로토콜 표준에서 사용하는 Last-Modified 태그나 E-Tag를 이용하면 캐싱 구현이 가능하다.

4. Self-descriptiveness
   REST API 메시지만 보고도 이를 쉽게 이해 할 수 있는 자체 표현 구조로 되어 있음.

5. Client - Server 구조
   REST 서버는 API를 제공하므로 클라이언트와 서버의 역할이 확실히 구분되기 때문에 클라이언트와 서버에서 개발해야 할 내용이 명확해지고 서로간의 의존성이 줄어듦

6. 계층형 구조
   REST 서버는 다중 계층으로 구성될 수 있으며 보안, 로드 밸런싱, 암호화 계층을 추가해 구조상의 유연성을 줄 수 있다. PROXY, 게이트웨이 같은 네트워크 기반의 중간 매체를 사용할 수 있게 한다.

> Last-Modified

브라우저에서 마지막으로 수정된 시간을 알 수 있다.
이 시간을 통해서 수정된 사항이 없다면 서버에서 불러오는 요청을 캔슬하도록 구현할 수 있다.

> E-Tag

특정 버전의 리소스를 식별하는 식별자, 웹 서버 내용을 확인하고 변하지 않았으면 웹 서버로 full 요청을 보내지 않기 때문에, 캐쉬가 더 효율적이게 되고, 대역폭도 아낄 수 있다. 만약 내용이 변경되었다면, "mid-air collions" 이라는 리소스 간의 동시 다발적 수정 및 덮어쓰기 현상을 막는데 유용하게 사용된다.

## REST API 디자인

1. URI는 정보의 자원을 표현해야 한다.
2. 자원에 대한 행위는 HTTP Method (GET, POST, PUT, PATCH, DELETE)로 표현한다.

> 다른 건 몰라도 이 두 가지는 꼭 기억하자.

### **규칙**

아래의 예시를 통해 볼 수 있는 REST API 디자인 규칙을 살펴보자.

    Bad :
     GET /api/post/delete/1

    Good :
     DELETE /api/post/1

- URI는 정보를 표기해야 한다. (동사보다 명사를 써야 한다.)
- 자원에 대한 행위는 HTTP Method로 표현해야 한다.

첫 번째 예시를 보면, HTTP Method를 GET 그리고 URI를 `/post/delete/1` 로 받았다. 여기서 문제는 GET 메소드로 요청했으나 URI에 delete라는 동사가 붙었다. 이는 잘못된 요청이다. delete를 하고 싶다면 두 번째 예시 처럼 HTTP Method를 DELETE로 보내고 `/post/1` 형식으로 보내야한다. 해석 하면 1번째 포스트를 삭제하는 api 정도로 볼 수 있다.

[HTTP Method의 역할](https://www.notion.so/6df4212ce50c4d9f928d140cc2be61aa)

### URI 설계

- 슬래시 구분자( / )는 계층 관계를 나타낸다.

        Bad :
        	http://restapi.example.com/dogs/animals

        Good :
        	http://restapi.example.com/animals/dogs

  좋은 예시와 안 좋은 예시를 보면 알 수 있다.
  큰 범주 부터 작은 범주로 / 를 통해 계층을 구성한다.

- URI의 마지막 문자는 / 를 포함하지 않는다.

        Bad :
        	http://restapi.example.com/animals/dogs/

        Good :
        	http://restapi.example.com/animals/dogs

  / 는 '이후에도 depth가 있다'를 의미한다.
  그러므로 마지막에 / 는 붙여서는 안되며 모든 글자는 유일한 식별자로 사용 되어야 한다.

- URI에는 하이픈(-)은 사용하되, 언더바(\_)나 대문자는 사용하지 않는다.

        Bad :
        	http://restapi.example.com/user_permission
        	http://restapi.example.com/userPermission

        Good :
        	http://restapi.example.com/user-permission

  긴 문자열의 명사나 동사 구분을 위해 Camel 표기법이나 Snake 표기법을 사용한다.
  하지만 REST API에서는 하이픈(-)을 통해 구분한다.

  또한 URI는 대소문자 구분이 된다.
  대소문자를 혼용해서 URI를 다르게 접근하면 안되기 때문에 소문자만 사용한다.

- 파일 확장자는 사용하지 않는다.

        Bad :
        	http://restapi.example.com/user/1/profile.jpg

        Good :
        	http://restapi.example.com/user/1/profile
          HTTP/1.1 Host: restapi.example.com Accept: image/jpg

  메시지 바디 내용의 포맷을 나타내기 위한 파일 확장자를 URI에 표현하지 않는다.
  Accept Header를 사용해서 포맷을 나타내도록 하는게 좋다.

- **Collection**과 **Document**

  자원을 표현할 때 Collection과 Document로 구분한다.

        GET http://restapi.example.com/users/{ user-id }/devices/tablets (has 관계)

  위의 API는 사용자가 보유한 태블릿 장비를 의미하는 URI 이다.

  - Collection은 객체의 집합 혹은 Document의 집합으로 보면 된다.
  - Document는 문서, 객체 단일이라고 보면 된다.

  URI를 해석하면, users collection과 { user id } 라는 document에 들어 있는 devices collection 의 tablets collection 목록을 요청하는 URI이다.

  가장 중요한 점은, Collection은 **복수형** 이며, Document는 **단수형**으로 표기한다.

### HTTP 응답 상태 코드

REST API 형태로 코드를 작성했을 때 정상적인 값이 들어왔는지, 잘못 된 데이터가 들어왔는지, 클라이언트의 문제인지 서버의 문제인지 같은 문제들을 판단 해야 할 때가 있다. 이런 경우, REST API는 HTTP Method를 사용하므로 HTTP 응답 상태 코드로 대답하게 된다.

해당 코드에 대해서는 링크를 참고하면 된다.

[HTTP 상태 코드 - 위키백과, 우리 모두의 백과사전](https://ko.wikipedia.org/wiki/HTTP_%EC%83%81%ED%83%9C_%EC%BD%94%EB%93%9C)

## TIP: HTTP Method : What is Patch?

HTTP Method의 Delete를 사용할 때 여러 데이터를 한번에 삭제해야 하는 쿼리를 작성할 일이 생긴다. 하지만 Delete는 Post처럼 Body를 전달하도록 지원하지 않는다. 이런 경우에는 Patch를 사용해 볼 수 있다. Patch는 Post, Put 작업과 같이 Body를 만들어 전달할 수 있다. (삭제와 같은 작업은 민감하기 때문에 다수를 처리하는 로직을 막는게 맞는 생각인 듯 하다. 근데 UI 상에서 그런 Design은 나오는 경우가 잦다.)

## Reference

[JaeYeopHan/Interview_Question_for_Beginner](https://github.com/JaeYeopHan/Interview_Question_for_Beginner/tree/master/Development_common_sense#object-oriented-programming)

[RESTful API 설계 및 Tips](https://brunch.co.kr/@springboot/59)

[REST API 제대로 알고 사용하기 : TOAST Meetup](https://meetup.toast.com/posts/92)

[통합 자원 식별자 - 위키백과, 우리 모두의 백과사전](https://ko.wikipedia.org/wiki/%ED%86%B5%ED%95%A9_%EC%9E%90%EC%9B%90_%EC%8B%9D%EB%B3%84%EC%9E%90)

[ETag](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/ETag)

[[PHP/JpBoard] Last-Modified로 브라우저 캐싱하기 :: 종박's 연구소](http://jongpak.com/prob/post/123)
