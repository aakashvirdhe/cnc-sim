

CWS.Motion = function () {
	this.worker = new Worker("./js/motionWorker.js");
	this.running = false;
	this.data = null;
	this.controller = null;
};

CWS.Motion.prototype.constructor = CWS.Motion;

CWS.Motion.prototype.run = function () {
	if (this.running === true)
		return;
	this.postMessage(this.data);
};

CWS.Motion.prototype.setData = function (data) {
	this.data = data;
};

CWS.Motion.prototype.postMessage = function () {
	if (this.data !== null) {
		this.running = true;
		this.worker.postMessage(this.data);
	}
	this.data = null;
};

CWS.Motion.prototype.setController = function (controller) {
	this.controller = controller;
	this.bindWorker();
};

CWS.Motion.prototype.bindWorker = function () {
	var _this = this;
	this.worker.onmessage = function (e) {
		if (e.data.error.length != 0)
			console.log(e.data.error);
		_this.controller.machine.setMotion(e.data);
		_this.controller.updateWorkpieceDraw();
		_this.running = false;

		// Notify UI
		window.dispatchEvent(new CustomEvent('simulationEnded'));
	};
}

CWS.Motion.prototype.stop = function () {
	if (this.running) {
		this.worker.terminate(); // Kill the process
		this.running = false;

		// Accessing private path - assumed same as constructor
		this.worker = new Worker("./js/motionWorker.js");
		this.bindWorker(); // Re-attach listener

		window.dispatchEvent(new CustomEvent('simulationEnded'));
	}
}