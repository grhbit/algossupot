FROM dockerfile/mariadb

ADD ./mariadb.cnf /etc/mysql/conf.d/mariadb.cnf
ADD ./init.sql /opt/init.sql
ADD ./startup.sh /opt/startup.sh

CMD ["/bin/bash", "/opt/startup.sh"]
