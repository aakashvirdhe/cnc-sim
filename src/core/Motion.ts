
export class Motion {
    worker: Worker;
    running: boolean;
    data: any;
    controller: any;

    constructor() {
        // Warning: This assumes the worker file is accessible at this URL.
        // In a Vite app, public/js maps to root, so this should work.
        this.worker = new Worker("./js/motionWorker.js");
        this.running = false;
        this.data = null;
        this.controller = null;
        this.bindWorker();
    }

    run() {
        if (this.running === true)
            return;
        this.postMessage();
    }

    setData(data: any) {
        this.data = data;
    }

    postMessage() {
        if (this.data !== null) {
            this.running = true;
            this.worker.postMessage(this.data);
        }
        this.data = null;
    }

    setController(controller: any) {
        this.controller = controller;
        // Re-bind worker because setController might be called late? 
        // In original code bindWorker was called here.
        // But bindWorker uses logic dependent on this.controller, so yes.
        this.bindWorker();
    }

    bindWorker() {
        const _this = this;
        this.worker.onmessage = function (e) {
            if (e.data.error && e.data.error.length != 0)
                console.log(e.data.error);

            if (_this.controller) {
                _this.controller.machine.setMotion(e.data);
                _this.controller.updateWorkpieceDraw();
                _this.running = false;
            }

            // Notify UI
            window.dispatchEvent(new CustomEvent('simulationEnded'));
        };
    }

    stop() {
        if (this.running) {
            this.worker.terminate(); // Kill the process
            this.running = false;

            // Re-create worker
            this.worker = new Worker("./js/motionWorker.js");
            this.bindWorker(); // Re-attach listener

            window.dispatchEvent(new CustomEvent('simulationEnded'));
        }
    }
}
