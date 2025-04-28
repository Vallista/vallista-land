---
title: Docker In Docker (DIND) 설정하기
tags:

date: 2019-05-30 16:33:52
draft: true
info: false
---

Docker in Docker를 설정하는 이유 첫 번째로 보안의 위험이 있다.

특히나, Jenkins등의 CI를 사용하는 환경에서 Jenkins가 Docker를 실행할 때, Jenkins나 Docker가 해킹당하면 서버 전체의 권한이 뚫리는거랑 마찬가지이다. 그러므로 소스코드 유출 및 사용자에게 Serve 할 때 문제가 일어나게 된다. 그러므로 Docker로 한번 더 감싸서 Docker Wrapper에 권한을 하나 더 만든다. 그 다음 Docker Wrapper의 가상 환경에 jenkins와 docker 이미지를 만들고 가상 환경의 서버에서 jenkins와 docker 인스턴스를 실행시킨다. 이렇게 되면 jenkins, docker서버가 해킹당하더라도 docker wrapper instance만 해킹이 되기 때문에 안전하다.

두 번째는 백업이다.

jenkins와 docker가 단독으로 instance로써 작동할 때 서버가 꺼지거나 하면 백업이 쉽지 않다. 하지만 docker wrapper로 감싸게 되면 백업에 용이하다.

## Docker In Docker(dind) 설정

1. [jpetazzo/dind](https://github.com/jpetazzo/dind)
2. [Jenkins를 이용한 Docker 빌드](http://seapy.com/2083)

위의 자료를 참고했다. 프로젝트에 아래의 파일들을 적용한다.

- Dockerfile

```bash
FROM jenkins:2.60.3
MAINTAINER jerome.petazzoni@docker.com

USER root

# Let's start with some basic stuff.
RUN apt-get update -qq && apt-get install -qqy \
    apt-transport-https \
    ca-certificates \
    curl \
    lxc \
    iptables \
    ca-certificates

# Install Docker from Docker Inc. repositories.
RUN curl -sSL https://get.docker.com/ | sh

# Install the magic wrapper.
ADD ./wrapdocker /usr/local/bin/wrapdocker
RUN chmod +x /usr/local/bin/wrapdocker

# Define additional metadata for our image.
VOLUME /var/lib/docker

ENV JAVA_ARGS -Xms512m -Xmx1024m

CMD ["/usr/local/bin/wrapdocker"]

ADD jenkins_dind.sh /usr/local/bin/jenkins_dind.sh
RUN chmod +x /usr/local/bin/jenkins_dind.sh

CMD ["/usr/local/bin/jenkins_dind.sh"]
```

- wrapdocker

```bash
#!/bin/bash

# Ensure that all nodes in /dev/mapper correspond to mapped devices currently loaded by the device-mapper kernel driver
dmsetup mknodes

# First, make sure that cgroups are mounted correctly.
CGROUP=/sys/fs/cgroup
: {LOG:=stdio}

[ -d $CGROUP ] ||
        mkdir $CGROUP

mountpoint -q $CGROUP ||
        mount -n -t tmpfs -o uid=0,gid=0,mode=0755 cgroup $CGROUP || {
                echo "Could not make a tmpfs mount. Did you use --privileged?"
                exit 1
        }

if [ -d /sys/kernel/security ] && ! mountpoint -q /sys/kernel/security
then
    mount -t securityfs none /sys/kernel/security || {
        echo "Could not mount /sys/kernel/security."
        echo "AppArmor detection and --privileged mode might break."
    }
fi

# Mount the cgroup hierarchies exactly as they are in the parent system.
for SUBSYS in $(cut -d: -f2 /proc/1/cgroup)
do
        [ -d $CGROUP/$SUBSYS ] || mkdir $CGROUP/$SUBSYS
        mountpoint -q $CGROUP/$SUBSYS ||
                mount -n -t cgroup -o $SUBSYS cgroup $CGROUP/$SUBSYS

        # The two following sections address a bug which manifests itself
        # by a cryptic "lxc-start: no ns_cgroup option specified" when
        # trying to start containers withina container.
        # The bug seems to appear when the cgroup hierarchies are not
        # mounted on the exact same directories in the host, and in the
        # container.

        # Named, control-less cgroups are mounted with "-o name=foo"
        # (and appear as such under /proc/<pid>/cgroup) but are usually
        # mounted on a directory named "foo" (without the "name=" prefix).
        # Systemd and OpenRC (and possibly others) both create such a
        # cgroup. To avoid the aforementioned bug, we symlink "foo" to
        # "name=foo". This shouldn't have any adverse effect.
        echo $SUBSYS | grep -q ^name= && {
                NAME=$(echo $SUBSYS | sed s/^name=//)
                ln -s $SUBSYS $CGROUP/$NAME
        }

        # Likewise, on at least one system, it has been reported that
        # systemd would mount the CPU and CPU accounting controllers
        # (respectively "cpu" and "cpuacct") with "-o cpuacct,cpu"
        # but on a directory called "cpu,cpuacct" (note the inversion
        # in the order of the groups). This tries to work around it.
        [ $SUBSYS = cpuacct,cpu ] && ln -s $SUBSYS $CGROUP/cpu,cpuacct
done

# Note: as I write those lines, the LXC userland tools cannot setup
# a "sub-container" properly if the "devices" cgroup is not in its
# own hierarchy. Let's detect this and issue a warning.
grep -q :devices: /proc/1/cgroup ||
        echo "WARNING: the 'devices' cgroup should be in its own hierarchy."
grep -qw devices /proc/1/cgroup ||
        echo "WARNING: it looks like the 'devices' cgroup is not mounted."

# Now, close extraneous file descriptors.
pushd /proc/self/fd >/dev/null
for FD in *
do
        case "$FD" in
        # Keep stdin/stdout/stderr
        [012])
                ;;
        # Nuke everything else
        *)
                eval exec "$FD>&-"
                ;;
        esac
done
popd >/dev/null


# If a pidfile is still around (for example after a container restart),
# delete it so that docker can start.
rm -rf /var/run/docker.pid

# If we were given a PORT environment variable, start as a simple daemon;
# otherwise, spawn a shell as well
if [ "$PORT" ]
then
        exec dockerd -H 0.0.0.0:$PORT -H unix:///var/run/docker.sock \
                $DOCKER_DAEMON_ARGS
else
        if [ "$LOG" == "file" ]
        then
                dockerd $DOCKER_DAEMON_ARGS &>/var/log/docker.log &
        else
                dockerd $DOCKER_DAEMON_ARGS &
        fi
        (( timeout = 60 + SECONDS ))
        until docker info >/dev/null 2>&1
        do
                if (( SECONDS >= timeout )); then
                        echo 'Timed out trying to connect to internal docker host.' >&2
                        break
                fi
                sleep 1
        done
        [[ $1 ]] && exec "$@"
        exec bash --login
fi
```

- jenkins_dind.sh

```bash
#!/bin/bash

CGROUP=/sys/fs/cgroup

[ -d $CGROUP ] ||
  mkdir $CGROUP

mountpoint -q $CGROUP ||
  mount -n -t tmpfs -o uid=0,gid=0,mode=0755 cgroup $CGROUP || {
    echo "Could not make a tmpfs mount. Did you use -privileged?"
    exit 1
  }

# Mount the cgroup hierarchies exactly as they are in the parent system.
for SUBSYS in $(cut -d: -f2 /proc/1/cgroup)
do
  [ -d $CGROUP/$SUBSYS ] || mkdir $CGROUP/$SUBSYS
  mountpoint -q $CGROUP/$SUBSYS ||
    mount -n -t cgroup -o $SUBSYS cgroup $CGROUP/$SUBSYS
done

# Now, close extraneous file descriptors.
pushd /proc/self/fd
for FD in *
do
  case "$FD" in
  # Keep stdin/stdout/stderr
  [012])
    ;;
  # Nuke everything else
  *)
    eval exec "$FD>&-"
    ;;
  esac
done
popd

docker -d &
exec /usr/bin/java -jar /usr/share/jenkins/jenkins.war
```

## 참고

1. [Node.js 웹 앱의 도커라이징 | Node.js](https://nodejs.org/ko/docs/guides/nodejs-docker-webapp/)
2. [초보를 위한 도커 안내서 - 도커란 무엇인가?](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html)
