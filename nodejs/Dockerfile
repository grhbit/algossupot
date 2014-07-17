FROM dockerfile/nodejs

ADD . /data/app
WORKDIR /data/app

RUN npm install -g grunt-cli && \
  npm install -g forever && \
  npm install -g supervisor

ENV PORT 3000

VOLUME ["/data/storage"]

# In Development
VOLUME ["/data/app"]


CMD ["/bin/bash", "/data/app/startup.sh"]

