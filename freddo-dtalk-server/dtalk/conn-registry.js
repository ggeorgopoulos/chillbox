var EventEmitter = require('events').EventEmitter
  , uuid = require('node-uuid');

var ConnRegistry = function() {
	if (arguments.callee._singletonInstance) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	EventEmitter.call(this);
}

ConnRegistry.prototype.__proto__ = EventEmitter.prototype;

ConnRegistry.prototype._connMap = {};

// Register anonumous server WebSocket connections...
ConnRegistry.prototype._add = function(/* WebSocket */conn) {
	this.add(uuid.v1(), conn);
}

ConnRegistry.prototype.add = function(key, /* WebSocket */conn) {
	console.log(">>> register conn: ", key);
	this._connMap[key] = conn;
	conn['__key'] = key;
	this.emit('add', key, conn);
}

ConnRegistry.prototype.remove = function(key) {
	console.log(">>> remove conn: ", key);
	var conn = this.get(key);
	if (conn) {
		delete this._connMap[key];
		this.emit('remove', key, conn);
	}
	return conn;
}

ConnRegistry.prototype.get = function(key) {
	return this._connMap[key];	
}

module.exports = new ConnRegistry();