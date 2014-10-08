(function() {
		
	const host = location.origin.replace(/^http/, 'ws');
	
	var appViewRegH, timeoutH;
	
	DTalk.connect(host + '/dtalksrv');
	DTalk.onopen = function() {
		// Register services...
		appViewRegH = DTalk.registerService(AppView);
	}
	
	DTalk.onclose = function() {
		alert('close');
		disconnected();
	}
	
	DTalk.onerror = function() {
		alert('error');
		disconnected();
	}
	
	function disconnected() {
		if (appViewRegH) {
			appViewRegH.remove();
			delete appViewRegH;
		}
		
		if (timeoutH) {
			clearTimeout(timeoutH);
			delete timeoutH;
		}
		
		setTimeout(function() {
			//DTalk.connect(host + '/dtalksrv');
		}, 3333);
	}
})();