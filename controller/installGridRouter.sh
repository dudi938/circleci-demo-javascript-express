#!/bin/bash

#Install Grid router
#sudo add-apt-repository -y ppa:yandex-qatools/gridrouter
#sudo apt-get update
#sudo apt-get install -y yandex-grid-router
#sudo service yandex-grid-router start
sudo add-apt-repository -y ppa:yandex-qatools/selenograph
sudo apt-get update
sudo apt-get install -y yandex-selenograph
sudo service yandex-selenograph start
