#!/bin/bash

TOKEN="fd80d00166bda4a7e9532be3bc0d5c1e62230335"
OWNER="testimio"
REPO="grid-deploy"
BRANCH="master"
PATH_TO_FILE="https://api.github.com/repos/$OWNER/$REPO/$BRANCH/controller/"
FILE1="$PATH_TO_FILE/installJava8.sh"
FILE2="$PATH_TO_FILE/installGridRouter.sh"
FILE3="$PATH_TO_FILE/installMongoDB.sh"
FILE4="$PATH_TO_FILE/selenograph-deb.war"
FILE5="$PATH_TO_FILE/configureReplicaset.sh"
FILE6="$PATH_TO_FILE/camelot-default.properties"
FILE7="$PATH_TO_FILE/editCamelotProperties.sh"

curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE1
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE2
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE3
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE4
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE5
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE6
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE7
wget -P . "https://selasa.blob.core.windows.net/controller/test.xml"


chmod +x ./configureReplicaset.sh
chmod 777 ./configureReplicaset.sh
sudo mv ./configureReplicaset.sh /home/testim/configureReplicaset.sh

chmod +x ./editCamelotProperties.sh
chmod 777 ./editCamelotProperties.sh
sudo mv ./editCamelotProperties.sh /home/testim/editCamelotProperties.sh


chmod +x ./installJava8.sh
./installJava8.sh

chmod +x ./installGridRouter.sh
./installGridRouter.sh

chmod +x ./installMongoDB.sh
./installMongoDB.sh

sudo rm /usr/share/grid-router/grid-router-deb.war
sudo mv ./selenograph-deb.war /usr/share/grid-router/selenograph-deb.war

chmod 777 ./camelot-default.properties
sudo mv ./camelot-default.properties /home/testim/camelot-default.properties

sudo rm /etc/grid-router/quota/test.xml
sudo mv ./test.xml /etc/grid-router/quota/test.xml
sudo service yandex-selenograph restart
sudo service mongod restart
