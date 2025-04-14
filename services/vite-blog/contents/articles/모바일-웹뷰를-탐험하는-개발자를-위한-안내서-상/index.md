---
title: 모바일 웹뷰를 탐험하는 개발자를 위한 안내서 (상)
image: ./assets/image1.jpg
tags:
  - 프론트엔드
date: 2019-11-10 14:35:28
draft: false
info: false
series: 모바일 웹뷰를 탐험하는 개발자를 위한 안내서
seriesPriority: 1
---

![이미지1](https://i0.wp.com/gaegul.kr/wordpress/wp-content/uploads/1/cfile29.uf.2529523E532F23481C8D5B.jpg)

> 다음 포스트
> [모바일 웹뷰를 탐험하는 개발자를 위한 안내서 (중)](https://vallista.kr/2019/12/28/%EB%AA%A8%EB%B0%94%EC%9D%BC-%EC%9B%B9%EB%B7%B0%EB%A5%BC-%ED%83%90%ED%97%98%ED%95%98%EB%8A%94-%EA%B0%9C%EB%B0%9C%EC%9E%90%EB%A5%BC-%EC%9C%84%ED%95%9C-%EC%95%88%EB%82%B4%EC%84%9C-%EC%A4%91/)

## 서론

모바일 웹을 여행하는 사람들이라면 알겠지만, 웹의 중요성이 커지고 있습니다. iOS, Android 앱은 신규 기능을 추가하게 되면 앱 업데이트를 통해서 제공해야 하는데 업데이트를 유도하게 되면 여러가지 문제가 생기기 때문입니다.

가장 큰 문제는 모든 유저가 업데이트를 하지 않는다는 것 입니다. 업데이트를 하지 않기 때문에 과거 버전에 대해서 하위 호환성을 생각해야 하며, 이는 거의 영구적입니다. Fade-out을 위해서는 문제가 되는 버전을 사용 중인 고객이 앱을 업데이트 해야 하는데, 이는 현실적으로 힘든일입니다. 그렇기 때문에, 최근에는 웹뷰를 만들어 그 위에서 웹을 띄우는 형식으로 베타 테스트, A,B 테스트, 결제등의 지면에서 활용하고 있습니다. 이 방법은 문제가 생겼을 때, 앱 업데이트 없이 웹만 재배포하여 문제를 해결할 수 있기 때문에 유동성을 확보할 수 있습니다.

그렇다면, 웹뷰를 사용하는 몇 가지 큰 이유를 보도록 합시다.

### 모바일 기기의 성능 향상

이전 앱 시장에서 웹뷰를 사용하지 않았던 이유는 Native의 강력한 성능 때문이었습니다. 과거 성능이 별로 좋지 못하던 모바일 기기는 웹뷰에 진입하기만 하더라도 랙이 걸렸고, 이는 모바일 기기의 성능 향상으로 허들이 없어지다시피 되었습니다. 당장 갤럭시 3만 하더라도 웹뷰에 진입하면 많은 랙이 걸립니다. 이러한 구형 디바이스 지원을 위해 웹쪽에서는 최적화를 신경써주어야 합니다.

### JavaScript의 발전

JavaScript는 과거부터 언어자체의 난해함으로 인한 개발의 어려움이 존재했습니다. DOM 조작이나 이런 행동들이 상당히 까다로웠기 때문이죠. JavaScript는 이러한 문제점에서 자유로워지기 위해 계쏙 발전하고 있습니다. 그 중 가장 큰 발전을 이룬 ES2015 이후부터 Modern JavaScript라고 불리우는데, 최신의 언어 스펙을 무장하게 되었습니다. 그래서 웹 개발자는 ES2015 이후의 문법을 사용하여 편리하게 개발을 할 수 있게 되었습니다.

### SPA(Single Page Application)의 대두

SPA(Single App Application)의 대두는 위의 모바일 기기 성능 향상으로 함께 이루어진 기술입니다. 쉽게 말하면 기존의 서버사이드에서 HTML을 페이지마다 내려주는 기술에서 탈피해, 하나의 페이지에서 JavaScript로 동적 렌더링을 하겠다는 의미입니다.

- 사용자의 사용성이 좋아집니다. 페이지 전환 시 새로운 페이지를 로드하는 개념이 아니므로 애니메이션을 매끄럽게 줄 수 있습니다.
- 서버에서 메인 페이지 하나만 로드를 하면 나머지는 JavaScript 내에서 동작하므로 페이지마다 서버 작업을 안해주어도 됩니다.
- HTML, CSS, JavaScript 다운 받는다면 캐시가 남았다는 가정하에, 로컬에서도 동작시킬 수 있습니다.
- JavaScript 기반으로 작업하므로 협업을 더 효율적으로 할 수 있습니다. Component 별로 때서 작업이 가능하기 때문입니다.

---

## 모바일 대응하기

이러한 장점으로 모바일 웹뷰의 사용이 늘어나면서 다양한 이슈들이 존재합니다. 여러 이슈들에 대해서 알아보고, 어떻게 대처해야 하는지 알아보도록 합시다.

### CSS에서 기본 Height를 설정해주지 못했어요!

11 이하의 디바이스에서는 Height값이 기본적으로 잡혀있지 않기 때문에 auto든 100% 키워드를 설정해주어야 해요! 내부 contents의 크기가 유동적이라면 auto! 만약 전체 크기를 가지고 싶다면 100%로 설정해주세요!

### Flex를 사용하시나요?! 그렇다면 polyfill을 사용해주세요!

[Autoprefixer](https://github.com/postcss/autoprefixer)로 polyfill 설정을 해주세요!
그 외에도 Autoprefixer는 CSS 관련으로 다양한 일을 수행해준답니다!

### 비동기 후 데이터 레이아웃이 그려지지 않아요!

그렇다면 비동기 코드를 한번 봐보세요. Promise나 Async Await를 쓰고계시지 않나요? 우리 이 친구들의 polyfill을 추가해주어야 합니다!

[promise-polyfill](https://www.npmjs.com/package/promise-polyfill)
[es6-promise](https://www.npmjs.com/package/promise-polyfill)
[@babel/polyfill](https://www.npmjs.com/package/@babel/polyfill)

> 오우 이런! @babel/polyfill은 deprecated 되었답니다!
> [core.js](https://github.com/zloirock/core-js)를 다운받아서 이 안의 @babel/polyfill을 사용해주세요!

### IOS Touch 삭제하기

기본적으로 `cursor: pointer` 옵션을 주면 모바일에서 터치 시 터치 레이어가 잡혀요! 아래와 같이 CSS를 주세요!

```css {numberLines}
-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
-webkit-touch-callout: none;
-webkit-user-select: none;
-khtml-user-select: none;
-moz-user-select: none;
-ms-user-select: none;
user-select: none;
```

위의 옵션에는 모질라 브라우저와 IE 브라우저 옵션까지 함께 들어있습니다.

### 기본 브라우저 스타일 변경

각 브라우저는 브라우저만의 default css 설정값이 있습니다. 이러한 설정값은 도움이 되는 경우도 있지만, 다채로운 스타일을 적용할 때 해가 되는 경우가 많은데요 그 중에 button은 각 브라우저 별로 css를 제공하기 때문에 변경을 해야할 필요가 있습니다.

[참고 링크](https://stackoverflow.com/questions/6867254/browsers-default-css-for-html-elements) 자세한 데이터는 여기를 확인하세요!

#### Button

```css {numberLines}
input {
  padding: 0;
  outline: none;
  border: none;
  -webkit-appearance: none;
  background: none;
}
```

#### Input

```css {numberLines}
input {
  -webkit-appearance: none;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  outline: none;
}
```

#### Body

```css {numberLines}
body {
  margin: 0;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-text-size-adjust: 100%;
}
```

#### ul, ol

```css {numberLines}
ul,
ol {
  list-style: none;
  margin: 0;
}
```

#### Header, p, etc..

```css {numberLines}
h1,
h2,
h3,
h4,
h5,
h6,
p,
ul,
ol,
li,
dl,
dt,
dd,
em,
figure,
figcaption,
address {
  padding: 0;
  margin: 0;
  font: inherit;
}
```

많이 쓰는 태그들을 넣었습니다. 이외에도 필요한 게 있다면 위의 링크를 이용해주세요!

### Overlay 레이아웃이 있을 때, Body 스크롤 막기

모달이나 토스트등의 레이아웃이 나올 때, Body의 스크롤 레이어를 막야아 할 일들이 있습니다. 하지만 수많은 모바일 기기 시장에서 각 디바이스의 브라우저는 css 옵션에 대해서 제각각 설정값을 다르게 해주었기 때문에 우리는 이를 대응해주어야 합니다.

아주 쉽게 대응할 수 있는 방법은 아래와 같습니다.

```css {numberLines}
.modal-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: #8a8a8ab3;
}
```

모달 layout에 해당과 같은 소스를 적용해주세요. 이렇게 하면 데스크톱에서는 제대로 동작을 하는 걸 볼 수 있어요. 이제 이 소스를 모바일 디바이스에서 구동해보세요. 확인해보시면 알겠지만, 모바일 브라우저에서는 제대로 동작을 하지 않아요! 왜냐하면 `position: fixed` 옵션은 모바일 디바이스에서 제대로 된 동작을 보장하지 않습니다.

그러므로 우리는 쉽게 해결을 위해 [Body Scroll Lock](https://github.com/willmcpo/body-scroll-lock) 이 모듈을 사용하도록 해요. 하지만 모달 내에 스크롤 레이어가 필요하다면 옵션을 잘 알고 써야하니 참고해주세요!

[이슈 포스팅](https://bradfrost.com/blog/post/fixed-position/)

### Mobile Safari 스크롤 흔들림 이슈

모바일 사파리에서 `position: fixed`를 주고, fixed Element 위에서 스크롤을 하다보면 스크롤이 흔들리는 이슈가 있습니다. 해당 이슈를 해결하는 방법은 아래와 같습니다.

```css {numberLines}
.modal-wrapper {
  position: fixed;
  -webkit-transform: translateZ(0);
  ...;
}
```

---

위의 이슈 말고도 수많은 css 이슈들이 있으나, 이번 장에서는 많이 나오는 이슈 몇 가지에 대해서 알아봤습니다. 다음 글에서는 조금 더 어려운 대응 이슈를 보도록 하겠습니다.
