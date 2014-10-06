var dtalk = require('../dtalk/dtalk-service.js')
  , api = require('./service-api.js');
  
exports.name = 'dtalk.service.Presence';
  
exports.get_roster = function(request) {
	var result = [];
	var services = dtalk.getServices();
	for (var name in services) {
		var service = services[name];
		var _service = service.txtRecord;
		_service['name'] = service.name;
		_service['host'] = service.host;
		_service['port'] = service.port;
		result.push(_service);
	}
	api.sendResponse(request, result);
};