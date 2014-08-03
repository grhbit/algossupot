FROM dockerfile/ubuntu

RUN \
  apt-get install -y python python-dev && \
  apt-get install -y ruby ruby-dev ruby-bundler && \
  mkdir -p /data

ADD compile.py /opt/
ADD monitor.py /opt/

VOLUME ["/data"]

WORKDIR /data

ENTRYPOINT ["/usr/bin/env", "python"]
