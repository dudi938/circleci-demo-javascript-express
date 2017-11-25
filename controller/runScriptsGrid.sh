#!/bin/bash

#wget -P . "https://testimstorage.blob.core.windows.net/controller/test.xml"
wget -P . "https://testimstorage.blob.core.windows.net/controller/installJava8.sh"
wget -P . "https://testimstorage.blob.core.windows.net/controller/installGridRouter.sh"
wget -P . "https://testimstorage.blob.core.windows.net/controller/test.xml"
wget -P . "https://testimstorage.blob.core.windows.net/controller/installMongoDB.sh"
wget -P . "https://testimstorage.blob.core.windows.net/controller/selenograph-deb.war"


#Give execute permission to script
chmod +x ./installJava8.sh
#Execute script
./installJava8.sh

chmod +x ./installGridRouter.sh
./installGridRouter.sh

chmod +x ./installMongoDB.sh
./installMongoDB.sh

sudo mv ./selenograph-deb.war /etc/grid-router/quota/selenograph-deb.war
sudo rm /etc/grid-router/quota/test.xml
sudo mv ./test.xml /etc/grid-router/quota/test.xml
sudo service yandex-grid-router restart
sudo service mongod start
