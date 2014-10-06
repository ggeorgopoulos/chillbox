var hub = require('../dtalk/hub.js')
  , dtalk = require('../dtalk/dtalk-service.js')
  , api = require('./service-api.js');
  
var services = [];

var running = false;
exports.start = function() {
	
	if (running) {
		return;
	}
	
	running = true;
	
	var _api = api;
	register({
		name: 'dtalk.Services',
		
		get_services: function(request) {
			var result = [];
			for(var i = 0, n = services.length; i < n; i++) {
				var s = services[i];
				result.push({ name: s.name });
			}
			_api.sendResponse(request, result);
		}
	});
};

function register(service) {
	if (service && service.name) {
		services.push(service);
		
		hub.on(service.name, function(e) {
			if (e && e.action) {
				var action = e.action;
				console.log('action', action);
				switch(action) {
				case 'get':
					var getter = 'get_' + e.params;
					if (getter in service) {
						try {
							service[getter].call(service, e);
						} catch(e) {
							api.sendErrorResponse(e,  dtalk.kINTERNAL_ERROR, e);
						}
					} else {
						api.sendErrorResponse(e, dtalk.kINVALID_REQUEST, 'The property is not available');	
					}
					break;
				case 'set':
					var properties = e.params;
					for (var p in properties) {
						var setter = 'set_' + p;
						if (setter in service) {
							try {
								service[setter].call(service, properties[p]);
							} catch(e) {
								console.log(e);	
							}
						}
					}
					// NOTE: 'set' does not return errors
					break;
				default:
					var method = 'do_' + e.action;
					if (method in service) {
						try {
							service[method].call(service, e);
						} catch(e) {
							api.sendErrorResponse(e,  dtalk.kINTERNAL_ERROR, e);
						}
					} else {
						api.sendErrorResponse(e, dtalk.kACTION_NOT_FOUND, 'The action is not available');	
					}
					break;
				}
			}
		});
	}
};

exports.register = register;