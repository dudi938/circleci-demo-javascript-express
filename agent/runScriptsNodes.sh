#!/bin/bash

Browser="$1"
NumOfNodes="$2"
MemorySize="$3"

echo $Browser $NumOfNodes $MemorySize > ./myLog.txt
TOKEN="fd80d00166bda4a7e9532be3bc0d5c1e62230335"
OWNER="testimio"
REPO="grid-deploy"
BRANCH="master"
PATH_TO_FILE="https://api.github.com/repos/$OWNER/$REPO/$BRANCH/agent/"
FILE1="$PATH_TO_FILE/update-docker-grid"
FILE2="$PATH_TO_FILE/vmUpdate.sh"
FILE3="$PATH_TO_FILE/installDocker.sh"
FILE4="$PATH_TO_FILE/docker-compose.yml"
FILE5="$PATH_TO_FILE/docker.sh"
FILE6="$PATH_TO_FILE/installNewRelic.sh"
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE1
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE2
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE3
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE4
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE5
curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L $FILE6

exit
chmod +x ./vmUpdate.sh
./vmUpdate.sh

chmod +x ./installDocker.sh
./installDocker.sh

chmod +x ./installNewRelic.sh
./installNewRelic.sh

sudo sed -i "s/@Browser@/$Browser/g" ./docker-compose.yml
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./docker-compose.yml
sudo sed -i "s/@MemorySize@/$MemorySize/g" ./docker-compose.yml
cp ./docker-compose.yml /opt/testim/

chmod +x ./docker.sh
sudo sed -i "s/@Browser@/$Browser/g" ./docker.sh
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./docker.sh
sudo mv ./docker.sh /opt/testim/
if [ $1 = "chrome" ]; then
	curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L "$PATH_TO_FILE/update-ch-docker-grid.sh"
	chmod +x ./update-ch-docker-grid.sh
	sudo sed -i "s/@numOfInstances@/$NumOfNodes/g" ./update-ch-docker-grid.sh
	sudo mv ./update-ch-docker-grid.sh /opt/testim/
	ShortBrowser="ch"
	(crontab -l 2>/dev/null; echo "*/10 * * * * /opt/testim/update-ch-docker-grid.sh >> /var/log/update-ch-docker-grid.log 2>&1")| crontab -
else
        curl -H 'Authorization: token $TOKEN' -H 'Accept: application/vnd.github.v3.raw' -O -L "$PATH_TO_FILE/update-ff-docker-grid.sh"
        chmod +x ./update-ff-docker-grid.sh
        sudo sed -i "s/@numOfInstances@/$NumOfNodes/g" ./update-ff-docker-grid.sh	
	sudo mv ./update-ch-docker-grid.sh /opt/testim/
	ShortBrowser="ff"
	(crontab -l 2>/dev/null; echo "*/10 * * * * /opt/testim/update-ch-docker-grid.sh >> /var/log/update-ch-docker-grid.log 2>&1")| crontab -
fi
(crontab -l 2>/dev/null; echo "@reboot /opt/testim/docker.sh")| crontab -
sudo sed -i "s/@ShortBrowser@/$ShortBrowser/g" ./update-docker-grid
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./update-docker-grid
sudo mv ./update-docker-grid /etc/logrotate.d/
cd /opt/testim
sudo docker-compose up -d --scale $Browser=$NumOfNodes

