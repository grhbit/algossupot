#!/bin/bash

if [ ! -f /data/app/node_modules ]; then
    pushd /data/app
    npm install
    popd
fi

supervisor "/data/app/server.js"

# In Production
# forever "/data/app/server.js"
