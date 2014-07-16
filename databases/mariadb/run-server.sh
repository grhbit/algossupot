#!/bin/sh

docker run -d --name=mysql -p 3300:3306 -v $(pwd)/data:/data mysql
