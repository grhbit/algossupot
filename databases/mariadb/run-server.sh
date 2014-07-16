#!/bin/sh

docker run -d --name=mariadb -p 3300:3306 -v $(pwd)/data:/data mariadb
