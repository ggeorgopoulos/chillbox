(function() {
	
	if (firebug) {
		firebug.env.debug = false;
	}
	
	var myCodeMirror = CodeMirror(document.getElementById('editor'), {
		mode: "text/javascript",
		styleActiveLine: true,
		lineNumbers: true
	});
	
		
	const host = location.origin.replace(/^http/, 'ws');
	
	var timeoutH;
	
	DTalk.connect(host + '/dtalksrv');
	DTalk.onopen = function() {
		//editor().setReadOnly(false);
	}
	
	DTalk.onclose = function() {
		disconnected();	
	}
	
	DTalk.onerror = function(e) {
		disconnected();	
	}
	
	execBtn().addEventListener('click', onExecBtnClicked, false);
	
	function execBtn() {
		return document.getElementById('exec-btn');	
	}

	var myWorker;
	function onExecBtnClicked() {
		//eval(editor().getValue());
		if (myWorker) {
			if(!confirm('Close running worker?')) {
				return;
			}
			myWorker.terminate();
			delete myWorker;
		}
		
		myWorker = new Worker('js/worker/bootstrap.js?ws=' + host + '/dtalksrv');
		myWorker.onmessage = function(event) {
			var e = event.data;
			
			if (e.status) {
				if (e.status === 'ready') {
					myWorker.postMessage(editor().getValue());
				} else {
					console.log('Unknown worker status: ' + e.status);
				}
			} else {
				console.log(JSON.stringify(e));
			}
		};
		myWorker.onerror = function(event) {
			console.log("Error: " + event.message);	
		};
	}
	
	function editor() {
		return myCodeMirror;
	}
	
	function disconnected() {
		if (timeoutH) {
			clearTimeout(timeoutH);
			delete timeoutH;
		}
		
		timeoutH = setTimeout(function() {
			//DTalk.connect(host + '/dtalksrv');
		}, 3333);
	}
})();
