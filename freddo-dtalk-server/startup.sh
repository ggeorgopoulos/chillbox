#!/bin/sh

FREDDO_DTALK_MAC=`ifconfig eth0 | awk '/HWaddr/ {print $5}'`
export FREDDO_DTALK_MAC

while true
do
	cd /opt/freddo-dtalk-server &&
	node ./freddo-dtalk-server.js > /dev/null 2>/dev/null </dev/null
	
	# wait for 7 seconds
	sleep 7
done
