#!/bin/sh
result=$($1/maze_tracer "$1/input.txt" "$1/output.txt")
echo $result
