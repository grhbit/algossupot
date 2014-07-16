FROM dockerfile/nodejs

ADD . /data/app
WORKDIR /data/app

RUN npm install && \
  npm install -g grunt-cli && \
  npm install -g forever && \
  npm install -g supervisor

ENV PORT 3000

# In Development
VOLUME ["/data/app"]
CMD ["supervisor", "/data/app/server.js"]

# In Production
#CMD ["forever", "/data/app/server.js"]
