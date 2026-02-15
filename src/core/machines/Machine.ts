
import { SHADERS } from '../graphics/Shaders';

import * as THREE from 'three';

export interface MachineOptions {
    renderResolution?: number;
    workpiece?: any;
    machine?: any;
    material3D?: any;
    lineColors?: { g0: any; g1: any; g2: any; g3: any };
}

export abstract class Machine {
    renderResolution: number;
    workpiece: any;
    machine: any;
    material3D: any;
    lineColors: { g0: any; g1: any; g2: any; g3: any };
    meshes: { mesh2D: boolean; mesh3D: boolean; meshWorkpiece: boolean };
    material2D: any;
    motionData: any;
    mesh2D: any;
    mesh3D: any;
    meshWorkpiece: any;

    constructor(options: MachineOptions = {}) {
        this.renderResolution = options.renderResolution || 64;
        this.workpiece = options.workpiece;
        this.machine = options.machine;
        this.material3D = options.material3D;
        this.lineColors = options.lineColors || {
            g0: new THREE.Color(1, 0, 0),
            g1: new THREE.Color(0, 0, 1),
            g2: new THREE.Color(1, 0, 1),
            g3: new THREE.Color(0, 1, 1),
        };
        this.meshes = { mesh2D: false, mesh3D: false, meshWorkpiece: false };

        // For 2D drawing
        this.material2D = new THREE.ShaderMaterial({
            uniforms: {
                g0: { type: "c", value: this.lineColors.g0 },
                g1: { type: "c", value: this.lineColors.g1 },
                g2: { type: "c", value: this.lineColors.g2 },
                g3: { type: "c", value: this.lineColors.g3 }
            },
            vertexShader: SHADERS["vs-2D"],
            fragmentShader: SHADERS["fs-2D"],
            linewidth: 1,
        });
    }

    setMotion(motionData: any) {
        this.motionData = motionData;
        this.meshes.mesh2D = false;
        this.meshes.mesh3D = false;
    }

    abstract create2DWorkpiece(): void;
    abstract create3DWorkpiece(): void;

    create2DWorkpieceLimits(): any {
        return { name: "2DWorkpieceDash" };
    }

    createProgram(gl: any, vertexShader: string, fragmentShader: string) {
        function compile(shaderSource: string, type: string) {
            const shader = gl.createShader(gl[type]);
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shader) + "\n" + shaderSource;
            }
            return shader;
        };

        const vs = compile(vertexShader, "VERTEX_SHADER");
        const fs = compile(fragmentShader, "FRAGMENT_SHADER");

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vs);
        gl.attachShader(shaderProgram, fs);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
            throw "Could not initialize shaders";

        return shaderProgram;
    }

    updateWorkpieceDimensions() { }

    updateTool() { }

    updateRendererResolution() { }

    // This method seems to have been implemented in base Machine.js but overwrites create2DWorkpiece abstract
    // However in JS prototype chain it was attached to Machine.prototype.
    // I will implement it here as a protected or public method that subclasses can call or override.
    // Wait, in legacy code, create2DWorkpiece WAS defined in Machine.js at the end, overriding the abstract error throw.
    // So it IS the default implementation.
    baseCreate2DWorkpiece() {
        if (this.mesh2D) this.mesh2D.visible = true;
        // MAYBE MISSING SOMETHING ABOUT POSITION
        if (this.machine.mtype === "Lathe") {
            if (this.mesh2D) this.mesh2D.position.x = -this.workpiece.z / 2;
        } else {
            if (this.mesh2D) {
                this.mesh2D.position.x = -this.workpiece.x / 2;
                this.mesh2D.position.y = -this.workpiece.y / 2;
                this.mesh2D.position.z = -this.workpiece.z / 2;
            }
        }
        if (this.meshes.mesh2D === true)
            return;

        if (!this.motionData) return;

        const geometry = this.mesh2D.geometry;
        // Updating the positions and vcolor by the 'correct' way won't
        // work here because the buffer size keeps changing all the time
        // I don't want to create a new mesh every time. Adding again the
        // position and vcolor will replace the buffer. I'm not that sure
        // if I'm doing something that could break the code later. 
        geometry.addAttribute('position', new THREE.BufferAttribute(this.motionData.positions, 3));
        geometry.addAttribute('vcolor', new THREE.BufferAttribute(this.motionData.color, 1));
        if (this.motionData.lines) {
            geometry.addAttribute('lines', new THREE.BufferAttribute(this.motionData.lines, 1));
        }
        geometry.setDrawRange(0, Infinity);
        this.mesh2D.visible = true;
        this.meshes.mesh2D = true;

        this.mesh2D.animation = {
            size: geometry.attributes.position.array.length / 3,
            beg: 0,
            end: 0,
            dataSize: 2,
            step: 1,
            animationState: false,
            isSessionActive: false,
            stepMode: 'continuous', // 'continuous' or 'step'
            currentLine: -1,
            onLineChange: null as ((line: number) => void) | null,
            onSimulationEnd: null as (() => void) | null,
            stopAndReset: function () {
                this.animationState = false;
                this.isSessionActive = false;
                this.end = 0;
                this.currentLine = -1;
                if (this.onLineChange) this.onLineChange(-1);
                geometry.setDrawRange(0, 0);
            },
            touggleAnimation: function () {
                if (this.animationState) {
                    this.animationState = false;
                    this.animate(false);
                } else {
                    this.animationState = true;
                    this.isSessionActive = true;
                    if (this.end >= this.size) {
                        this.end = 0;
                    }
                    this.animate(true);
                }
            },
            animate: function (b: boolean) {
                if (b === true) {
                    this.next = function () {
                        if (!this.animationState) return false;
                        if (this.end >= this.size) {
                            this.animationState = false;
                            this.isSessionActive = false;
                            if (this.onSimulationEnd) this.onSimulationEnd();
                            return false;
                        }

                        const oldLine = geometry.attributes.lines ? geometry.attributes.lines.array[Math.min(this.end, this.size - 1)] : -1;

                        // Increment
                        this.end += this.step * this.dataSize;

                        // Skip non-drawing segments
                        while (this.end < this.size && geometry.attributes.vcolor.array[this.end] >= 2) {
                            this.end += 2;
                        }

                        if (this.end > this.size) this.end = this.size;

                        // Get new line number after increment
                        const newLine = geometry.attributes.lines ? geometry.attributes.lines.array[Math.min(this.end, this.size - 1)] : -1;

                        if (newLine !== oldLine && this.onLineChange && newLine !== undefined && newLine !== -1) {
                            this.onLineChange(newLine);
                            if (this.stepMode === 'step') {
                                this.animationState = false;
                            }
                        }

                        geometry.setDrawRange(this.beg, this.end);
                        return true;
                    }
                }
                else {
                    this.next = function () { return false; };
                }
            },
            next: function () { return false; },
        };
    }

    // Default implementation calling _create3DWorkpiece which should be implemented by subclasses
    baseCreate3DWorkpiece() {
        if (this.mesh3D) this.mesh3D.visible = true;

        if (this.meshes.mesh3D === true)
            return this.mesh3D;

        // @ts-ignore
        if (this._create3DWorkpiece) this._create3DWorkpiece();

        if (this.mesh3D && this.mesh3D.geometry) this.mesh3D.geometry.setDrawRange(0, Infinity);
        if (this.mesh3D) this.mesh3D.visible = true;
        this.meshes.mesh3D = true;
        return this.mesh3D;
    }
}
