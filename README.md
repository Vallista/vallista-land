# Vallista Land

vallista의 모든 레포에 쓰이는 디자인 시스템, 프로젝트 레포지토리입니다.

## installation

```shell
$ npm install -g lerna
$ yarn
```

yarn workspace로 모든 패키지 모듈을 실행합니다.

## launch

```shell
// terminal tab 1 (첫번째 탭을 켠다)
$ yarn run:playground // playground start
// terminal tab 2 (두번째 탭을 켠다)
$ yarn run:core // design system 실시간 반영
```

## Add Module (library, .js)

**전역으로 사용되는 모듈의 경우**

```shell
$ yarn add {모듈명} {dev인 경우 --dev} --ignore-workspace-root-check
```

**패키지 단위에만 쓰이는 모듈의 경우**

```shell
$ lerna add {모듈명} --scope={패키지명}
```

## 기술스택

- react
- typescript
- lerna + yarn workspace
- gatsby

## Rule

1. todo -> in progress -> review -> PR (origin to upstream) -> done
2. conventional commit rule로 https://www.conventionalcommits.org/en/v1.0.0/ 커밋메시지 작성

## 개발 방법

1. core > components > 해당 컴포넌트 제작
2. core > components > index.ts 에 등록
3. blog > src 에서 테스트

## 그 외

### 3000 포트 킬

```shell
$ npx kill-port 3000
```

### 빌드 안될 때

```shell
$ yarn clean:template
$ yarn clean:playground
$ lerna clean
```

1. 위 명령어 입력
2. 최상위 node_modules 삭제
3. @vallista-core/tsconfig.tsbuildinfo 삭제
4. @vallista-core/lib 삭제
5. 아래 명령어 입력

```shell
$ yarn
$ yarn build:core
$ yarn run:core
```

### 트러블 슈팅

- CRA 기반 프로젝트와 gatsby 기반 프로젝트를 monorepo의 root에서 모듈 관리를 함께 하니, 모듈 충돌이 일어나는 문제가 발생해서 gatsby 프로젝트가 실행이 안되었음. 그래서 모두 gatsby로 변경.
