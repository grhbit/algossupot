#!/usr/bin/env sh

if [ -f /setup.sh ]; then
    . /setup.sh
    rm -rf /setup.sh
fi

exec rabbitmq-server
