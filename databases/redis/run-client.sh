#!/bin/sh

TAG="redis"

CONTAINER_ID=$(docker ps | grep $TAG | awk '{print $1}')

IP=$(docker inspect $CONTAINER_ID | python -c 'import json,sys;obj=json.load(sys.stdin);print obj[0]["NetworkSettings"]["IPAddress"]')

redis-cli -h $IP
