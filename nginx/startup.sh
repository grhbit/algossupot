#!/bin/bash

if [ -f /opt/firstrun ]; then
    sed -i "s/<webapp-addr>/${WEBAPP_PORT_3000_TCP_ADDR}/" nginx.conf
    sed -i "s/<webapp-port>/${WEBAPP_PORT_3000_TCP_PORT}/" nginx.conf

    rm /opt/firstrun
fi

nginx
