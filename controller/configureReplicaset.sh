#!/bin/sh

IP1="$1"
IP2="$2"
IP3="$3"
wget -P . "https://testimstorage.blob.core.windows.net/controller/initreplica.js"
sudo sed -i "s/@IpAddress1@/$IP1/g" ./initreplica.js
sudo sed -i "s/@IpAddress2@/$IP2/g" ./initreplica.js
sudo sed -i "s/@IpAddress3@/$IP3/g" ./initreplica.js

mongo $IP1:27017/admin initreplica.js
