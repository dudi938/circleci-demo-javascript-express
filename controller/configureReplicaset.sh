#!/bin/sh

IP1="$1"
IP2="$2"
IP3="$3"

TOKEN="fd80d00166bda4a7e9532be3bc0d5c1e62230335"
OWNER="testimio"
REPO="grid-deploy"
BRANCH="master"
PATH_TO_FILE="https://api.github.com/repos/$OWNER/$REPO/$BRANCH/controller/"
FILE1="$PATH_TO_FILE/initreplica.js"
FILE2="$PATH_TO_FILE/addsecondaries.js"

curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE1
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE2

sudo sed -i "s/@IpAddress1@/$IP1/g" ./initreplica.js
sudo sed -i "s/@IpAddress2@/$IP2/g" ./addsecondaries.js
sudo sed -i "s/@IpAddress3@/$IP3/g" ./addsecondaries.js
mongo < initreplica.js
sleep 5
mongo < addsecondaries.js
#mongo $IP1:27017/admin initreplica.js
