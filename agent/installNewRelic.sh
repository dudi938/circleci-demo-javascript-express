#!/bin/bash
echo deb http://apt.newrelic.com/debian/ newrelic non-free >> /etc/apt/sources.list.d/newrelic.list
wget -O- https://download.newrelic.com/548C16BF.gpg | apt-key add -
apt-get update
apt-get install newrelic-sysmond -y
nrsysmond-config --set license_key=2fbce04e7e1101f49c1145182f330cc138b50e8d
/etc/init.d/newrelic-sysmond start
update-rc.d newrelic-sysmond defaults

