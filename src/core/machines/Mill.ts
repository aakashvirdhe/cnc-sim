
import { Machine, type MachineOptions } from './Machine';
import { SHADERS } from '../graphics/Shaders';

declare const THREE: any;

export class Mill extends Machine {
    tool: any;
    canvas: any;
    gl: any;
    debug: boolean;
    mtype: string;
    shaderProgram1: any;
    shaderProgram2: any;
    renderDimensions: any;
    pixels1: Uint8Array;
    pixels2: Uint8Array;
    linesVertexPositionBuffer: any;
    texcoordBuffer: any;

    constructor(options: MachineOptions = {}) {
        super(options);

        this.tool = this.machine.tool;
        this.canvas = null;
        this.gl = null;
        this.debug = false;
        this.mtype = "Mill";

        // Initializers
        this.setRendererResolution(this.renderResolution); // Initialize buffers
        this.initWebGL();
        this.initGeometry2D();
        this.initGeometry3D();
        this.create2DWorkpieceLimits();
    }

    initWebGL() {
        // For 3D drawing
        this.canvas = document.createElement('canvas');
        this.canvas.style.zIndex = "1000000000";
        this.canvas.style.position = "absolute";
        this.canvas.style.background = "#f0f0f0";
        if (this.debug)
            document.body.appendChild(this.canvas); // For debugging

        const attributes = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
        };
        this.gl = this.canvas.getContext('webgl', attributes) || this.canvas.getContext('experimental-webgl', attributes);
        if (this.gl === null)
            throw 'Error creating WebGL context.';
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.gl.clearDepth(1.0);                 // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST);      // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);       // Near things obscure far things

        this.shaderProgram1 = this.createProgram(this.gl, SHADERS["vs-mill-1-3D"], SHADERS["fs-mill-1-3D"]);
        this.gl.useProgram(this.shaderProgram1);
        this.shaderProgram1.dimensions = this.gl.getUniformLocation(this.shaderProgram1, "dimensions");
        this.shaderProgram1.resolution = this.gl.getUniformLocation(this.shaderProgram1, "resolution");
        this.shaderProgram1.currentDimension = this.gl.getUniformLocation(this.shaderProgram1, "currentDimension");
        this.shaderProgram1.toolRadius = this.gl.getUniformLocation(this.shaderProgram1, "toolRadius");
        this.shaderProgram1.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram1, "position");

        this.shaderProgram2 = this.createProgram(this.gl, SHADERS["vs-mill-2-3D"], SHADERS["fs-mill-2-3D"]);
        this.gl.useProgram(this.shaderProgram2);
        this.shaderProgram2.dimensions = this.gl.getUniformLocation(this.shaderProgram2, "dimensions");
        this.shaderProgram2.currentDimension = this.gl.getUniformLocation(this.shaderProgram2, "currentDimension");
        this.shaderProgram2.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram2, "position");
        this.shaderProgram2.texcoordAttribute = this.gl.getAttribLocation(this.shaderProgram2, "texcoord");

        // this.setRendererResolution(); // Already called in constructor, but canvas/gl props need updates?
        // Actually setRendererResolution sets canvas.width/height and viewports using gl context. 
        // So we should call it again here since gl is now available.
        this.setRendererResolution(this.renderResolution);

        this.gl.lineWidth(1);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }

    initGeometry3D() {
        this.material3D.shading = THREE.FlatShading;
        const tempDim = Math.max(this.workpiece.x, this.workpiece.y) + this.tool.radius * 2;
        this.renderDimensions = new THREE.Vector3(tempDim, tempDim, this.workpiece.z);
        const minX = Math.round(this.tool.radius * this.renderResolution / this.renderDimensions.x);
        const minY = Math.round(this.tool.radius * this.renderResolution / this.renderDimensions.y);
        const maxX = Math.round((parseFloat(this.workpiece.x) + this.tool.radius) * this.renderResolution / this.renderDimensions.x);
        const maxY = Math.round((parseFloat(this.workpiece.y) + this.tool.radius) * this.renderResolution / this.renderDimensions.y);

        const geometry = new THREE.PlaneBufferGeometry(this.workpiece.x, this.workpiece.y,
            maxX - minX + 1, maxY - minY + 1);
        geometry.dim = { x: maxX - minX + 2, y: maxY - minY + 2 };
        geometry.dynamic = true; // Legacy property, mostly ignored in newer Three.js but kept for logic
        if (geometry.attributes.normal === undefined) {
            geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.array.length), 3));
        }
        // geometry.attributes.position.dynamic = true; // Legacy
        // geometry.attributes.normal.dynamic = true; // Legacy
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 99999);

        const positions = geometry.attributes.position.array;

        // var xDist = this.renderDimensions.x/65535.0; // Unused in this function
        // var yDist = this.renderDimensions.y/65535.0;
        // var zDist = this.renderDimensions.z/65535.0;
        const rowSize = (maxX - minX + 2);

        let yi = 0;
        for (let xi = 0; xi < (maxX - minX + 2); xi++) {
            const arrayPos2 = (yi * rowSize + xi) * 3;
            positions[arrayPos2 + 0] = (xi / (xi + 2) * xi) / (this.renderResolution - 1) * this.renderDimensions.x;
            positions[arrayPos2 + 1] = (yi / (yi + 2) * yi) / (this.renderResolution - 1) * this.renderDimensions.y;
            positions[arrayPos2 + 2] = 0;
        }
        yi = maxY - minY + 1;
        for (let xi = 0; xi < (maxX - minX + 2); xi++) {
            const arrayPos2 = (yi * rowSize + xi) * 3;
            positions[arrayPos2 + 0] = (xi / (xi + 2) * xi) / (this.renderResolution - 1) * this.renderDimensions.x;
            positions[arrayPos2 + 1] = (yi / (yi + 2) * yi) / (this.renderResolution - 1) * this.renderDimensions.y;
            positions[arrayPos2 + 2] = 0;
        }
        let xi = 0;
        for (let yi = 0; yi < (maxY - minY + 2); yi++) {
            const arrayPos2 = (yi * rowSize + xi) * 3;
            positions[arrayPos2 + 0] = (xi / (xi + 2) * xi) / (this.renderResolution - 1) * this.renderDimensions.x;
            positions[arrayPos2 + 1] = (yi / (yi + 2) * yi) / (this.renderResolution - 1) * this.renderDimensions.y;
            positions[arrayPos2 + 2] = 0;
        }
        xi = maxX - minX + 1;
        for (let yi = 0; yi < (maxY - minY + 2); yi++) {
            const arrayPos2 = (yi * rowSize + xi) * 3;
            positions[arrayPos2 + 0] = (xi / (xi + 2) * xi) / (this.renderResolution - 1) * this.renderDimensions.x;
            positions[arrayPos2 + 1] = (yi / (yi + 2) * yi) / (this.renderResolution - 1) * this.renderDimensions.y;
            positions[arrayPos2 + 2] = 0;
        }
        const mesh = new THREE.Mesh(geometry, this.material3D);
        mesh.name = "3DWorkpiece";
        mesh.position.x = -this.workpiece.x / 2;
        mesh.position.y = -this.workpiece.y / 2;
        mesh.position.z = -this.workpiece.z / 2;
        this.mesh3D = mesh;
    }

    initGeometry2D() {
        const geometry = new THREE.BufferGeometry();
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 99999);
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0]), 3));
        geometry.addAttribute('vcolor', new THREE.BufferAttribute(new Float32Array([0, 0]), 1));
        geometry.attributes.position.dynamic = true;
        geometry.attributes.vcolor.dynamic = true;
        geometry.setDrawRange(0, Infinity);
        const mesh = new THREE.LineSegments(geometry, this.material2D);
        mesh.name = "2DWorkpiece";
        mesh.position.x = -this.workpiece.x / 2;
        mesh.position.y = -this.workpiece.y / 2;
        mesh.position.z = -this.workpiece.z / 2;
        this.mesh2D = mesh;
    }

    create2DWorkpieceLimits() {
        if (this.meshes.meshWorkpiece === true)
            return;

        const x = this.workpiece.x;
        const y = this.workpiece.y;
        const z = this.workpiece.z;
        const geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(x * 0, y * 0, z * 0), new THREE.Vector3(x * 1, y * 0, z * 0),
            new THREE.Vector3(x * 1, y * 0, z * 0), new THREE.Vector3(x * 1, y * 0, z * 1),
            new THREE.Vector3(x * 1, y * 0, z * 1), new THREE.Vector3(x * 0, y * 0, z * 1),
            new THREE.Vector3(x * 0, y * 0, z * 1), new THREE.Vector3(x * 0, y * 0, z * 0),
            new THREE.Vector3(x * 0, y * 0, z * 0), new THREE.Vector3(x * 0, y * 1, z * 0),
            new THREE.Vector3(x * 0, y * 0, z * 1), new THREE.Vector3(x * 0, y * 1, z * 1),
            new THREE.Vector3(x * 1, y * 0, z * 1), new THREE.Vector3(x * 1, y * 1, z * 1),
            new THREE.Vector3(x * 1, y * 0, z * 0), new THREE.Vector3(x * 1, y * 1, z * 0),
            new THREE.Vector3(x * 0, y * 1, z * 0), new THREE.Vector3(x * 1, y * 1, z * 0),
            new THREE.Vector3(x * 1, y * 1, z * 0), new THREE.Vector3(x * 1, y * 1, z * 1),
            new THREE.Vector3(x * 1, y * 1, z * 1), new THREE.Vector3(x * 0, y * 1, z * 1),
            new THREE.Vector3(x * 0, y * 1, z * 1), new THREE.Vector3(x * 0, y * 1, z * 0));
        geometry.computeLineDistances();

        const material = new THREE.LineDashedMaterial({ color: 0x000000, dashSize: 2, gapSize: 1 });

        const mesh = new THREE.Line(geometry, material);
        mesh.name = "2DWorkpieceDash";
        mesh.position.x = -this.workpiece.x / 2;
        mesh.position.y = -this.workpiece.y / 2;
        mesh.position.z = -this.workpiece.z / 2;

        mesh.visible = true;

        this.meshes.meshWorkpiece = true;
        this.meshWorkpiece = mesh;
    }

    updateWorkpieceDimensions() {
        this.meshes.mesh3D = false;
        this.meshes.meshWorkpiece = false;
        this.create3DWorkpiece();
        this.create2DWorkpieceLimits();
    }

    updateTool() {
        // this.initGeometry3D();
        this.meshes.mesh3D = false;
        this.create3DWorkpiece();
    }

    updateRendererResolution() {
        this.initWebGL(); // Actually initWebGL calls setRendererResolution, so this should be enough to resize buffers
        // But the logic in original mill.js called initMesh() which doesn't exist? 
        // Original code: "this.initMesh();" // line 216
        // But initMesh is not defined in Mill.js or Machine.js. It might be typo for initGeometry3D?
        // Let's assume re-init buffers.
    }

    setRendererResolution(renderResolution: number) {
        this.renderResolution = renderResolution || this.renderResolution;
        // Initialize buffers
        this.pixels1 = new Uint8Array(this.renderResolution * this.renderResolution * 4);
        this.pixels2 = new Uint8Array(this.renderResolution * this.renderResolution * 4);

        if (this.canvas && this.gl) {
            this.canvas.width = this.renderResolution;
            this.canvas.height = this.renderResolution;
            this.canvas.style.width = this.renderResolution + 'px'; // Fix style assignment
            this.canvas.style.height = this.renderResolution + 'px';
            this.gl.viewportWidth = this.renderResolution;
            this.gl.viewportHeight = this.renderResolution;
            this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        }
    }

    createBuffer(oldBuffer: any, data: any, itemSize: number, attribute: number) {
        if (this.linesVertexPositionBuffer != undefined) // Wait, is this checking oldBuffer or linesVertex? The arg is oldBuffer.
            // Original code: if (this.linesVertexPositionBuffer!=undefined) ... gl.deleteBuffer(oldBuffer); 
            // That looks like a bug in original code (checking one var but deleting another passed as arg).
            // I will fix it logically: check oldBuffer?
            // actually if I pass `this.linesVertexPositionBuffer` as `oldBuffer`, then checking `this.line...` is equivalent.
            if (oldBuffer != undefined) {
                try {
                    this.gl.deleteBuffer(oldBuffer);
                } catch (e) {
                }
            }
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        // @ts-ignore
        buffer.itemSize = itemSize;
        // @ts-ignore
        buffer.numItems = data.length / itemSize;
        this.gl.enableVertexAttribArray(attribute);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        // @ts-ignore
        this.gl.vertexAttribPointer(attribute, buffer.itemSize, this.gl.FLOAT, false, 0, 0);

        return buffer;
    }

    draw(numItems: number, options: { LINE_STRIP?: boolean, POINTS?: boolean, TRIANGLES?: boolean } = {}, pixels: Uint8Array) {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        if (options.LINE_STRIP == true)
            this.gl.drawArrays(this.gl.LINE_STRIP, 0, numItems);
        if (options.POINTS == true)
            this.gl.drawArrays(this.gl.POINTS, 0, numItems);
        if (options.TRIANGLES == true)
            this.gl.drawArrays(this.gl.TRIANGLES, 0, numItems);
        this.gl.flush();
        this.gl.readPixels(0, 0, this.renderResolution, this.renderResolution, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    }

    calculatePositionAndTexture(dimensions: any, toolRadius: number) {
        const xDist = (this.renderDimensions.x + 1) / 65535.0;
        const yDist = (this.renderDimensions.y + 1) / 65535.0;
        const zDist = (this.renderDimensions.z + 1) / 65535.0;
        const dataview1 = new DataView(this.pixels1.buffer, 0);
        const dataview2 = new DataView(this.pixels2.buffer, 0);
        let positions: number[] | Float32Array = [];
        // const l = this.pixels1.length - 4;
        for (let i = 0; i < dataview2.byteLength; i += 4) {
            if (dataview2.getUint8(i + 2) !== 0) {
                const x = dataview1.getUint16(i) * xDist;
                const y = dataview1.getUint16(i + 2) * yDist;
                const z = dataview2.getUint16(i);
                positions.push(x + toolRadius, y + toolRadius, z,
                    x - toolRadius, y + toolRadius, z,
                    x - toolRadius, y - toolRadius, z,

                    x + toolRadius, y + toolRadius, z,
                    x - toolRadius, y - toolRadius, z,
                    x + toolRadius, y - toolRadius, z);
            }
        }
        positions = new Float32Array(positions);

        const texturePos = new Float32Array(positions.length / 3 * 2);
        for (let i = 0; i < texturePos.length; i += 12) {
            texturePos[i + 0] = 1;
            texturePos[i + 1] = 1;
            texturePos[i + 2] = -1;
            texturePos[i + 3] = 1;
            texturePos[i + 4] = -1;
            texturePos[i + 5] = -1;

            texturePos[i + 6] = 1;
            texturePos[i + 7] = 1;
            texturePos[i + 8] = -1;
            texturePos[i + 9] = -1;
            texturePos[i + 10] = 1;
            texturePos[i + 11] = -1;
        }
        return [positions, texturePos];
    }

    create2DWorkpiece() {
        this.baseCreate2DWorkpiece();
    }

    create3DWorkpiece() {
        this.baseCreate3DWorkpiece();
    }

    _create3DWorkpiece() {
        if (!this.shaderProgram1 || !this.shaderProgram2) return;

        const dimensions = this.workpiece;

        this.gl.useProgram(this.shaderProgram1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.linesVertexPositionBuffer = this.createBuffer(this.linesVertexPositionBuffer, this.motionData.positions, 3,
            this.shaderProgram2.vertexPositionAttribute); // Wait, using shader2 attribute for shader1? 
        // In original code: this.shaderProgram2.vertexPositionAttribute (line 375). 
        // This assumes both shaders define 'position' at same location or it's just querying index.
        // But usually you should use shaderProgram1.vertexPositionAttribute for shader1.
        // I will stick to original code to avoid breaking weird logic, 
        // OR fix it if it looks like a bug.
        // Given both shaders probably declare `attribute vec3 position;` in same order, might be same index. 
        // But simpler to use `this.shaderProgram1.vertexPositionAttribute`.
        // HOWEVER, line 58 and 64 both get `position`.

        // I will stick to original logic carefully.

        this.gl.uniform3f(this.shaderProgram1.dimensions, this.renderDimensions.x, this.renderDimensions.y, this.renderDimensions.z);
        this.gl.uniform1f(this.shaderProgram1.resolution, this.renderResolution);
        this.gl.uniform1f(this.shaderProgram1.toolRadius, this.tool.radius);
        this.gl.uniform1i(this.shaderProgram1.currentDimension, 0);
        this.draw(this.linesVertexPositionBuffer.numItems, { LINE_STRIP: true, POINTS: true }, this.pixels1);
        this.gl.uniform1i(this.shaderProgram1.currentDimension, 1);
        this.draw(this.linesVertexPositionBuffer.numItems, { LINE_STRIP: true, POINTS: true }, this.pixels2);

        const data = this.calculatePositionAndTexture(dimensions, this.tool.radius);
        const positions = data[0];
        const texturePos = data[1];

        this.gl.useProgram(this.shaderProgram2);
        this.linesVertexPositionBuffer = this.createBuffer(this.linesVertexPositionBuffer, positions, 3,
            this.shaderProgram2.vertexPositionAttribute);
        this.texcoordBuffer = this.createBuffer(this.texcoordBuffer, texturePos, 2,
            this.shaderProgram2.texcoordAttribute);

        this.gl.uniform3f(this.shaderProgram2.dimensions, this.renderDimensions.x, this.renderDimensions.y, this.renderDimensions.z);
        this.gl.uniform1i(this.shaderProgram2.currentDimension, 0);
        this.draw(this.linesVertexPositionBuffer.numItems, { TRIANGLES: true }, this.pixels1);
        this.gl.uniform1i(this.shaderProgram2.currentDimension, 1);
        this.draw(this.linesVertexPositionBuffer.numItems, { TRIANGLES: true }, this.pixels2);

        const geometry = this.mesh3D.geometry;
        // const positionsMesh = geometry.attributes.position.array; // reusing var name

        const xDist = this.renderDimensions.x / 65535.0;
        const yDist = this.renderDimensions.y / 65535.0;
        const zDist = this.renderDimensions.z / 65535.0;
        const dataview1 = new DataView(this.pixels1.buffer, 0);
        const dataview2 = new DataView(this.pixels2.buffer, 0);

        const minX = Math.round(this.tool.radius * this.renderResolution / this.renderDimensions.x);
        const minY = Math.round(this.tool.radius * this.renderResolution / this.renderDimensions.y);
        const maxX = Math.round((parseFloat(this.workpiece.x) + this.tool.radius) * this.renderResolution / this.renderDimensions.x);
        const maxY = Math.round((parseFloat(this.workpiece.y) + this.tool.radius) * this.renderResolution / this.renderDimensions.y);

        const rowSize = (maxX - minX + 2);

        // Need to access mesh geometry positions, but I used `const positions` earlier for local data.
        const meshPositions = geometry.attributes.position.array;

        for (let yi = minY; yi < maxY; yi++) {
            for (let xi = minX; xi < maxX; xi++) {
                const arrayPos1 = (yi * this.renderResolution + xi) * 4;
                const arrayPos2 = ((yi - minY + 1) * rowSize + xi - minX + 1) * 3;
                if (dataview2.getUint8(arrayPos1 + 3) !== 0) {
                    // const x = dataview1.getUint16(arrayPos1) * xDist; // unused
                    // const y = dataview1.getUint16(arrayPos1 + 2) * yDist; // unused
                    const z = this.renderDimensions.z - dataview2.getUint16(arrayPos1) * zDist;
                    meshPositions[arrayPos2 + 0] = (xi - minX) / (this.renderResolution - 1) * this.renderDimensions.x;
                    meshPositions[arrayPos2 + 1] = (yi - minY) / (this.renderResolution - 1) * this.renderDimensions.y;
                    meshPositions[arrayPos2 + 2] = z;
                }
                else {
                    meshPositions[arrayPos2 + 0] = (xi - minX) / (this.renderResolution - 1) * this.renderDimensions.x;
                    meshPositions[arrayPos2 + 1] = (yi - minY) / (this.renderResolution - 1) * this.renderDimensions.y;
                    meshPositions[arrayPos2 + 2] = this.renderDimensions.z;
                }
            }
        }

        const index = geometry.index;
        const attributes = geometry.attributes;
        const groups = geometry.groups;

        const posArray = attributes.position.array;
        const normArray = attributes.normal.array;

        for (let i = 0, il = normArray.length; i < il; i++) {
            normArray[i] = 0;
        }

        let vA, vB, vC;
        const pA = new THREE.Vector3();
        const pB = new THREE.Vector3();
        const pC = new THREE.Vector3();
        const cb = new THREE.Vector3();
        const ab = new THREE.Vector3();

        const indices = index.array;
        if (groups.length === 0) {
            geometry.addGroup(0, indices.length);
        }
        for (let j = 0, jl = groups.length; j < jl; ++j) {
            const group = groups[j];
            const start = group.start;
            const count = group.count;

            for (let i = start, il = start + count; i < il; i += 3) {
                vA = indices[i + 0] * 3;
                vB = indices[i + 1] * 3;
                vC = indices[i + 2] * 3;

                pA.fromArray(posArray, vA);
                pB.fromArray(posArray, vB);
                pC.fromArray(posArray, vC);

                cb.subVectors(pC, pB);
                ab.subVectors(pA, pB);
                cb.cross(ab);

                normArray[vA] += cb.x;
                normArray[vA + 1] += cb.y;
                normArray[vA + 2] += cb.z;

                normArray[vB] += cb.x;
                normArray[vB + 1] += cb.y;
                normArray[vB + 2] += cb.z;

                normArray[vC] += cb.x;
                normArray[vC + 1] += cb.y;
                normArray[vC + 2] += cb.z;
            }
        }

        let x, y, z, n;
        for (let i = 0, il = normArray.length; i < il; i += 3) {
            x = normArray[i];
            y = normArray[i + 1];
            z = normArray[i + 2];
            n = 1.0 / Math.sqrt(x * x + y * y + z * z);
            normArray[i] *= n;
            normArray[i + 1] *= n;
            normArray[i + 2] *= n;
        }

        attributes.position.needsUpdate = true;
        attributes.normal.needsUpdate = true;

        this.mesh3D.position.x = -this.workpiece.x / 2;
        this.mesh3D.position.y = -this.workpiece.y / 2;
        this.mesh3D.position.z = -this.workpiece.z / 2;
    }
}
