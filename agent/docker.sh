#!/bin/bash

cd /opt/testim
docker-compose up -d --scale @Browser@=@NumOfNodes@



