FROM dockerfile/ubuntu

RUN \
  add-apt-repository -y ppa:nginx/stable && \
  apt-get update && \
  apt-get install -y nginx && \
  apt-get install -y supervisor

RUN \
  mkdir -p /etc/nginx/log.d && \
  touch /opt/firstrun

ADD nginx /etc/nginx
ADD startup.sh /opt/startup.sh

VOLUME ["/etc/nginx", "/etc/nginx/log.d"]

WORKDIR /etc/nginx

CMD ["/bin/bash", "/opt/startup.sh"]

EXPOSE 80
EXPOSE 443
