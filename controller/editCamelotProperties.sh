#!/bin/bash
IP1="$1"
IP2="$2"
IP3="$3"

sudo sed -i s/@IpAddress1@/$IP1/g ./camelot-default.properties
sudo sed -i s/@IpAddress2@/$IP2/g ./camelot-default.properties
sudo sed -i s/@IpAddress3@/$IP3/g ./camelot-default.properties
sudo mv ./camelot-default.properties /etc/grid-router/camelot-default.properties
sudo service yandex-selenograph restart
