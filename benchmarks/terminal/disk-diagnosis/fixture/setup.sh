#!/usr/bin/env bash
mkdir -p logs
echo "active log stream" > logs/app.log
head -c 100000 /dev/zero | tr '\0' 'A' > logs/debug.dump
head -c 100000 /dev/zero | tr '\0' 'B' > logs/app.log.1
head -c 100000 /dev/zero | tr '\0' 'C' > logs/app.log.2
echo "Fixture disk state initialized with 300KB of obsolete dumps"
