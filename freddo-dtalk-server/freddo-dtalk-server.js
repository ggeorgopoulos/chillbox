var DTalkService = require('./dtalk/dtalk-service.js')
  , services = require('./services/services.js')
  , presence = require('./services/presence.js')
  , uuid = require('node-uuid')
  , os = require('os');

var port = process.env.FREDDO_DTALK_PORT || 8840;
var name = process.env.FREDDO_DTALK_NAME || os.hostname();
DTalkService.start({ name: name + '@' + uuid.v1(), port: port, dtype: 'RaspberryPi/1;' });

// services
services.register(presence);

// start service manager...
services.start();