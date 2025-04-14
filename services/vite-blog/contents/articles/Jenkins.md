---
title: Jenkins
tags:

date: 2019-05-28 11:11:30
draft: true
info: false
---

## #1 설치

1.  Jenkins

    [Docker Container로 Jenkins 설치](https://www.leafcats.com/215)

    [Github과 Jenkins 연동하기](https://taetaetae.github.io/2018/02/08/github-with-jenkins/)

2.  jenkins 관리 > 플러그인 관리 > 설치가능 탭 > git 검색 > github intergration plugin 다운로드
3.  jenkins 관리 > configure global security > CSRF Protection > disable
4.  jenkins 실행 서버

        $ ssh-keygen -t rsa -f id_rsa

5.  Credentials > System > Global Credentials > Add Credentials
    - kind - ssh username with private key
      - scope - global
      - ID - 유니크 이름
      - Description - 설명
      - UserName - 유저 이름
      - Private Key - jenkins 서버(jenkins가 돌아가는 운영체제) 에서 ssh-keygen으로 입력한 값 중 id_ksa 파일
      - Passphrase - 비밀번호
6.  Github Repository > Settings > Deploy Keys > Add Deploy Key > Title, Key 입력 (key = ssh-keygen 으로 발급받은 id_rsa.pub)

## #2 작업 생성

1. 새로운 Item으로 작업 생성
2. Freestyle Project, Pipeline 용도에 맞게 생성
3. 아래의 사진 처럼 셋팅

   ![](/images/jenkins_1.png)

   ![](/images/jenkins_2.png)

4. Pipeline script from SCM (pipeline일 때), SCM → Git, Repository에는 ssh주소를 적어준다. 그리고 만들어놓은 Credentials를 사용.

   ![](/images/jenkins_3.png)

## #3 Jenkins File로 Pipeline 설정

[Triggering a Jenkins Pipeline on 'git push'](https://medium.com/@dillson/triggering-a-jenkins-pipeline-on-git-push-321d29a98cf3)

> Jenkinsfile 실행 시 cannot connect to the docker daemon issue
>
> [Jenkins: Can't connect to Docker daemon](https://stackoverflow.com/questions/38105308/jenkins-cant-connect-to-docker-daemon)
>
> [Docker can't connect to docker daemon](https://stackoverflow.com/questions/21871479/docker-cant-connect-to-docker-daemon)
>
> 1. docker가 실행되어 있는지 확인
> 2. docker group 권한 주기
>
>    sudo groupadd docker
>    sudo usermod -aG docker $(whoami)
>
> 3. sudo service docker start
>
> sudo service docker start 하면 docker 실행되면서 daemon도 실행됨.
