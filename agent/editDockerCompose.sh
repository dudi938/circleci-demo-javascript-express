#!/bin/bash
#. ./keyfile.txt
browser="$1"
numOfInstances="$2"
memorySize="$3"
echo $browser $numOfInstances $memorySize

sudo sed -i "s/@browser@/$browser/g" /opt/testim/docker-compose.yml
sudo sed -i "s/@numOfInstances@/$numOfInstances/g" /opt/testim/docker-compose.yml
sudo sed -i "s/@memorySize@/$memorySize/g" /opt/testim/docker-compose.yml
cp ./docker-compose.yml /opt/testim/
#cp /home/yossis/docker-compose.yml .
cd /opt/testim
sudo docker-compose up -d --scale $browser=$numOfInstances

