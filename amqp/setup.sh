#!/usr/bin/env sh

cat > /etc/rabbitmq/rabbitmq.config <<EOF
[
    {rabbit, [
        {tcp_listeners, [{"0.0.0.0", 5672}]},
        {loopback_users, []}
    ]}
].
EOF
