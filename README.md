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
$ lerna run start // blog start
// terminal tab 2 (두번째 탭을 켠다)
$ lerna run watch // design system 실시간 반영
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
- react-app-rewired

> react-app-rewired 쓰는 이유
>
> 참고: https://stackoverflow.com/questions/65893787/create-react-app-with-typescript-and-npm-link-enums-causing-module-parse-failed

## Rule

1. todo -> in progress -> review -> PR (origin to upstream) -> done
2. conventional commit rule로 https://www.conventionalcommits.org/en/v1.0.0/ 커밋메시지 작성

## 개발 방법

1. core > components > 해당 컴포넌트 제작
2. core > components > index.ts 에 등록
3. blog > src 에서 테스트
