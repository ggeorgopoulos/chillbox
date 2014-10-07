#!/bin/sh

FREDDO_DTALK_MAC=`ifconfig eth0 | awk '/HWaddr/ {print $5}'`
export FREDDO_DTALK_MAC

cd /opt/freddo-dtalk-server &&
node ./freddo-dtalk-server.js
