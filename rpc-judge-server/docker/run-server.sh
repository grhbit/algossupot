#!/bin/sh

docker run -v $(pwd)/data:/data --networking=none --rm --name=sandbox sandbox
