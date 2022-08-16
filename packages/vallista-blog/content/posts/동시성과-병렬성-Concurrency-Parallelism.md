---
title: 동시성과 병렬성 (Concurrency & Parallelism)
tags:

date: 2019-12-28 16:42:00
draft: false
info: false
---

![이미지1](https://i0.wp.com/gaegul.kr/wordpress/wp-content/uploads/1/cfile29.uf.2529523E532F23481C8D5B.jpg)

비동기 작업을 할 때 `Concurrency`와 `Parallelism`에 대한 이야기가 자주오고 갑니다. 주로 비동기 작업을 처리하는데 있어 이 두 가지 방법 중 하나를 사용하기 때문이며 구현을 할 때 컴파일러, OS, 소프트웨어등 어느 관점에서든 이 구현 방법은 유효합니다.

하지만 이 두 개의 단어는 비슷하지만서도 완전 다른 방법을 취하고 있으며, `Concurrency`와 `Parallelism`의 차이에 대해서 쉽게 이해를 하기위해 제가 내린 쉬운 정의는 아래와 같습니다.

1. `Concurrency`는 한번에 많은 것을 처리하지만 `Parallelism`은 한번에 많은 일을 처리한다.
2. `Concurrency`는 소프트웨어의 성질이고 `Parallelism`은 하드웨어의 성질이다.

그렇다면 위의 단어를 정의했으니 자세하게 알아봐야 하겠습니다.

## Thread와 Process

Concurrency와 Parallelism을 알아보기 이전에, Thread와 Process의 차이를 알아보도록 합시다.

Thread는 Thread끼리 공통된 컴퓨터 자원을 공유하지만, Process는 독립적으로 OS에 할당 받아 사용됩니다. 일반적으로 애플리케이션 하나에 한 Process가 추가되며 해당 Process는 OS에서 컴퓨터 자원을 할당받습니다.

Process는 할당받은 자원을 효율적으로 컨트롤하기 위해 여러개의 Thread를 생성하여 병렬적으로 작업을 합니다. 이런 작업에 대해 해당 자원을 최대한 효율적으로 작업하도록 프로그래밍 하는 게 **Multi-Thread Programming** 힙니다.

일반적인 프로그래밍언어에서 Parallelism으로 일컫는 대표적인 예가 바로 Thread인데요, Thread는 OS로부터 할당받은 프로세스에서 작업을 **병렬적**으로 처리하기 위해서 사용하므로 말 그대로 하드웨어 레벨에서 각자 평행적으로 실행이 됩니다. 그렇기 때문에 매우 효율적으로 작업할 수 있습니다.

### Thread

위에서 간단하게 언급했지만, Thread는 넓게 이야기를 하면 **실행되는 흐름의 단위**라고 볼 수 있습니다. 일반적으로 한 프로그램은 하나의 **실행되는 흐름**이 존재하지만, 이 흐름이 여러개 있다면 **Multi-Thread-Programming**이라고 할 수 있습니다.

Thread는 지원하는 주체에 따라서 두 가지로 분류 될 수 있습니다.

- 사용자 레벨 쓰레드 (User-Level Thread)

  사용자 쓰레드는 커널 영역의 상위, 어플리케이션 레이어에서 사용자가 구현한 라이브러리나 구현체로 제공되는 걸 일컫습니다.

  동일한 메모리 영역에서 쓰레드가 생성 및 관리 되므로 속도가 빠르다는 장점이 있습니다. 하지만 여러개의 쓰레드가 작업될 때 하나의 쓰레드가 종료되면 모든 쓰레드도 중단되는 단점이 있습니다.

  그 이유는, 커널에서 내부 쓰레드에 대해서 인지하지 못하여 해당 프로세스를 제거했기 때문입니다.

- 커널 레벨 쓰레드 (Kernel-Level Thread)

  커널 레벨 쓰레드는 운영체제가 지원하는 쓰레드 기능으로 제공됩니다. 운영체제에서 제공하는 만큼, 한 쓰레드가 중단되어도 중단이 되지 않습니다. 하지만 OS 단위에서 IO를 하는 만큼, 생성 및 관리 측면에서 리소스가 비쌉니다.

### Process

Process는 컴퓨터에서 연속적으로 실행되고 있는 **컴퓨터 프로그램**을 뜻합니다. Windows 운영체제에서 보면, Task(작업)이라는 의미로도 사용이 되는데요, 동일한 단어로 쓰이고 있습니다. 이 Process를 여러개 들고 있어, 현재 상황을 보여주는게 **Scheduling(스케쥴링)** 입니다.

여러개의 Processor(Process의 인칭화)를 사용하는 걸 **Multi-processing**이라고 하며 같은 시간에 여러 개의 프로그램을 띄우는 방식을 **시분할 방식**이라고 합니다. 이 시분할 방식을 OS 적인 이름으로 변경한 게 **Multi-Tasking** 입니다.

이 프로세스 관리가 바로 운영 체제의 중요한 부분입니다.

## Parallelism

애플리케이션에서 작업을 여러 CPU에서 동시에 병렬로 작업할 수 있는 Process 단위로 분할합니다. 여러 개의 쓰레드가 있으면 데이터 및 리소스 측면에서 서로 독립적으로 유사한 작업을 처리할 수 있습니다.

## Concurrency

그렇다면 Concurrency란 무엇일까요?

Concurrency란 Parallelism의 어려움을 쉽게 풀어내기위해 소프트웨어적인 설계로 단계를 하락시킨 행위라고 보면 됩니다.

애플리케이션이 동시에 두 가지 이상의 일을 한다고 가정해봅시다. 컴퓨터에 하나의 CPU만 있다면, 두 개 이상의 작업이 한번에 이루어지진 않지만, 한 개를 끝내고 다음 한 개를 끝낸다는 뜻이 아닌 한 개를 일정량 처리하고 다음 일을 처리하는 방식으로 일을 진행한다는 의미입니다.

<br/>

![이미지1](https://miro.medium.com/max/1648/1*Q_UZeToStz8YY2oQGiUPqw.png)

<br/>

## 참조

- [Don’t be confused between Concurrency and Parallelism](https://medium.com/from-the-scratch/dont-be-confused-between-concurrency-and-parallelism-eac8e703943a)
- [Concurrent Computing](https://en.wikipedia.org/wiki/Concurrent_computing)
- [Concurrency (Computer Science)](<https://en.wikipedia.org/wiki/Concurrency_(computer_science)>)
- [Parallel Computing](https://en.wikipedia.org/wiki/Parallel_computing)
