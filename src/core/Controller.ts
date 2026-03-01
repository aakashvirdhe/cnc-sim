import { ProjectFactory } from './ProjectFactory';
import * as dat from 'dat.gui';
import { StorageService } from './StorageService';
import { EditorService } from './EditorService';
import { Renderer } from './graphics/Renderer';
import { Motion } from './Motion';
import { Lathe } from './machines/Lathe';
import { Mill } from './machines/Mill';
// import { Printer } from './machines/Printer';

import * as THREE from 'three';
import { TrackballControls } from '../lib/TrackballControls';
import { STLBinaryExporter } from '../lib/STLBinaryExporter';

export class Controller {
    storage: StorageService;
    editor: EditorService;
    renderer: Renderer;
    motion: Motion;
    saveFlag: number;
    // autoRun: boolean; // Removed
    _run3D: boolean;
    _run2D: boolean;
    // _runWireframe: boolean; // Removed
    controls: any;
    machine: any; // Type as Machine (Lathe | Mill)
    material3D: any;
    _simulationSpeed: number;
    _executionMode: 'continuous' | 'step';
    _isSimulating: boolean;

    constructor(editor: EditorService, storage: StorageService, renderer: Renderer, motion: Motion) {
        this.storage = storage;
        this.editor = editor;
        this.renderer = renderer;
        this.motion = motion;
        this.motion.setController(this);
        this.saveFlag = 0;
        // this.autoRun = false;
        this._run3D = true;
        this._run2D = true;
        this._simulationSpeed = 1.0;
        this._executionMode = 'continuous';
        this._isSimulating = false;
        // this._runWireframe = true;

        this.createDatGUI();
        // Create controls
        // TrackballControls is usually added to THREE by the lib script
        this.controls = new TrackballControls(this.renderer.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 5.0;
        this.controls.zoomSpeed = 2;
        this.controls.panSpeed = 0.4;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        // Init the storage
        // @ts-ignore
        if (this.storage.isFirstRun) {
            this.createProject({ projectName: "Untitled", machineType: "Lathe" });
        }
        else {
            this.openProject(this.storage.header.name);
        }

        // Init the editor
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const controller = this;
        this.editor.subscribeToCodeChanged(function (_code: string, _ev: any) {
            controller.save();
        });
        this.editor.subscribeToCodeChanged(function (_code: string, _ev: any) {
            controller.runInterpreter();
        });

        // Add the renderer to the container
        const container = document.getElementById("canvasContainer");
        if (container) {
            container.appendChild(renderer.domElement);
        }

        // Set renderer size
        this.windowResize();

        // Save changes every 60 seconds
        setInterval(function () {
            if (controller.saveFlag === 0)
                return;
            controller.save(true);
        }, 60000);

        window.addEventListener("beforeunload", function () {
            if (controller.saveFlag === 0)
                return;
            controller.save(true);
        });

        // this.autoRun = autoRun; 
    }

    get run2D() {
        return this._run2D;
    }
    set run2D(val) {
        this._run2D = val;
        this.update2D();
    }
    get run3D() {
        return this._run3D;
    }
    set run3D(val) {
        this._run3D = val;
        this.update3D();
        this.render(true);
    }

    get simulationSpeed() {
        return this._simulationSpeed;
    }

    set simulationSpeed(val: number) {
        this._simulationSpeed = Math.max(0.1, Math.min(2.0, val));

        // Update physics/animation step in active meshes
        if (this.renderer['2DWorkpiece'] && this.renderer['2DWorkpiece'].animation) {
            this.renderer['2DWorkpiece'].animation.step = this._simulationSpeed;
            this.renderer['2DWorkpiece'].animation.stepMode = this._executionMode;
        }
        // If 3D workpiece has animation in future, update it here too
        if (this.renderer['3DWorkpiece'] && this.renderer['3DWorkpiece'].animation) {
            this.renderer['3DWorkpiece'].animation.step = this._simulationSpeed;
            this.renderer['3DWorkpiece'].animation.stepMode = this._executionMode;
        }

        // Trigger a re-render or UI update if needed
        window.dispatchEvent(new CustomEvent('simulationSpeedChanged', { detail: this._simulationSpeed }));
    }

    get executionMode() {
        return this._executionMode;
    }

    set executionMode(val: 'continuous' | 'step') {
        this._executionMode = val;
        if (this.renderer['2DWorkpiece'] && this.renderer['2DWorkpiece'].animation) {
            const anim = this.renderer['2DWorkpiece'].animation;
            anim.stepMode = this._executionMode;

            // Reset simulation when switching modes to ensure consistency
            if (anim.isSessionActive) {
                anim.stopAndReset();
                this.isSimulating = false;
            }
        }
        window.dispatchEvent(new CustomEvent('executionModeChanged', { detail: this._executionMode }));
    }

    get isSimulating() {
        return this._isSimulating;
    }

    set isSimulating(val: boolean) {
        this._isSimulating = val;
        window.dispatchEvent(new CustomEvent('simulationStateChanged', { detail: this._isSimulating }));
    }
    // get runWireframe() {
    //     return this._runWireframe;
    // }
    // set runWireframe(val) {
    //     this._runWireframe = val;
    //     if (this._runWireframe === true) {
    //         if (this.machine && this.machine.meshWorkpiece) this.machine.meshWorkpiece.visible = true;
    //     }
    //     else {
    //         if (this.machine && this.machine.meshWorkpiece) this.machine.meshWorkpiece.visible = false;
    //     }
    // }

    createProject(data: any, saveCurrent?: boolean) {
        if (data['projectName'] == "" || data['projectName'] === undefined)
            return;

        // Default to true if not provided
        if (saveCurrent === undefined) saveCurrent = true;

        const projectName = this.storage.createNewProject(data['projectName'], data['machineType'], saveCurrent);
        // When opening the just-created project, we don't need to save "current" again 
        // because createNewProject already sets it as current.
        this.openProject(projectName, false);
        this.simulationSpeed = 1.0; // Reset to 1x
        return projectName;
    }

    listProjects() {
        return this.storage.projectNames;
    }

    deleteProjects(projectNames: string[]) {
        if (!projectNames || projectNames.length === 0) return;

        for (let i = 0; i < projectNames.length; i++) {
            this.storage.deleteProject(projectNames[i]);
        }

        // Check if we have any projects left
        const projects = this.listProjects();
        const keys = Object.keys(projects);

        if (keys.length === 0) {
            // Create default project if all deleted "to maintain fresh launch behavior"
            // Pass false to createProject to prevent saving the old (now deleted) project state
            this.createProject({ projectName: "Default", machineType: "Lathe" }, false);
        } else {
            // If current project was deleted, open the first available one WITHOUT saving the current (deleted) state
            if (projectNames.indexOf(this.storage.header.name) !== -1) {
                this.openProject(keys[0], false);
            }
        }
    }

    openProject(projectName: string, saveCurrent?: boolean) {
        // Default to true if not provided
        if (saveCurrent === undefined) saveCurrent = true;

        this.storage.loadProject(projectName, saveCurrent);

        // For old versions
        if (this.storage.machineType === "Lathe" && this.storage.machine.tool === undefined) {
            const machine = this.storage.machine;
            machine.tool = { radius: 2, angle: 0 };
            this.storage.machine = machine;
        }
        this.loadMachine();
        this.editor.setCode(this.storage.code);

        // Dispatch event for React UI to update
        window.dispatchEvent(new CustomEvent('projectUpdated', {
            detail: {
                projectName: this.storage.header.name,
                machineType: this.storage.machineType
            }
        }));
    }

    loadMachine() {
        this.controls.reset();
        const icon = document.getElementById('machineIcon');

        if (this.storage.machineType == "Lathe") {
            if (icon) icon.className = "icon-lathe";
            this.machine = new Lathe({
                machine: this.storage.machine,
                material3D: this.material3D,
                workpiece: this.storage.workpiece,
                renderResolution: 512
            });
            this.renderer.lookAtLathe({ x: this.storage.workpiece.x, y: this.storage.workpiece.z });
            this.renderer.addMesh("2DWorkpiece", this.machine.mesh2D);
            this.renderer.addMesh("3DWorkpiece", this.machine.mesh3D);
            this.updateWireframe();
        }
        else if (this.storage.machineType == "Mill") {
            if (icon) icon.className = "icon-mill";
            try {
                this.machine = new Mill({
                    machine: this.storage.machine,
                    material3D: this.material3D,
                    workpiece: this.storage.workpiece,
                    renderResolution: 1024
                });
                if (this.machine.mtype == "Mill") {
                    this.updateWorkpieceDraw();
                    // Ensure arguments are valid numbers to prevent crashes
                    const x = parseFloat(String(this.storage.workpiece.x)) || 0;
                    const y = parseFloat(String(this.storage.workpiece.y)) || 0;
                    this.renderer.lookAtMill({ x, y });
                    this.renderer.addMesh("2DWorkpiece", this.machine.mesh2D);
                    this.renderer.addMesh("3DWorkpiece", this.machine.mesh3D);
                    // this.updateWireframe();
                }
            } catch (e) {
                console.error("Failed to load Mill machine:", e);
                // Fallback or alert user?
                // For now, let's just log it so we can see it in console (or communicate it via notify_user later if we could read logs)
                // Since I cannot read browser console, I might need to display it in the UI messages.
                this.displayMessage("Error loading Mill: " + e, true);
            }
        }
    }

    openMachine(machine: string) {
        this.storage.machine = ProjectFactory.createDefaultMachine(machine);
        this.storage.workpiece = ProjectFactory.createDefaultWorkpiece(machine);
        this.loadMachine();
        this.runInterpreter();

        // Dispatch event for React UI to update
        window.dispatchEvent(new CustomEvent('projectUpdated', {
            detail: {
                projectName: this.storage.header.name,
                machineType: this.storage.machineType
            }
        }));
    }

    workpieceDimensions(dimensions: any) {
        this.storage.workpiece.dimension = dimensions;
    }

    getMachineType() {
        return this.storage.machineType;
    }

    getMachine() {
        return this.storage.machine;
    }

    setMachineTool(tool: any) {
        this.storage.machine.tool.radius = parseFloat(tool['toolradius']) || 0;
        this.storage.machine.tool.angle = parseFloat(tool['toolangle']) || 0;
        this.machine.updateTool();
        this.updateWorkpieceDraw();
    }

    getWorkpiece() {
        return this.storage.workpiece;
    }

    setWorkpieceDimensions(dimensions: any) {
        const workpiece = this.storage.workpiece;
        for (const i in dimensions) {
            workpiece[i] = dimensions[i];
        }
        this.storage.workpiece = workpiece;
        this.machine.updateWorkpieceDimensions();
        if (this.machine.mtype == "Lathe") {
            this.updateWorkpieceDraw();
            this.renderer.lookAtLathe({ x: this.storage.workpiece.x, y: this.storage.workpiece.z });
        }
        if (this.machine.mtype == "Mill") {
            this.updateWorkpieceDraw();
            // Ensure arguments are valid numbers to prevent crashes
            const x = parseFloat(String(this.storage.workpiece.x)) || 0;
            const y = parseFloat(String(this.storage.workpiece.y)) || 0;
            this.renderer.lookAtMill({ x, y });
            // Re-add meshes because updateWorkpieceDimensions (via initGeometry3D) created new objects
            this.renderer.addMesh("2DWorkpiece", this.machine.mesh2D);
            this.renderer.addMesh("3DWorkpiece", this.machine.mesh3D);
        }
        // else if (this.machine.mtype == "3D Printer") {
        //     this.runInterpreter();
        // }
        // this.updateWireframe();
    }

    exportToOBJ() {
        console.log("Exporting");
        const filename = this.storage.header.name;
        // Problem with STL Exporter
        // @ts-ignore
        const exporter = new STLBinaryExporter();
        const result = exporter.parse(this.renderer.scene);
        const element = document.createElement('a');
        const blob = new Blob([result], { type: 'text/plain' });
        element.setAttribute('href', URL.createObjectURL(blob));
        element.setAttribute('download', filename + ".stl");

        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    createDatGUI() {
        const guiElem = document.getElementById("gui");
        if (guiElem)
            guiElem.remove();

        const material3D = new THREE.MeshStandardMaterial(
            {
                color: 0xaaaaaa, // Grey metal
                shading: THREE.SmoothShading,
                emissive: 0x000000,
                blending: 0,
                alphaTest: 0,
                transparent: false,
                wireframe: false,
                refractionRatio: 0.98,
            });
        material3D.metalness = 0.7;
        material3D.roughness = 0.3;
        material3D.opacity = 1;
        material3D.visible = true;
        material3D.side = THREE.DoubleSide;

        function handleColorChange(color: any) {
            return function (value: any) {
                if (typeof value === "string") {
                    value = value.replace('#', '0x');
                }
                color.setHex(value);
            };
        };
        const gui = new dat.GUI({ autoPlace: false });
        gui.domElement.id = 'gui';
        gui.close();

        // Only show controls if enabled in environment
        if (import.meta.env.VITE_SHOW_CONTROLS === 'true') {
            const container = document.getElementById("canvasContainer");
            if (container) container.appendChild(gui.domElement);
        }

        const data =
        {
            color: material3D.color.getHex(),
            emissive: material3D.emissive.getHex(),
        };
        const folder = gui.addFolder('Material');
        //        folder.add( material3D,'transparent');
        //        folder.add( material3D, 'opacity', 0, 1 );
        folder.add(material3D, 'metalness', 0, 1);
        folder.add(material3D, 'roughness', 0, 1);
        folder.add(material3D, 'visible');
        folder.addColor(data, 'color').onChange(handleColorChange(material3D.color));
        folder.addColor(data, 'emissive').onChange(handleColorChange(material3D.emissive));
        folder.add(material3D, 'wireframe');
        //        folder.add( material3D, 'refractionRatio', 0, 1 );

        this.material3D = material3D;
    }

    runGCode() {
        this.editor.codeChanged("");
    }

    setEditor() {
        this.editor.codeChanged("");
    }

    windowResize() {
        const maincanvasdiv = document.getElementById("canvasContainer");
        if (maincanvasdiv) {
            this.controls.handleResize();
            this.renderer.setSize(maincanvasdiv.offsetWidth, maincanvasdiv.offsetHeight);
        }
    }

    render(_forceUpdate?: boolean) {
        this.controls.update();
        // if (this.controls.controlUpdated || forceUpdate)
        // {   
        this.renderer.render(this.controls);
        // this.controls.controlUpdated = false;
        // }
    }

    save(forceSave?: boolean) {
        // Set the number of changes to save the code
        const changes = 30;
        if (forceSave === true)
            this.saveFlag = Infinity;
        this.saveFlag++;
        const saveIcon = document.getElementById("saveIcon");
        if (!saveIcon) return;

        // Don't save
        if (this.saveFlag < changes) {
            saveIcon.style.color = 'red';
        }
        // Save
        else {
            saveIcon.style.color = 'green';
            this.saveFlag = 0;
            this.storage.code = this.editor.getCode();
        }
    }

    runInterpreter(_forceRun?: boolean) {
        // if (this.autoRun === false && forceRun !== true)
        //    return;
        const code = this.editor.getCode();
        this.motion.setData({
            header: this.storage.header,
            code: code
        });
        this.displayMessage("Running G Code");
        this.motion.run();
    }

    stopInterpreter() {
        if (this.motion && this.motion.running) {
            this.displayMessage("Stopping...", true);
            this.motion.stop();
            this.displayMessage("Stopped by user.", true);
        }
    }

    updateWorkpieceDraw() {
        if (!this.machine) return;

        this.editor.clearHighlight();
        this.displayMessage("Generating geometry");

        // Use a short setTimeout to yield the main thread so the browser can repaint the DOM
        // and actually show the "Generating geometry" message before blocking on calculations.
        setTimeout(() => {
            this.update2D();
            this.update3D();

            if (this.renderer['2DWorkpiece'] && this.renderer['2DWorkpiece'].animation) {
                const anim = this.renderer['2DWorkpiece'].animation;
                anim.onLineChange = (line: number) => {
                    this.editor.highlightLine(line);
                    window.dispatchEvent(new CustomEvent('simulationLineChanged', { detail: line }));
                };
                anim.onSimulationEnd = () => {
                    this.isSimulating = false;
                    this.editor.clearHighlight();
                    // Reset the simulation to the beginning as requested
                    anim.stopAndReset();
                };
                anim.stepMode = this._executionMode;
            }

            if (this.machine.motionData && this.machine.motionData.error && this.machine.motionData.error.length !== 0) {
                this.displayMessage(this.machine.motionData.error[0], true);
            }
            else
                this.displayMessage();
        }, 10);
    }

    update2D() {
        if (!this.machine) return;
        if (this.run2D === true) {
            this.machine.create2DWorkpiece();
            if (this.machine.mesh2D) {
                this.machine.mesh2D.visible = true;
                if (this.machine.mesh2D.animation) {
                    this.machine.mesh2D.animation.step = this._simulationSpeed;
                    this.machine.mesh2D.animation.stepMode = this._executionMode;
                }
            }
        }
        else {
            if (this.machine.mesh2D) this.machine.mesh2D.visible = false;
        }
    }

    update3D() {
        if (!this.machine) return;
        if (this.run3D === true) {
            this.machine.create3DWorkpiece();
            if (this.machine.mesh3D) {
                this.machine.mesh3D.visible = true;
                if (this.machine.mesh3D.animation) {
                    this.machine.mesh3D.animation.step = this._simulationSpeed;
                    this.machine.mesh3D.animation.stepMode = this._executionMode;
                }
            }
        }
        else {
            if (this.machine.mesh3D) this.machine.mesh3D.visible = false;
        }
    }

    updateWireframe() {
        // if (!this.machine) return;
        // this.renderer.addMesh("2DWorkpieceDash", this.machine.meshWorkpiece);
    }

    runAnimation(animate: any) {
        if (this.renderer['2DWorkpiece'] && this.renderer['2DWorkpiece'].animation) {
            const anim = this.renderer['2DWorkpiece'].animation;

            // If already active, stop and reset
            if (anim.isSessionActive) {
                anim.stopAndReset();
                this.isSimulating = false;
                this.renderer.animate(false, "3DWorkpiece");
                return;
            }

            // Otherwise Start Session
            this.isSimulating = true;
            if (this._executionMode === 'step') {
                this.nextStep();
            } else {
                this.renderer.animate(animate, "2DWorkpiece");
                this.renderer.animate(animate, "3DWorkpiece");
            }
        }
    }

    nextStep() {
        if (this.renderer['2DWorkpiece'] && this.renderer['2DWorkpiece'].animation) {
            const anim = this.renderer['2DWorkpiece'].animation;
            this.isSimulating = true;
            anim.animationState = true;
            anim.isSessionActive = true;
            anim.animate(true);
        }
    }

    displayMessage(message?: string, error?: boolean) {
        const msgEl = document.getElementById("messages");
        if (!msgEl) return;

        if (message === undefined) {
            msgEl.textContent = "";
        } else {
            msgEl.textContent = message;
            if (error === true) {
                msgEl.style.color = 'red';
            } else {
                msgEl.style.color = 'black';
            }
        }
    }
}
