
// Declare THREE global
declare const THREE: any;

export interface RendererOptions {
    width?: number;
    height?: number;
    displayWireframe?: boolean;
}

export class Renderer {
    displayWireframe: boolean;
    renderer: any;
    scene: any;
    width: number;
    height: number;
    camera: any;
    [key: string]: any; // Allow dynamic property access for meshes

    constructor(id: string, options: RendererOptions = {}) {
        this.displayWireframe = options.displayWireframe === undefined ? true : options.displayWireframe;

        this.renderer = new THREE.WebGLRenderer({ clearColor: 0xffffff, antialias: true });
        this.renderer.autoClear = true;
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (id) {
            this.renderer.domElement.id = id;
        }
        this.renderer.domElement.style['z-index'] = 41;

        this.scene = new THREE.Scene();

        const ambientLight = new THREE.AmbientLight(0x000000);
        this.scene.add(ambientLight);

        const lights = [];
        lights[0] = new THREE.PointLight(0xffffff, 1, 0);
        lights[1] = new THREE.PointLight(0xffffff, 1, 0);
        lights[2] = new THREE.PointLight(0xffffff, 1, 0);

        lights[0].position.set(0, 200, 0);
        lights[1].position.set(100, 200, 100);
        lights[2].position.set(-100, -200, -100);

        this.scene.add(lights[0]);
        this.scene.add(lights[1]);
        this.scene.add(lights[2]);

        this.width = options.width || 512;
        this.height = options.height || 512;

        this.camera = new THREE.PerspectiveCamera(20, this.width / this.height, 0.1, 2000);
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 100;
        this.camera.lookAt(this.scene.position);
    }

    get domElement() {
        return this.renderer.domElement;
    }
    set domElement(val) {
        this.renderer.domElement = val;
    }

    lookAtLathe(dimensions: { x: number; y: number }) {
        const fov = 20;
        const distance = dimensions.y / 2 / Math.tan((fov / 2) * (Math.PI / 180));
        const cameraPosition = new THREE.Vector3(0, 0, distance);
        this.camera.position.copy(cameraPosition);
        this.camera.far = 20 * Math.max(dimensions.x, dimensions.y);
        this.camera.near = 0.05 * Math.max(dimensions.x, dimensions.y);
        this.camera.updateProjectionMatrix();
    }

    lookAtMill(dimensions: { x: number; y: number }) {
        const fov = 20;
        const distance = Math.max(dimensions.x, dimensions.y) / 2 / Math.tan((fov / 2) * (Math.PI / 180));
        const cameraPosition = new THREE.Vector3(0, 0, distance);
        this.camera.position.copy(cameraPosition);
        this.camera.far = 20 * Math.max(dimensions.x, dimensions.y);
        this.camera.near = 0.05 * Math.max(dimensions.x, dimensions.y);
        this.camera.updateProjectionMatrix();
    }

    lookAt3DPrinter(center: { z: number }, radius: number) {
        if (!center || !radius)
            return;

        const distance = (center.z + radius) / 2 / Math.tan((20 / 2) * (Math.PI / 180));
        const cameraPosition = new THREE.Vector3(0, 0, distance);
        this.camera.position.copy(cameraPosition);
        this.camera.far = 2000;
        this.camera.near = 1;
        this.camera.updateProjectionMatrix();
    }

    setCamera(camera: string) {
        if (camera === "Perspective")
            this.camera.toPerspective();
        else if (camera === "Orthographic")
            this.camera.toOrthographic();
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    removeMesh(meshName: string) {
        if (meshName !== undefined) {
            const mesh = this.scene.getObjectByName(meshName);
            if (mesh)
                this.scene.remove(mesh);
        }
    }

    render(controls?: any) {
        if (this['2DWorkpiece'] && this['2DWorkpiece'].animation) {
            this['2DWorkpiece'].animation.next()
        }
        if (this['3DWorkpiece'] && this['3DWorkpiece'].animation) {
            this['3DWorkpiece'].animation.next();
        }
        this.renderer.render(this.scene, this.camera);
    }

    animate(b: boolean, meshName: string) {
        if (this[meshName] && this[meshName].animation)
            this[meshName].animation.touggleAnimation();
    }

    addMesh(meshName: string, mesh: any) {
        const meshTemp = this.scene.getObjectByName(meshName);
        if (meshTemp) {
            this.scene.remove(meshTemp);
            this[meshName] = undefined;
        }
        if (mesh.geometry !== undefined) {
            mesh.name = meshName;
            if (mesh instanceof THREE.BufferGeometry)
                mesh.geometry.setDrawRange(0, Infinity);
            this[meshName] = mesh;
            this.scene.add(mesh);
        }
    }
}
