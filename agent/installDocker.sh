#!/bin/bash

echo Begin Execution of InstallDocker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"
sudo apt-get update
sudo apt-get install docker-ce -y
export LC_ALL=C
sudo systemctl enable docker
sudo usermod -aG docker testim
sudo curl -L https://github.com/docker/compose/releases/download/1.14.0/docker-compose-`uname -s`-`uname -m` -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
sudo mkdir -p /opt/testim
#cd /opt/testim
#sudo su
echo End Execution of InstallDocker
