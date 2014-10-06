var EventEmitter = require('events').EventEmitter;

var Hub = function() {
	if (arguments.callee._singletonInstance) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	EventEmitter.call(this);
}

Hub.prototype.__proto__ = EventEmitter.prototype;

module.exports = new Hub();
