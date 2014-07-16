#/bin/bash

if [ ! -f /data/ibdata1 ]; then

    mysql_install_db

    /usr/bin/mysqld_safe &
    sleep 10s

    echo "GRANT ALL ON *.* TO admin@'%' IDENTIFIED BY 'password' WITH GRANT OPTION; FLUSH PRIVILEGES" | mysql
    echo "source /opt/init.sql" | mysql

    killall mysqld
    sleep 10s
fi

/usr/bin/mysqld_safe
