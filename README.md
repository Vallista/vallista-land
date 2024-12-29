# Vallista Land

vallista의 모든 레포에 쓰이는 디자인 시스템, 프로젝트 레포지토리입니다.

## installation

```shell
$ npm install -g pnpm
$ pnpm i
```

pnpm workspace로 모든 패키지 모듈을 실행합니다.

## launch

```shell
// terminal tab 1 (첫번째 탭을 켠다)
$ pnpm watch:blog
// terminal tab 2 (두번째 탭을 켠다)
$ pnpm watch:ds // design system 실시간 반영
```

## Add Module (library, .js)

**전역으로 사용되는 모듈의 경우**

```shell
$ pnpm add -w {dev인 경우 -D} {모듈명} --ignore-workspace-root-check
```

**패키지 단위에만 쓰이는 모듈의 경우**

```shell
$ pnpm --filter {패키지 명} add {모듈명}
```

## 기술스택

- react
- typescript
- pnpm workspace (monorepo)
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

# 히스토리

- 2024년 12월 30일 lerna 삭제 및 최신화
