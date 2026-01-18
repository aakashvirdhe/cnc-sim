
import { Machine, type MachineOptions } from './Machine';
import { SHADERS } from '../graphics/Shaders';

declare const THREE: any;

export class Lathe extends Machine {
    linesVertexPositionBuffer: any;
    segments: number;
    canvas: any;
    gl: any;
    mtype: string;
    tool: any;
    shaderProgram1: any;
    pixels: Uint8Array;
    dataLevel1: Float32Array;
    dataLevel2: Float32Array | undefined;
    cosTable: Float32Array | undefined;
    sinTable: Float32Array | undefined;

    constructor(options: MachineOptions = {}) {
        super(options);
        this.linesVertexPositionBuffer = undefined;
        this.segments = 60;
        this.canvas = null;
        this.gl = null;
        this.mtype = "Lathe";
        this.tool = this.machine.tool;
        // Initialization order matters
        this.setRendererResolution(this.renderResolution); // Initialize buffers before WebGL might use them
        // Actually initWebGL uses renderResolution, so maybe later?
        // Let's follow original order but be careful about undefined properties
        this.initWebGL();
        this.initGeometry2D();
        this.initGeometry3D();
        this.create2DWorkpieceLimits();
    }

    initWebGL() {
        // For 3D drawing
        this.canvas = document.createElement('canvas');
        const attributes = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        };
        this.gl = this.canvas.getContext('webgl', attributes) || this.canvas.getContext('experimental-webgl', attributes);
        if (this.gl === null)
            throw 'Error creating WebGL context.';
        this.gl.enable(this.gl.DEPTH_TEST);

        this.shaderProgram1 = this.createProgram(this.gl, SHADERS["vs-lathe-1-3D"], SHADERS["fs-lathe-1-3D"]);

        this.shaderProgram1.workpieceLengthUniform = this.gl.getUniformLocation(this.shaderProgram1, "workpieceLength");
        this.shaderProgram1.workpieceRadiusUniform = this.gl.getUniformLocation(this.shaderProgram1, "workpieceRadius");
        this.shaderProgram1.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram1, "position");

        this.setRendererResolution(this.renderResolution);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
    }

    updateWorkpieceDimensions() {
        this.meshes.mesh3D = false;
        this.meshes.meshWorkpiece = false;
        this.create3DWorkpiece();
        this.create2DWorkpieceLimits();
    }

    updateRendererResolution() {
        this.setRendererResolution(this.renderResolution);
        this.meshes.mesh3D = false;
        this.create3DWorkpiece();
    }

    updateTool() {
        this.meshes.mesh3D = false;
        this.create3DWorkpiece();
    }

    setRendererResolution(renderResolution: number) {
        this.renderResolution = renderResolution || this.renderResolution;
        // Initialize arrays
        this.pixels = new Uint8Array(this.renderResolution * 4);
        this.dataLevel1 = new Float32Array(this.renderResolution);

        if (this.canvas && this.gl) {
            this.canvas.width = this.renderResolution;
            this.canvas.height = 1;
            this.gl.viewportWidth = this.renderResolution;
            this.gl.viewportHeight = 1;
            this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        }
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
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.y = Math.PI / 2;
        mesh.position.x = -this.workpiece.z / 2;
        this.mesh2D = mesh;
    }

    initGeometry3D() {
        this.material3D.shading = THREE.SmoothShading;
        const segments = this.segments;
        const phiStart = 0;
        const phiLength = 2 * Math.PI;
        const SlicesX = this.renderResolution + 2;

        const geometry = new THREE.BufferGeometry();
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 99999);
        const vertices = new Float32Array(SlicesX * segments * 3);
        const uvs = new Float32Array(vertices.length);
        const index = new Uint32Array(Math.floor((SlicesX - 1) * (segments - 1) * 6));

        // Pre calculate sin and cos
        const sinTable = new Float32Array(segments);
        const cosTable = new Float32Array(segments);
        const invSeg = (1 / (segments - 1)) * phiLength;
        for (let ir = 0; ir < segments; ir++) {
            const ang = invSeg * ir;
            cosTable[ir] = Math.cos(ang);
            sinTable[ir] = Math.sin(ang);
        }
        this.cosTable = cosTable;
        this.sinTable = sinTable;

        // Create the index vector
        let ii = 0;
        let ifa = 0;
        for (let ix = 0; ix < SlicesX - 1; ix++) {
            let ir;
            for (ir = 0; ir < segments - 2; ir++) {
                const i = ix * segments + ir;

                const iv = ii;
                index[ii++] = i + 1 + segments;
                index[ii++] = i + 1;
                index[ii++] = i;

                index[ii++] = i;
                index[ii++] = i + segments;;
                index[ii++] = i + 1 + segments;
            }
            // ir--; 
            // In original code: ir--; was after the loop, so ir was segments-2. 
            // Then ir-- makes it segments-3? 
            // Original code:
            // for (ir=0; ir<segments-2; ir++) ...
            // ir--;
            // wait, if loop breaks, ir is equal to segments-2.
            // ir-- makes it segments-3.
            // But let's look at the next lines:
            // var i1=ix*segments+0;
            // var i2=ix*segments+ir;
            // So i2 is connecting the last segment to the first?

            // Re-evaluating logic:
            // The loop runs for ir = 0 to segments-3.
            // At end of loop, ir becomes segments-2.
            // Then `ir--` makes it segments-3.
            // So `i2 = ix*segments + (segments-3)`. This seems wrong if we want to close the loop properly or handle the seam.
            // Actually, let's assume `ir` retains its value from the loop scope in legacy JS `var`.
            // In TS block scoping `let`, it's not available.

            // JS: for(var ir=0; ir<segments-2; ir++)
            // last iteration ir is segments-3.
            // loop terminates when ir becomes segments-2.
            // so `ir--` sets it back to segments-3.
            const lastIR = segments - 3;

            const i1 = ix * segments + 0;
            const i2 = ix * segments + lastIR;

            index[ii++] = i1 + segments;
            index[ii++] = i1;
            index[ii++] = i2 + 1;

            index[ii++] = i2 + 1;
            index[ii++] = i2 + segments + 1;
            index[ii++] = i1 + segments;
        }
        // Generate the UVs
        let iv = 0;
        for (let ix = 0; ix < SlicesX; ix++) {
            const r = this.dataLevel1[Math.min(ix, this.dataLevel1.length - 1)]; // Safety clamp
            for (let ir = 0; ir < segments; ir++) {
                uvs[iv++] = ix * 1 / SlicesX;
                uvs[iv++] = sinTable[ir] * 0.5 + 0.5;
                uvs[iv++] = cosTable[ir] * 0.5 + 0.5;
            }
        }

        geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(index, 1));
        geometry.attributes.position.dynamic = true;

        const mesh = new THREE.Mesh(geometry, this.material3D);
        mesh.position.x = -this.workpiece.z / 2;
        mesh.name = "3DWorkpiece";

        this.mesh3D = mesh;
    }

    generateLatheGeometry() {
        const segments = this.segments;
        const SlicesX = this.renderResolution;
        const L = this.workpiece.z;
        const seg = L / (SlicesX - 1);
        let z = 0;
        let iv = 0;
        const sinTable = this.sinTable!; // Assert exists
        const cosTable = this.cosTable!;
        const vertices = this.mesh3D.geometry.attributes.position.array;

        for (let ir = 0; ir < segments; ir++) {
            vertices[iv++] = z;
            vertices[iv++] = 0;
            vertices[iv++] = 0;
        }
        for (let ix = 0; ix < SlicesX; ix++, z += seg) {
            const r = this.dataLevel1[ix];
            for (let ir = 0; ir < segments; ir++) {
                vertices[iv++] = z;
                vertices[iv++] = r * sinTable[ir];
                vertices[iv++] = r * cosTable[ir];
            }
        }
        for (let ir = 0; ir < segments; ir++) {
            vertices[iv++] = z;
            vertices[iv++] = 0;
            vertices[iv++] = 0;
        }

        this.mesh3D.geometry.attributes.position.array = vertices;
        this.mesh3D.geometry.attributes.position.needsUpdate = true;
        this.mesh3D.geometry.computeFaceNormals();
        this.mesh3D.geometry.computeVertexNormals();
    }

    create2DWorkpieceLimits() {
        if (this.meshes.meshWorkpiece === true)
            return;

        const R = this.workpiece.x / 2;
        const L = this.workpiece.z;

        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(R, 0, 0), new THREE.Vector3(R, 0, L), new THREE.Vector3(0, 0, L),
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(R, 0, 0));
        geometry.computeLineDistances();

        const material = new THREE.LineDashedMaterial({ color: 0x000000, dashSize: 2, gapSize: 1 });

        const mesh = new THREE.Line(geometry, material);
        mesh.name = "2DWorkpieceDash";
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.y = Math.PI / 2;
        mesh.position.x = -this.workpiece.z / 2;
        mesh.visible = true;

        this.meshes.meshWorkpiece = true;
        this.meshWorkpiece = mesh;
    }

    // Implementation of abstract method using base logic
    create2DWorkpiece() {
        this.baseCreate2DWorkpiece();
    }

    // Implementation of abstract method using base logic
    create3DWorkpiece() {
        this.baseCreate3DWorkpiece();
    }

    // Called by baseCreate3DWorkpiece via @ts-ignore dynamic call in base
    _create3DWorkpiece() {
        const radius = this.workpiece.x / 2.0;
        this.gl.useProgram(this.shaderProgram1);
        // Delete the last buffer
        if (this.linesVertexPositionBuffer != undefined)
            try {
                this.gl.deleteBuffer(this.linesVertexPositionBuffer);
            } catch (e) { }
        // Create a new buffer
        this.linesVertexPositionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linesVertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.motionData.positions, this.gl.STATIC_DRAW);
        this.linesVertexPositionBuffer.itemSize = 3;
        this.linesVertexPositionBuffer.numItems = this.motionData.positions.length / 3;
        this.gl.enableVertexAttribArray(this.shaderProgram1.vertexPositionAttribute);
        // Clear the deth buffer, and load the uniforms and atrtributes
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        this.gl.uniform1f(this.shaderProgram1.workpieceLengthUniform, this.workpiece.z);
        this.gl.uniform1f(this.shaderProgram1.workpieceRadiusUniform, radius);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linesVertexPositionBuffer);
        this.gl.vertexAttribPointer(this.shaderProgram1.vertexPositionAttribute, this.linesVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        // Draw the lines
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.linesVertexPositionBuffer.numItems);
        // Draw everything as points to make sure vertical lines will also be rendered
        this.gl.drawArrays(this.gl.POINTS, 0, this.linesVertexPositionBuffer.numItems);
        this.gl.flush();
        // Read the rendered data and calculate the values
        this.gl.readPixels(0, 0, this.renderResolution, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pixels);
        const vDist = radius / 65535.0;

        const dataview = new DataView(this.pixels.buffer, 0);
        const l = this.pixels.length;
        let i = 0;
        for (i = 0; i < l; i += 4) {
            const d = dataview.getUint16(i) * vDist;
            if (d === 0)
                break;
            this.dataLevel1[i / 4] = d;
        };
        for (i = i; i < l; i += 4) {
            this.dataLevel1[i / 4] = 0;
        };

        // Tool radius
        this.dataLevel2 = new Float32Array(this.renderResolution);

        const toolRadius = this.machine.tool.radius || 2; // mm
        const seg = this.workpiece.z / (this.renderResolution - 1);
        const segNbr = Math.round(toolRadius / seg); // number of segments

        if (segNbr > 1) {
            for (i = segNbr; i < l / 4; i++) {
                for (let j = 0; j < segNbr; j++) {
                    const subarray = this.dataLevel1.subarray(i - j, i);
                    this.dataLevel2[i] = Math.min.apply(Math, Array.from(subarray));
                }
            };
            for (i = 1; i < segNbr; i++) {
                for (let j = 0; j < segNbr; j++) {
                    const subarray = this.dataLevel1.subarray(0, i);
                    this.dataLevel2[i] = Math.min.apply(Math, Array.from(subarray));
                }
            };
            this.dataLevel1 = this.dataLevel2;
        }

        this.generateLatheGeometry();
        this.mesh3D.position.x = -this.workpiece.z / 2;
    }
}
