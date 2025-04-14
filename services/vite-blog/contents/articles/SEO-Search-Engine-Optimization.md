---
title: SEO (Search Engine Optimization)
tags:

date: 2019-05-10 19:07:56
draft: true
info: false
---

SPA는 SEO가 어렵다는 단점이 존재하는데, 이 단점을 극복하기 위해서는 전통적인 웹 형태인 MPA(Multiple Page Application) 형태를 띄어야 한다. MPA는 페이지를 요청할 때마다 새로운 페이지를 요청한다. 말 그대로 여러 페이지로 구성된 어플리케이션이다. 페이지가 전환될 때 마다 서버에 요청해서 해당 페이지에 맞는 완성된 html 파일을 받는다. 서버에서 완성된 html 파일을 보내므로, 각 URI마다 html파일이 존재한다. 그래서 Open Graph API를 사용해서 페이지 소개 글 및 preview 이미지를 집어넣을 수 있고, robot.txt가 인식할 수 있는 형태가 된다.

새로운 페이지를 요청하면서 모든 템플릿(html 파일)은 서버 연산을 통해 렌더링하고 완성된 페이지 형태를 클라이언트는 받게 된다. 이를 SSR (Server Side Rendering) 이라고 한다.

## 아이디어

- SEO가 필요한 페이지를 따로 추출하여 html를 만들고 내부의 javascript에서 spa 웹으로 redirect 시키는 방법
