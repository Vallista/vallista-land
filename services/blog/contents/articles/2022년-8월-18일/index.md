---
title: 2022년 8월 18일
image: ./assets/splash.jpg
tags: null
date: 2022-08-18T13:14:54.000Z
slug: 2022-year-8-month-18-day
---

![로고](assets/splash.jpg)

## 오늘 한 일

- 어제에 이어서 @Vallista-land/core library 배포하기
- 프로그래머의 뇌 3장 읽기
- 개발 7년차, 매니저 1일차 1~2장 읽기

## @Vallista-land/core library 배포하기

어제 삽질을 하면서 npm 배포를 위해 번들러를 구축하는 것을 진행했었다. 그 이유로 tsc가 bundler로썬 썩 좋지 않은 선택지라는 이야기와 제대로 동작하지 않는 문제들이 있었다. 그래서 microbundle과 parcel등을 찾아보았고 적용 삽질을 진행했으나 microbundle도 이슈로 인해 제대로 monorepo 환경에서 react를 빌드하지 못했고, parcel은 yarn workspace에서 제대로 동작하지 않는 이슈가 이미 공론화 되어 있는등 문제점이 있었다. 그래서 마지막으로 microbundle을 마지막으로 시도해볼까 한다.

### microbundle

microbundle은 사용하기 굉장히 쉽다. 그만큼 간단한 프로젝트에서 쉽게 사용하도록 잘 되어있는데, 이슈는 많은 편이라 상세한 조절이 조금 어렵다는 문제가 있다.

#### installation

```shall {numberLines}
$ lerna add --dev microbundle --scope=@vallista/core
```

lerna를 사용하므로 다음과 같이 실행했다.

#### package.json 수정하기

```json {numberLines}
{
  "name": "@vallista/core",
  "version": "0.1.0",
  "private": false,
  "files": ["lib"],
  "type": "module",
  "source": "./src/index.ts",
  "main": "./lib/index.js",
  "umd:main": "./lib/index.umd.js",
  "module": "./lib/index.js",
  "types": "./lib/types.d.ts",
  "exports": {
    "require": "./lib/index.js",
    "default": "./lib/index.modern.mjs"
  },
  "scripts": {
    "run:core": "microbundle watch --jsx react  -f es,cjs",
    "build:core": "microbundle --jsx react -f es,cjs"
  }
}
```

microbundle은 쉽게 package.json의 수정만으로 빌드 결과물을 낼 수 있다.

#### tsconfig.json 수정하기

```json {numberLines}
{
  "extends": "../tsconfig.settings.json",
  "compilerOptions": {
    "rootDir": "src",
    "baseUrl": "src",
    "outDir": "./lib",
    "jsxImportSource": "@emotion/react",
    "suppressImplicitAnyIndexErrors": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["lib", "node_modules", "build", "scripts", "acceptance-tests", "webpack", "jest", "src/setupTests.ts"]
}
```

환경에 맞게 설정해주었다. emotion을 사용하므로 jsxImportSource를 수정하고, suppressImplicitAnyIndexErrors와 allowSyntheticDefaultImports를 통해 기존에 허용하던 설정을 다시 풀어준다.

#### 의존성 재설치하기

yarn workspace는 모든 npm 모듈을 root로 올려서 교차에 있는 의존성 중복을 줄이고, 용량을 최적화한다. 그렇기 때문에 microbundle에서 사용하는 babel 버전과 블로그에서 쓰이고 있는 babel 버전등이 달라서 터질수도 있으므로, 해당 의존성을 다시 계산할 수 있도록 node_mobules와 cache 데이터를 삭제하고 다시 installation을 진행한다. `lerna bootstrap`을 진행해도 괜찮지만, yarn workspace를 사용하므로 `yarn` 키워드 하나면 모두 계산되어 동작된다.

#### 실행

![어 실행이 왜 되니?](assets/1.png)

<center>응..? 너 왜 갑자기 실행되니?</center>

역시 진리는 자고 일어나면 된다고, 자고 일어나서 다시 해보니까 된다. 어제는 의존성 재설치를 진행하지 않아서 기존 core 패키지의 babel 의존성이 묻어있었던 것 같다. 그래서 안되는 것으로 이해했고, microbundle로 다시 선택하게 된다..

#### npm 올리기

어찌되었던 결과적으로 npm에 올릴 빌드파일이 나왔으니 올리기만 하면 된다. 기존 프로젝트는 yarn workspace로 각 프로젝트간 호환을 담당하고 있었고, 해당 모듈들을 module 설정을 안해놓았기 때문에 호환이 가능했다. 그런데 지금은 tsconfig과 package.json 설정을 바꾼게 많아서 블로그 프로젝트를 실행하면 `@Vallista-land/core`가 없다는 에러가 나올 것이다. 그렇기에 우리는 에러가 안나오도록 시급히 `@Vallista-land/core`라는 패키지를 npm 업스트림에 올려두어, 실행 시 네트워크상에서 불러오도록 설정해야 한다.

이번엔 GitHub의 기능을 적극 활용해서 배포해보도록 하자.

`로컬 PC에서 publish 테스트하기`

> 상세한 내용은 [다음](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)에서 볼 수 있다.

[8월 16일 TIL](https://vallista.kr/2022년-8월-16일/)에서 이야기했지만, github 은 personal access token으로 권한을 제어하고 있다. 먼저 권한을 받아서, npm registry에 등록하도록 하자.

![키 발급받기](assets/2.png)

1. 이미지상에서 하단에 write:packages와 상단의 repo 설정을 허용하고, 발급받으면 다음 페이지에서 키를 받을 수 있다. 해당 키를 저장한 후, 다음과 같이 로컬에서 입력해준다.

```bash {numberLines}
$ npm login --scope=@Vallista --registry=https://npm.pkg.github.com
```

2. 입력한 후 username은 github username을 입력하고, password엔 복사한 토큰값을 붙여넣어주자.

3. 그 후 packages.json에 아래의 코드를 입력한다.

```json {numberLines}
"publishConfig": {
  "registry": "https://npm.pkg.github.com/"
}
```

4. .npmrc 파일을 설정한다.

```{numberLines}
@Vallista:registry=https://npm.pkg.github.com/:_authToken={TOKEN}
```

5. 그리고 로컬에서 npm publish를 진행하면 된다.

`트러블 슈팅`

GitHub에서 npm publish를 사용하기 위해 여러 문제가 있었다.

- 현재 repository 주소는 https://github.com/Vallista/vallista-land 이다. 여기서 확인해야할 것은 Vallista organization 안에 있다는 점이다.
- 위의 예시 `npm login --scope=@Vallista --registry=https://npm.pkg.github.com ` scope는 `org-name`을 뜻하는데, 현재 repository의 위계상 어떤 그룹에 있는가를 의미한다. 개인의 레포지토리라면 Vallista 라는 개인의 이름일 것이고, organization이면, 그룹의 이름일 것이다.
- 또한, .npmrc `@Vallista:registry=https://npm.pkg.github.com/:_authToken={TOKEN}` 의 @Vallista도 동일해야한다.

`npm publish 확인`

vallista-land에 core가 추가된 걸 확인할 수 있다. [주소](https://github.com/Vallista/vallista-land/packages/1602376)

#### 실제 환경에 잇기

기존에 사용하고 있던 패키지를 변경하고, core와 blog의 의존성을 끊으면 된다.

```json {numberLines}
"@vallista/core": "^0.3.0",
```

하지만.. 에러가 발생하고 있다. 그 원인은 `core/lib/index.js` 가 나오지 않기 때문이다. 그래서 `.d.ts` 는 나오기 때문에 타입 추론은 되지만, 런타임은 제대로 동작하지 않는다. 그렇기 때문에 .cjs로 만들어지는 것을 .js로 변경해야 한다. 이 부분은 내일 하는 것으로.

## 프로그래머의 뇌 3장 - 프로그래밍 문법 빠르게 배우기

오늘은 프로그래머의 뇌 3장으로 오전을 시작했다. 결론적으로 사람의 뇌는 연관된 기억들로 저장한다. 그렇기에 적절한 시간의 텀을 주고 의도적으로 생각하도록 하는 **부호화** 라는 과정을 거쳐서 LTM에 정확한 정보를 오랜시간동안 기억하도록 노력해야 한다. 이렇게 하는 이유는 뇌는 저장과 인출 강도가 존재하는데, 저장은 많이해도 인출을 제대로 못하면 의미가 없기 때문이다.

- 특정 메서드는 기억하지만 모든 메서드를 기억하진 못한다.
- 이 장을 읽으면 특정 지식은 왜 기억하는지, 어떤 지식은 잊어버리는지 알 수 있다.
- 프로그래밍의 개념을 더 잘, 그리고 더 쉽게 외우기 위해 유용하게 사용할 수 있는 네 가지 중요한 방법을 소개한다.
- 사람들은 프로그래밍 언어의 문법을 모르더라도 인터넷에서 검색하면 되고, 따라서 문법에 대한 지식이 그리 중요한 것은 아니라고 생각한다
- 하지만 검색은 그리 좋은 해결책이 되지 못한다.
- 관련내용을 미리 알고 있는 것이 코드를 효율적으로 읽고 이해하는데 큰 도움이 된다. 개념 자료구조, 문법을 더 많이 알 수록 두뇌는 더 많은 코드를 쉽게 분리하고 알 수 있다. (LTM)
- 두뇌가 작업을 하다 인터럽트를 받게 되면, 이를테면 문법 검색을 위해 인터넷을 열게 되었을때 다른 작업을 할 확률이 굉장히 높다. (이메일, 다른 정보를 본다는 등) 업무 도중 중단이 되면 다시 업무로 돌아오는데 15분 정도가 걸린다. (1분 이내에 하던 일을 다시 시작하는 경우는 10%정도였다.)

#### 플래시카드를 사용해 문법을 배우면 좋은 효과가 될 수 있다

- 암기하거나 학습하려고 하는 내용에 대한 프롬프트, 지칭하는 단어나 질문이 있고 뒷면엔 내용이나 답이 있다
  - 앞면에 개념을 적어놓고 뒷면에 해당하는 코드를 적는다.
  - 외국어를 배울때 많이 사용하는데, 문법을 배울 때도 유용하다.
  - 외국어에 비해 문법이 적으므로 더 적은 코스트가 들어간다
  - 세레코, 안키, 퀴즈렛 같은 앱도 있다.
- 언제 사용해야하는가?
  - 새로운 프로그래밍 언어나 프레임워크 혹은 라이브러리를 배울때 새로운 개념을 접하면 그 내용을 갖고 플래시 카드를 사용하라
  - 어떤 개념을 검색할 때, 해당 개념에 대한 단어나 문구를 쓰고 반대편에 코드를 적어놓아라

#### LTM은 추가로 연습하지 않고서는 내용을 오랫동안 기억할 수 없다.

- STM에서 LTM으로 옮겨지지만 영원히 저장되는게 아니고, 꽤나 짧은 시간내에 휘발된다.
- 한 시간 이내에 우리가 알고 있는 것의 반 정도를 잊어버린다.
- 두뇌가 기억을 저장할 때는 컴퓨터가 디스크에 0 1로 데이터를 저장하는 것처럼 하지는 않지만, 저장하는 방법을 **부호화**라는 용오를 동일하게 사용한다. 이는 기억이 뉴런에 의해 형성될 때 두뇌에서 일어나느 변화를 의미한다.
  - 컴퓨터의 하드 드라이브에서 폴더나 하위 폴더의 계층구조로 저장되는 방식과 다르다.
  - 두뇌의 기억은 네트워크 구조로 되어 있다. **하나의 사실은 다른 많은 사실과 연결**되어 있다.

#### 망각 곡선

- 기억이 서로 연관성과 관계성을 갖고 저장되기 때문에 아는 단어나 개념을 기억하려고 하는 것은 테스트가 될 수 없다
- 예를 들어 파이썬의 리스트 컴프리헨션 문법을 기억하려고 할 때 for 루프 문법을 알고 있다면 이것의 도움을 받게 된다
- 망각 곡선이란 개념은 헤르만 에빙하우스의 연구를 바탕으로 만들어졌다.
- 해당 연구에서 사람은 얼마나 빨리 잊어버리는지에 대해 이해할 수 있다.
- 해리 바릭이 수행한 연구는 반복 학습 시 간격을 어느 정도 둘 때 가장 효과가 큰지에 대해 연구했다.
- 8주의 간격을 두고 26회 반복한 경우 가장 많은 단어를 기억한다
- 잊지 않고 계속 외우는 단어의 비율은 76%, 2주 간격으로 외웠던 그룹은 1년후 기억한 단어의 비율이 56%
- 오래 학습한 만큼 더 오래 기억한다. 많은 시간을 학습해야 한다.
- 플래시카드를 한 달에 한 번 다시 학습하면 오랫동안 기억하는 데 충분하다.

#### 기억을 강화하는 두 가지 테크닉

- 무언가를 일부러 기억해보려고 애쓰는 인출(retrieval) 연습
- 기존 기억에 새로운 지식을 적극적으로 연결시키는 정교화(elaboration)

#### LTM으로부터 기억을 가져오는 두 가지, 서로 다른 기제 저장 강도와 인출 강도로 구분된다.

- 저장 강도
- LTM에 얼마나 잘 저장하고 있는가를 나타냄
- 인출 강도
- 무언가를 얼마나 쉽게 기억할 수 있는지를 나타냄
- 문법을 잘 알고 있다고 생각했는데 막상 잘 기억이 안나는 경우 -> 저장 강도는 높지만 인출 강도는 낮다.
- 저장 강도는 감소하지 않고 늘어나는 반면 인출 강도는 시간이 흐를수록 약해지는 것으로 알려져 있음
- 자기가 이미 알고 있다고 생각하는 내용을 기억하려고 노력하면 추가 학습 없이도 인출 강도가 강화된다.

#### LTM에 저장하는 것도 중요하지만 쉽게 인춣하는 것도 중요하다.

- 프로그래밍 언어의 문법을 기억하는 연습을 해본 적이 없기 때문에 그것이 정작 필요할 때 기억해내는 것이 어렵다.
- 능동적이고 의도적으로 기억해내는 노력이 기억을 강화한다는 사실은 고대 아리스토텔레스 시대까지 거슬러 올라가 알려져 있는 기술이다.
- 학습을 추가로 하지 않고 정보를 기억하려고 능동적으로 노력하는 것만으로 배운 것을 많이 기억할 수 있다.

#### 망각 곡선과 인출 강도의 효과에 대해 살펴봤기 때문에 매번 필요할 때마다 문법을 찾아보기만 하는 것이 좋은 방법이 아니다.

- 프로그래밍 문법을 기억할 필요가 없다 생각하니 프로그래밍 문법에 대한 인출 강도가 강화되지 않고 계속 약한 상태로 남아있는다.
- 검색 이전에 먼저 그것을 능동적이고 의도적으로 기억하려고 시도해보는 것이 좋다.

#### 능동적으로 기억하려고 노력할 때 그 정보가 우리 두뇌에서 더 잘 기억된다.

- 정보를 외울 때는 어느 정도의 간격과 기간을 두고 연습할 때 최상의 결과를 얻는다.
- 정보에 대해 능종적으로 생각하고 그것을 반추해보는 것
- 정보에 대해 생각하는 과정을 **정교화**라고 부른다.

#### 스키마타

- 사고나 생각이 서로 관련되어 조직된 방식을 **스키마** 혹은 **스키마타** 라고 부른다.
- 새로운 정보를 학습할 때 정보는 LTM에 저장하기 전에 먼저 스키마의 형태로 만들어진다
- 작업 기억 공간에서 정보를 처리할 때 관련 지식과 기억을 LTM에서 찾는 것을 상기하라
- 인출 강도는 다른 기억에 연관된 기억일 때 더 높다
- 기억이 저장될 때 기ㅏ존 스키마타에 맞추기 위해 기억이 바뀌는 일도 있다.

#### 정교화

- 인출 강도가 약하면 기억은 잊힐 수 있다.
- LTM에 처음 저장될 때 어떤 내용은 변경되거나 빠질 수 있다.
- 정보가 많이 저장되는지에 영향을 미치는 요인은 자신의 감정적 상태를 포함해서 여러가지가 있다.
- 기억이 처음 저장될 때 기억의 부호화를 강화할 수 있는 한 가지 방법이 바로 **정교화**이다.
- 기억하고자 하는 내용을 기존 기억과 연관 지으면서 생각하는 것을 뜻함
- LTM에 저장되어있는 스키마타에 맞춰서 새로운 기억이 저장된다

## 개발 7년차, 매니저 1일차 1장 - IT 관리 101

매니저를 오랜기간 해왔지만, 명확히 팀장이라는 직책이 부여되어 명시적으로 매니저로 일하는 것은 처음이었다. 지난 날을 회상했을때 매니저 역할을 진행해도 상위의 매니저가 어떤 일을 하는지, 어떤 것을 원하는지, 나는 어떻게 해야하는지 등을 고민한 적이 없었고 그러한 고민을 위해서 매니징 책을 읽곤했다. (실리콘벨리의 리더쉽, 피플웨어 등) 그러던 와중 개발 7년차, 매니저 1일차가 좋다는 이야기를 주변에서 많이 듣게 되어 읽게 되었다.

아직은 1~2장밖에 읽지 못해 책의 진위를 알진 못하지만, 목차륿 보았을때 뒤로 갈수록 나에게 의미있는 챕터가 많아서 기대중이다. 앞의 내용은 팀원이 매니저에게 어떤 일을 요구해야 하는지 이야기하고 있다. 이 챕터를 읽으면서 반대로 팀원이 어떤걸 원하는지 이해하는 시간이 될 수 있어 좋았다.

팀원이 매니저에게 기대하는 것은 원온원을 통한 주기적인 소통과, 피드백과 직장 가이드, 교육과 경력의 성장등이 있다. 그리고 팀원과 매니저는 관리되는 방법을 알아야 한다. 자신을 책임지는 것은 매니저가 아닌 자신이고, 성장을 본인이 하도록 주도해야하며, 그 안에서 성장이 필요한 것을 매니저에게 지속적으로 요구해야 한다. 유능한 매니저는 그러한 상황에서 유의미한 피드백을 제공하고, 성과에 대해 '사내 정치'를 잘 이용해 팀원을 알리고 성과에 맞는 보수가 들어오도록 제공한다.

### 매니저에게 기대하는 것

#### 원온원 미팅

- 두 가지 목적
  - 팀원과 매니저 사이의 인간적인 연결: 팀원의 컨디션을 눈치채고 왜 그런지 물어볼 정도로 팀원을 챙겨야한다. 신뢰가 바탕이 된 인간적인 연결은 좋은 팀의 뼈대이다. 진실한 신뢰를 쌓으려면 상대 앞에서 기꺼이 약해질 수 있는 능력과 의지가 필요하다.
  - 매니저와 어떤 주제라도 개인적으로 이야기 하는 것: 원온원 미팅의 주제를 정하는 것은 팀원의 몫이다. 주제를 정하고 준비하려면 미팅 시간을 사전에 알아야 한다. 정기적인 미팅이든 비정기적이여도 있는게 좋다.
- 좋은 원온원 미팅은 상황을 보고하는 미팅과 다르다.

#### 피드백과 직장 가이드

- 업무 피드백을 자주 받아서 잘못된 습관을 빨리 알고 쉽게 고치도록 하자
- 좋은 매니저는 팀원의 일상적이고 사소한 업무 중 잘하는 점을 알아차리고 인정해준다
- 피드백에서 칭찬은 공개로, 비판은 비공개로 하는게 이상적이다
  - 팀원을 공개 칭찬하는 것은 모범 사례가 주는 긍정적인 효과가 있다.
- 코드 말고 다른 부분의 피드백도 필요하다. 매니저의 피드백이 이럴 때 유용하다.
- 매니저는 회사에서 가장 중요한 협력자이며, 승진에 대해 적극적으로 묻고 도움을 부탁해야 한다.
- 매니저는 팀원이 성장하고 새로운 것을 배우는데 더움이 되는 도전 과제를 찾아서 알려줘야 한다.
- 프로젝트가 매력적이지 않아도 왜 해야하고 일이 어떤 가치가 있는지 이해시켜야 한다.
  - 팀 목표가 큰 그림에서 팀원의 일이 어떻게 연결되는지 알려주고, 회사의 성공에 어떻게 기여하는지 이해하도록 해야한다.

#### 교육과 경력 성장

- 어떤 교육이 필요한지를 파악하는 것은 대개 팀원 자신의 책임이다.
- 매니저는 팀원의 경력 성장을 직접 도울 수 있는 방법으로 승진이나 보상이 있다.
- 인사 위원회를 통해 승진이 결정된다면, 위원회에서 검토할 자료를 작성할 때 매니저가 돕는다.
- 좋은 매니저는 조직에서 해당 팀원에게 원하는 바를 파악하고, 그 팀원이 이를 달성하고 필요한 기술력을 쌓는 데 도움을 줄 수 있다.

### '관리되는' 방법

- 회사에서 자신만의 노하우를 쌓기 위해서는 주인 의식과 권위를 높이고, 사내 인맥을 전적으로 매니저에게 의존하지 않아야 한다.
- 자신만의 경력을 쌓고 직장에서 행복을 찾는 것은 매우 중요하다.

#### 원하는 것을 생각하는 데 시간을 써라

- 매니저는 팀원에게 성장 기회를 줄 수 있다. 자신의 프로젝트를 보여주고 팀원의 학습과 개발에 조언할 수 있다.
- 세상은 불확실하다. 불확실함을 극복하기 위해 의지할 수 있는 유일한 사람은 자기 자신이다. 매니저가 대신해줄 수 없다.
- 매니저를 이용하면 내 위치에서 무슨일까지 가능한지 알 수 있지만, 내가 그 다음에 가고싶은 위치를 알고 싶다면 나 자신을 이용해야한다.

#### 자신을 스스로 책임져라

- 자신을 아는 것이 첫 단계다.
- 의논할 게 있으면 원온원 미팅의 안건으로 이야기하고, 프로젝트를 계속 하고 싶을 때는 매니저에게 요청하자
- 매니저가 도움이 되지 않으면 도움이 될 다른 이를 알아보거나 개선 사항 등의 건설적인 피드백을 해줄 사람을 찾아라
- 매니저는 팀원의 일과 생활의 균형, 워라벨을 강제할 수 없다.

#### 매니저에게 휴식을 주자

- 매니저를 쉬게 만드는 것도 팀원의 업무다.
- 매니저의 업무는 회사와 팀을 위해 최선을 다하는 것이다.
- 매니저와 팀원의 관계는 가까운 사람과의 관계와 같다.
- 매니저에게 문제 접근 방식에 대한 조언을 구하라. 조언을 구하는 것은 존중과 신뢰를 표현하는 좋은 방법이기도 하다.

#### 매니저를 현명하게 선택하자

- 매니저는 팀원 경력이 엄청난 영향을 끼친다. 그렇기 때문에 취업할 때 직업, 회사, 급여뿐 아니라 매니저까지 고려하라
- 실력있는 매니저는 '사내 정치'를 하는 방법을 알고 있다. 팀원을 승진시키기 위해 승진 결정권자에게 주목받고 조언을 얻게 할 수 있다.
- 인적 네트워크를 통해 매니저가 함께 일하지 않아도 새로운 일을 줄 수도 있다.
- 뛰어난 매니저와 친구 같은 매니저, 개발자로서 존경받는 매니저 사이에는 차이가 있다.
- 조직에서 리더십과 관련된 정치적 맥락을 알지 못하고 알려고도 하지 않기 때문에 무능한 매니저로 전락하고 만다.

## 개발 7년차, 매니저 1일차 2장 - 멘토링

나또한 비공식적으로 관리 업무를 현재 회사(우아한형제들)에서 2년 넘게 맡았고, 이전에도 그러했다. 대다수는 이미 동작하고 있던 팀에서 다양한 개발자가 입사하면서 이러한 일이 벌어졌는데, 그러면서 중요함을 많이 느끼게 되었다. 그 당시 느꼈던 것은 문서화와 많은 대화가 중요하다는 걸 깨달았다.

현재 회사에서 팀장으로써 멘토링보다 온보딩을 함께 할 수 있는 사수를 정해놓곤 했다. 그러면서 바랐던 점은 멘토의 성장과 멘티의 온보딩이라는 두 마리 토끼를 함께 잡는 것이었다. 특히 개발 능력만 중요한게 아닌 소프트 스킬도 중요한 업계의 특성상 그러면서 리더십 역량이 탁월한 사람을 찾기 마련이고, 그러한 사람을 차기 리더로 뽑을 수도 있겠다는 생각을 했다.

그런데 이를 깊숙히 생각해보진 않았는데, 이번 기회를 통해 깊게 생각해보게 되었고, 조금 더 적극적으로 이를 활용해야겠다는 생각이 들었다.

### 주니어 팀원 멘토링의 중요성

- 신입 개발자나 인턴이 입사하면 그 위의 주니어나 시니어 개발자가 멘토가 된다.
- 건강한 조직은 신입 사원 멘토링 프로그램이 멘토와 멘티 모두에게 한 단계 더 성장할 기회가 되며, 멘토는 다른 사람에 대한 책임감을 알 수 있는 계기가 된다.
- 신입에게 첫 회사의 멘토는 굉장히 중요한 시간이며, 앞으로의 이정표가 될 수 있을정도로 중요하다.

### 멘토 되기

- 멘토는 아무나 할 수 있는게 아닌 특별한 경험이다. 관리와 관련된 업무를 안정적으로 배울 기회이자, 조직에서 누군가를 책임지는 경험을 쌓는 기회이다.
- 멘토에게 최악인 상황은 자신의 업무에 소홀해지는 경우와 멘토링이 엉망이라 인턴이나 신입 개발자에게 나쁜 경험을 줘 인재를 놓치는 경우이다.

#### 인턴을 위한 멘토링

- 인턴은 학위 과정에 있는 경우가 많으며, 회사의 실무를 통해 가치 있는 경험을 갖고 싶어한다.
- 회사는 인턴 제도를 인재 채용 기회로 활용한다.
- 실무 경험이 거의 없는 대학생을 멘토링한다는 의미, 회사에서 찾는 인재는 아니어도 멘토를 좋아하게 만들어야 한다.
  - 인턴이 끝나 학교로 돌아갔을때 인턴 경험을 좋게 전달할 것이다.
- 인턴이 생기면 먼저 해야할 일은 인턴이 할 프로젝트 선정이다.
  - 인턴 기간동안 프로젝트 크기와 난이도를 적절하게 분배해야 한다.
  - 인턴은 신입사원과 비슷한 루트를 타게 된다.
  - 인턴이 감을 잡을 수 있도록 인턴의 질문에 귀 기울이고 대답하며, 장차 매니저가 될때 필요한 기술을 연습한다는 생각으로 임하라
  - 경청하기, 의사소통하기, 적절한 피드백 주기

##### 경청하기

- 사람 관리의 시작이자 기본
- 누군가에게 보고할 필요가 없는 수석 갭라자조차 다른 사람의 말을 들을 줄 알아야 한다.
- 직접적이든 간접적이든 모든 사람은 자신의 의도를 상대방이 정확히 이해하게 말하지 못한다.
- 멘티가 하는 말 이상을 파악해야 한다.
- 멘토는 복잡한 설명을 몇 번이나 다른 방법으로 말할 수 있어야 한다. 멘티 질문이 이해되지 않으면 다른 방식으로 거듭 질문해야 한다.
- 멘티가 이애할 때까지 시간을 사용한다.
- 멘티의 눈에는 멘토가 큰 힘이 있는 위치의 사람이며, 편안한 마음으로 멘티의 질문을 들어라.
- 멘토가 질문에 답을 하기 위해 많은 시간을 쓰는 확률보다 멘티가 충분히 질문하지 않아 일이 전혀 다른 방향으로 잘못 진행될 가능성이 더 높다.

##### 명확하게 의사소통하기

- 스스로 해결 방법을 찾지 않고 의존할 경우, 다른 관리 방법을 사용하라
- 질문하기 전 더 고민해보라고 조언하거나 도움이 될 만한 관련 설명서를 줘라
- 첫 마일스톤을 알려주고 하루나 이틀 동안 혼자 작업할 시간을 준다.
- 인턴이 작업하는 도중에 멈추게 하는 것은 피해야 한다.
- 올바른 방향을 유지하도록 약간의 방향성과 명확한 작업 방법을 알려준다

##### 적절한 피드백 주기

- 연습할 수 있는 관리의 마지막 기술
- 인턴 과정의 몇 주 동안에는 인턴에게 적절한 업무 피드백 주기를 찾아야 한다.
- 일주일에 한 번은 인턴의 작업을 확인하고 따로 시간을 내서 이야기를 나누어라.

#### 신입사원 멘토링 하기

- 신입 사원 멘토링은 정말 중요하다. 멘토는 신입 사원 교육, 회사 적응 돕기, 회사 내 인맥 쌓기 등이 필요하다.
- 인턴 멘토링보다 쉽지만, 멘토링 관계가 더 오래 지속된다.
- 멘토에게 신입 사원 멘토링은 새로운 눈으로 회사를 관찰할 수 있는 기회이다.
- 암묵적인 규정등으로 혼란스러운 경우를 찾고 이런 것을 이해하는 기회가 되어야 한다.
  - 신입사원의 낯설고 참신한 시각 및 질문을 불편해하지 말고 이용하라.
- 효율적으로 일하는 팀은 신입 사원 교육 문서가 잘 갖춰져 있다.
  - 개발 환경을 구축하고, 트래킹 시스템 동작을 이해하고, 필수 업무 도구를 단계별로 설명한 문서 등
  - 멘토는 문서를 통해 신입 사원이 잘 적응하도록 돕고, 신입 사원은 교육 과정에서 겪은 문제를 기록해 팀에 헌신함을 증명한다.
  - 학습 결과는 팀의 이익을 위해 공유한다.
- 멘토링은 신입 사원을 주변 동료들에게 소개할 좋은 기회도 된다.
- 신입 사원은 관리하는 것에 관심이 전혀 없을지라도 정보와 아이디어를 공유하는, 신뢰할 수 있는 튼튼한 인맥이 없으면 좋은 경력을 쌓기 어렵다.
- 인맥을 만드는 일이 시간과 에너지를 투자할 만한 일임을 기억하자.

#### 기술과 경력 멘토링

- 최고의 멘토링은 큰 업무를 함께하다 보면 자연스럽게 이뤄진다.
- 시니어 개발자가 생산성을 높이기 위해 팀 내에서 주니어 개발자의 멘토가 되면, 둘은 팀 문제를 함께 해결할 수 있다.
- 멘티가 작성한 코드를 시니어 개발자가 개선하면, 수정할 것이 줄어들고, 개발 속도가 빨라지는 등 긍정적인 장점이 있다.
- 주니어 개발자는 자신의 업무와 상황을 잘 이해하는 사람에게 관리받고 실습할 때 많은걸 배운다.
- 이는 시니어 개발자 업무의 한 부분이기도 하다.
- 멘토와 멘티가 서로에게 기대하는 것과 목표를 명확하게 정하는 것이 중요하다.

##### 멘토일 때

- 멘토는 멘티에게 기대하는 바를 이야기해야 한다.
- 멘티가 미팅 때 질문을 준비하도록, 미팅 주제와 질문을 미리 보내달라고 요청해야 한다.
- 매니저나 동료로써 반드시 해야 하는 솔직한 충고나 조언을 자신 있게 할 정도의 전문성을 갖추고 있지 않다면 멘토로 나서는 것은 의미가 없다

##### 멘티일 때

- 얻고 싶은걸 생각하며 멘토링 시간을 준비해야 한다.
- 대가 없이 자원봉사를 자처한 팀 내부의 시니어에게 멘토링을 받는 경우 멘토의 시간을 낭비하지 않도록 주의해야 한다.
- 멘토가 있으면 좋을 것 같지만 정작 만나서 커피를 마시며 시간을 보낸다면 멘토가 꼭 필요한 것은 아니다.

### 좋은 매니저, 나쁜 매니저 : 알파 긱

- 알파 긱: 사무실에서 기술이나 컴퓨터에 관련 전문 지식이 많은 사람을 의미
- 늘 정답을 말하며 어떤 어려운 문제도 풀어내는 사람
- 이들은 '탁월함의 문화'를 만드려고 하지만 결국엔 '두려움의 문화'를 만드는 경향이 있다.
- 좋은 매니저의 경우, 두려운 존재이기도 하지만, 젊은 개발자에게 많은 영감을 준다. 팀에게 가르칠 지식이 많아 팀원은 그의 하대를 견디며 실력을 존경한다.
- 나쁜 매니저의 경우, 의견이 반영되지 않은 결과는 아무도 가져갈 수 없게 한다. 등등 안좋은 사례만 가득
- 알파 긱 성향이 없는지 스스로 진단하기
- 형편없는 매니저가 될 가능성이 높다. 알파 긱이 팀매니저가 되면 효율성을 떨어뜨릴 가능성이 높다.

### 멘토의 매니저를 위한 팁

- 수치로 측정해 정리할수록 우리는 더 나아진다.
- 팀원이 명확하고 집중할 수 있으며 측정이 가능한 목표를 만들게 해 팀의 성공을 도울 것이다.
- 첫 째: 멘토링 관계를 설정하는 이유 생각하기
  - 신입 개발자와 인턴 이외의 멘토링 프로그램을 운영한다면 프로그램에 적용할 지침과 체계를 면밀히 살펴야 한다.
- 멘토링은 멘토에게 책임이 추가된다는 뜻임을 기억하라
  - 멘토링을 성공적으로 수행할 것 같은, 코딩 능력 이상의 것을 증명하고 싶어하는 사람을 찾아야 한다.
- 멘토링 프로그램에 대한 일반적인 오해는 멘토링을 낮은 수준의 '감정 노동' 으로 보고, 멘토와 멘티가 같은 부류의 사람이어야 한다고 가정하며, 멘토링을 팀의 잠재력을 관찰하는 기회로 이용하지 못한다고 생각한다.
  - 첫 째: 감정 노동은 소프트 스킬이라고 여겨져 왔지만, 소프트 스킬도 능력이다.
    - 멘토링 프로그램을 운영하는 데도 비용과 지원이 필요하다.
    - 멘토링이 시간이 드는 일이란 점을 이해하는 것이 시작이다.
    - 멘토에게는 계획을 세우고 멘토 활동을 충실히 할 수 있는 충분한 시간을 주는 게 중요하다.
  - 둘 째: 같은 부류의 멘토-멘티를 짝짓지 마라.
    - 최고의 멘토와 연결해주는 게 바람직하다.
    - 비슷한 직무를 밭은 사람을 멘토로 지정하라.
    - 업무 기술을 높이기를 바란다면, 멘티가 맡은 업무를 이미 숙달한 사람이 최고의 멘토다.
  - 셋 째: 팀의 차기 리더를 훈련하고 보상하는 기회로 사용하라
    - 리더십은 인간의 상호작용이 필요하다.
    - 인내와 공감 능력 향상은 팀 기반으로 일하는 모든 사람에게 매우 중요하다.
    - 원온원으로 멘토를 장려하는 이유는 인맥 형성은 말할 것도 없고 더 강한 외재적 관점을 개발하는데 도움이 되기 때문이다.
    - 참을성이 없는 젊은 개발자의 경우에는 멘토링을 통해 인턴의 성장을 돕는 과정에서 겸손함을 알게 될 것이다.

### 멘토를 위한 핵심 요약

#### 호기심과 열린 마음 갖기

- 멘티의 질문은 새로운 사람의 눈을 통해 조직의 명확치 않은 것들을 관찰하는 시작점이 된다
- 일하는 동안 가치 있는 것이 무엇인지 다시 의문을 던질 기회를 준다.

#### 상대방의 언어를 듣고 말하기

- 좋은 멘토링을 경험하고 나면 팀 리더에게 필요한 기술이 만들어지기 시작한다.
- 매니저가 될 생각이 없어도 소통 기술을 익히는데 도움이 된다.
- 주니어 팀원과 업무를 잘 수행하려면, 몇 번이나 시간을 들여 노력을 쏟더라도 그들이 이해하는 방식으로 경청하고 소통해야 한다.

#### 인맥 관리하기

- 멘토 중 누군가가 직장을 소개해줄 수도, 미래에 함게 일을 할 수도 있다.
- 다른 사람에게 잘 대하려고 노력하라.