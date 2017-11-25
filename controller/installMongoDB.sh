#!/bin/bash

#Import the public key used by the package management system.
#sudo apt-key -y adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
#Create a list file for MongoDB.
#echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
#Reload local package database.
sudo apt-get update

#Install the MongoDB packages.
#sudo apt-get install -y mongodb-org --force-yes
sudo apt-get install -y mongodb-org=3.2.17 mongodb-org-server=3.2.17 mongodb-org-shell=3.2.17 mongodb-org-mongos=3.2.17 mongodb-org-tools=3.2.17
sudo service mongod stop
sudo bash -c 'echo "replSet=csReplicaSet" >> /etc/mongod.conf'
sudo service mongod start
