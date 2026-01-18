
export interface MachineConfig {
    mtype: string;
    dimension: { x: number; y: number; z: number };
    maxSpindleRPM: number;
    home1: { x: number; y: number; z: number };
    home2: { x: number; y: number; z: number };
    tool?: { radius: number; angle: number };
    maxFeedRate?: { x: number; y: number; z: number };
}

export interface WorkpieceConfig {
    material: string;
    x?: number;
    y?: number;
    z?: number;
    filamentDiameter?: number;
    layerHeight?: number;
}

export interface ProjectHeader {
    name?: string;
    date: Date;
    workpiece: WorkpieceConfig;
    machine: MachineConfig;
}

export interface ProjectData {
    header: ProjectHeader;
    code: string;
    projectName?: string;
}

export class ProjectFactory {
    machine: string;

    constructor(options: { machine?: string } = {}) {
        this.machine = options.machine || "Lathe";
    }

    static createDefaultMachine(machine: string): MachineConfig | undefined {
        if (machine === "Lathe") {
            return {
                mtype: "Lathe",
                dimension: { x: 100, y: 100, z: 200 },
                maxSpindleRPM: 100,
                home1: { x: 100, y: 0, z: 200 },
                home2: { x: 0, y: 0, z: 0 },
                tool: { radius: 2, angle: 0 },
            };
        } else if (machine === "Mill") {
            return {
                mtype: "Mill",
                dimension: { x: 500, y: 500, z: 500 },
                maxSpindleRPM: 100,
                home1: { x: 0, y: 0, z: 100 },
                home2: { x: 0, y: 0, z: 0 },
                tool: { radius: 2.5, angle: 0 },
            };
        } else if (machine === "3D Printer") {
            return {
                mtype: "3D Printer",
                dimension: { x: 300, y: 300, z: 500 },
                maxSpindleRPM: 100,
                maxFeedRate: { x: 500, y: 500, z: 500 },
                home1: { x: 0, y: 0, z: 200 },
                home2: { x: 0, y: 0, z: 0 },
            };
        } else {
            console.error(machine + " Not available");
            return undefined;
        }
    }

    static createDefaultWorkpiece(machine: string): WorkpieceConfig | undefined {
        if (machine === "Lathe") {
            return {
                material: "aluminum",
                x: 50,
                z: 100,
            };
        } else if (machine === "Mill") {
            return {
                material: "aluminum",
                x: 200,
                y: 200,
                z: 50,
            };
        } else if (machine === "3D Printer") {
            return {
                material: "plastic",
                filamentDiameter: 3,
                layerHeight: 0.4,
            };
        } else {
            console.error(machine + " Not available");
            return undefined;
        }
    }

    static createDefaultCode(machine: string): string | undefined {
        if (machine === "Lathe") {
            return "G18 ( Plane X,Z )\n" +
                "G21 ( Millimeter )\n" +
                "G90 ( Absolute )\n" +
                "G40 ( Cancel radius compensation )\n" +
                "G92 X0 Z0 ( Offset coordinate system )\n";
        } else if (machine === "Mill") {
            return "G17 ( Plane X,Y )\n" +
                "G21 ( Millimeter )\n" +
                "G90 ( Absolute )\n" +
                "G40 ( Cancel radius compensation )\n" +
                "G92 X0 Y0 Z0 ( Offset coordinate system )\n";
        } else if (machine === "3D Printer") {
            return "G17 ( Plane X,Y )\n" +
                "G21 ( Millimeter )\n" +
                "G90 ( Absolute )\n" +
                "G40 ( Cancel radius compensation )\n" +
                "G92 X0 Y0 Z0 ( Offset coordinate system )\n";
        } else {
            console.error(machine + " Not available");
            return undefined;
        }
    }

    static createDefaultProject(machine: string): ProjectData {
        const project: Partial<ProjectData> = {};
        project.header = {
            date: new Date(),
            workpiece: this.createDefaultWorkpiece(machine)!,
            machine: this.createDefaultMachine(machine)!
        };
        project.code = this.createDefaultCode(machine)!;
        return project as ProjectData;
    }
}
