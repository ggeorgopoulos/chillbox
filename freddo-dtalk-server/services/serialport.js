var hub = require('../dtalk/hub.js')
  , dtalk = require('../dtalk/dtalk-service.js')
  , api = require('./service-api.js')
  , serialPort = require('serialport2')
  , SerialPort = serialPort.SerialPort;

var name = 'dtalk.service.SerialPort';
exports.name = name;

const kINTERVAL = 3333;

var roster = {};

setTimeout(function poll() {
	serialPort.list(function(err, ports) {
			
		if (!err) {
			var _roster = {};
			
			for (var i = 0, n = ports.length; i < n; i++) {
				var port = ports[i];
				if (!roster[port.pnpId]) {
					// new port
					api.fireEvent(name, 'onattached', {
						id: port.pnpId,
						name: port.comName
					});
					
					// setup...
					setup(port); 
				}
				_roster[port.pnpId] = port;
			}
			
			for (id in roster) {
				if (!_roster[id]) {
					// detached port
					api.fireEvent(name, 'ondettached', id);
					
					// close...
					if (_roster[id] && _roster[id].conn) {
						_roster[id].conn.close();	
					}
				}
			}

			roster = _roster;
		} else {
			console.log(err);	
		}
		
		setTimeout(poll, kINTERVAL);
	});
}, kINTERVAL);

function setup(port) {
	var conn = new SerialPort(port.comName, { 
		baudrate: 9600,
		dataBits: 8,
		parity: 'none',
		stopBits: 1,
		flowControl: false,
		bufferSize: 1
  	});
	conn.open(function(err) {
		if (err) {
			console.log('failed to open: '+err);
		} else {
			console.log('open');
			var line;
			conn.on('data', function(data) {
				//console.log('data received: ' + data);
				
				if (data == '\n' || data == '\r') {
					if (line) {
						try {
							process(conn, JSON.parse(line));
						} catch(e) {
							console.log('Error: ' + e);	
						}
					}
					line = "";
				} else {
					line += data;
				}
			});
			/*
			conn.write('Hello, World\n', function(err, results) {
				console.log('err ' + err);
				console.log('results ' + results);
			});
			*/
		}
	});
	port['conn'] = conn;
}

function process(conn, evt) {
	
	if ('register' === evt.action) {
		
		var serviceName = evt.params;
		if (serviceName) {

			// TODO:
			// avoid double entries from the same connection
			
			var service = function(e) {
				
				// clone the JSON message
				var json = {
					id: e.id,
					from: e.from,
					action: e.action,
					params: e.params
				};
				
				try {
					conn.write(JSON.stringify(json) + '\n');
				} catch(err) {
					console.log(err);
				}
			};
			
			hub.on(serviceName, service);
			
			// send response...
			conn.write(JSON.stringify({
				result: true
			}) + '\n');
		}
		
	} else {
		
		if (evt.service) {
			evt.dtalk = '1.0';
			hub.emit(evt.service, evt);
		}
		
	}
}

exports.get_ports = function(request) {
	SerialPort.list(function(err, ports) {
		if (!err) {
			var result = [];
			for (var i = 0, n = ports.length; i < n; i++) {
				var port = ports[i];
				result.push({
					id: port.pnpId,
					name: port.comName
				});
			}
			api.sendResponse(request, ports);
		} else {
			api.sendErrorResponse(request, dtalk.kINTERNAL_ERROR, ''+err);
		}
	});
}
