#!/bin/sh

# Development
docker run --name=webapp -d -v $(pwd):/data/app --link=redis:session --link=mysql:db -p 3000:3000 webapp
