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
						service[getter].call(service, e);	
					}
					break;
				case 'set':
					var properties = e.params;
					for (var p in properties) {
						var setter = 'set_' + p;
						if (setter in service) {
							service[setter].call(service, properties[p]);	
						}
					}
					break;
				default:
					var method = 'do_' + e.action;
					if (method in service) {
						service[method].call(service, e);	
					}
					break;
				}
			}
		});
	}
};

exports.register = register;