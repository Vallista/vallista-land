# Vallista Land

vallista의 모든 레포에 쓰이는 디자인 시스템, 프로젝트 레포지토리입니다.

## installation

```shell
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
