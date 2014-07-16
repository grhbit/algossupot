#!/bin/sh

docker run -d --name=nginx --link=webapp:webapp -p 80:80 nginx
