#!/bin/bash

Browser="$1"
NumOfNodes="$2"
MemorySize="$3"

echo $Browser $NumOfNodes $MemorySize > ./myLog.txt

#wget -P . "https://testimstorage.blob.core.windows.net/agent/keyfile.txt"
#wget -P . "https://testimstorage.blob.core.windows.net/agent/editDockerCompose.sh"
wget -P . "https://testimstorage.blob.core.windows.net/agent/vmUpdate.sh"
wget -P . "https://testimstorage.blob.core.windows.net/agent/installDocker.sh"
wget -P . "https://testimstorage.blob.core.windows.net/agent/docker-compose.yml"
wget -P . "https://testimstorage.blob.core.windows.net/agent/docker.sh"
wget -P . "https://testimstorage.blob.core.windows.net/agent/installNewRelic.sh"
wget -P . "https://testimstorage.blob.core.windows.net/agent/update-docker-grid"
#Give execute permission to script
chmod +x ./vmUpdate.sh
#Execute script
./vmUpdate.sh

chmod +x ./installDocker.sh
./installDocker.sh

chmod +x ./installNewRelic.sh
./installNewRelic.sh
#edit docker-compose.yml ###according to parameters### should be only one section: chrome or firefox
#     a.      - GRID_MAX_SESSION – in line 6
#     b.      - JAVA_OPTS – in line 7 ther are 2 parameters: -Xms, -Xmx
#     c.      chrome:/ firefox: - lines 10/19. Leave only whats needed

#chmod +x ./editDockerCompose.sh
#./editDockerCompose.sh $Browser $NumOfNodes $MemorySize
sudo sed -i "s/@Browser@/$Browser/g" ./docker-compose.yml
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./docker-compose.yml
sudo sed -i "s/@MemorySize@/$MemorySize/g" ./docker-compose.yml
cp ./docker-compose.yml /opt/testim/
#cp /home/yossis/docker-compose.yml .
#cd /opt/testim
#sudo docker-compose up -d --scale $browser=$numOfInstances

chmod +x ./docker.sh
sudo sed -i "s/@Browser@/$Browser/g" ./docker.sh
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./docker.sh
sudo mv ./docker.sh /opt/testim/
ShortBrowser=""
if [ $1 = "chrome" ]; then
	wget -P . "https://testimstorage.blob.core.windows.net/agent/update-ch-docker-grid.sh"
	chmod +x ./update-ch-docker-grid.sh
	sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./update-ch-docker-grid.sh
	sudo mv ./update-ch-docker-grid.sh /opt/testim/
	$ShortBrowser="ch"
	sudo sed -i "s/@ShortBrowser@/$ShortBrowser/g" ./docker.sh
else
	wget -P . "https://testimstorage.blob.core.windows.net/agent/update-ff-docker-grid.sh"
        chmod +x ./update-ff-docker-grid.sh
        sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./update-ff-docker-grid.sh	
	sudo mv ./update-ch-docker-grid.sh /opt/testim/
	$ShortBrowser="ff"
fi
sudo sed -i "s/@ShortBrowser@/$ShortBrowser/g" ./update-docker-grid
sudo sed -i "s/@NumOfNodes@/$NumOfNodes/g" ./update-docker-grid
sudo mv ./update-docker-grid /etc/logrotate.d/
cd /opt/testim
sudo docker-compose up -d --scale $Browser=$NumOfNodes

