FROM dockerfile/ubuntu

RUN echo "deb http://www.rabbitmq.com/debian/ testing main" >> /etc/apt/sources.list
RUN wget http://www.rabbitmq.com/rabbitmq-signing-key-public.asc
RUN apt-key add rabbitmq-signing-key-public.asc
RUN rm rabbitmq-signing-key-public.asc
RUN apt-get update
RUN apt-get install -y rabbitmq-server

ADD startup.sh /startup.sh
ADD setup.sh /setup.sh

RUN chmod +x /startup.sh /setup.sh

ENTRYPOINT ["/startup.sh"]
# ENTRYPOINT ["/usr/bin/env"]
