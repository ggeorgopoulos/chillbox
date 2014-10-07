var DTalkService = require('./dtalk/dtalk-service.js')
  , services = require('./services/services.js')
  , presence = require('./services/presence.js')
  , gpio = require('./services/gpio.js')
  , uuid = require('node-uuid')
  , os = require('os');

var port = process.env.FREDDO_DTALK_PORT || 8840;
var name = process.env.FREDDO_DTALK_NAME || os.hostname();
var mac  = process.env.FREDDO_DTALK_MAC  || uuid.v1();
mac = mac.split(':').join('');

DTalkService.start({ 
	name: name + '@' + mac, 
	port: port, 
	dtype: 'RaspberryPi/1;',
	www: __dirname + '/www/'
});

// services
services.register(presence);
services.register(gpio);

// start service manager...
services.start();
