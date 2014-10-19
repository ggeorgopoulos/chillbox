var dtalk = require('../dtalk/dtalk-service.js')
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
		flowControl: false
  	});
	conn.open(function(err) {
		if (err) {
			console.log('failed to open: '+err);
		} else {
			console.log('open');
			conn.on('data', function(data) {
				console.log('data received: ' + data);		
			});
			conn.write('Hello, World\n', function(err, results) {
				console.log('err ' + err);
				console.log('results ' + results);
			});
		}
	});
	port['conn'] = conn;
}

//encoding: ascii utf8 utf16le ucs2 base64 binary hex
//More: http://nodejs.org/api/buffer.html#buffer_buffer
function readline(delimiter, encoding) {
	if (typeof delimiter === "undefined" || delimiter === null) { delimiter = "\r"; }
	if (typeof encoding === "undefined" || encoding === null) { encoding = "utf8"; }
	
	
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
