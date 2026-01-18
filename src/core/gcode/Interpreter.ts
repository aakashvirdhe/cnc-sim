import { Command, ErrorParser } from './Parser';

export class Interpreter {
    machineType: string;
    modal: {
        motion: number;
        feed_rate_mode: number;
        units: number;
        distance: number;
        plane_select: number;
        tool_length: number;
        coord_select: number;
        program_flow: number;
        coolant: number;
        spindle: number;
        cutter_comp: number;
    };
    settings: {
        g0_speed: number;
        spindle_speed: number;
        feed_rate: number | null;
        feed_rate93: number;
        tool: number;
        line_number: number;
        machine_postion_g53: boolean;
        coord_system: any;
        coord_offset: { x: number; y: number; z: number };
        tool_length_offset: number;
        sys_abort: boolean;
        sys_rt_exec_state: number;
        sys_rt_exec_alarm: number;
        sys_suspend: boolean;
        pos28: any;
        pos30: any;
    };
    toolTable: { [key: number]: any };
    coordinateSystemTable: any[];
    position: any;
    outputCommands: any[];
    N_ARC_CORRECTION: number;
    invertRadius: number;
    stopRunning: boolean;

    axisXYZ_0: string = 'x';
    axisXYZ_1: string = 'y';
    axisXYZ_linear: string = 'z';
    axisIJK_0: string = 'i';
    axisIJK_1: string = 'j';
    axisIJK_linear: string = 'k';
    plane_select: any;
    spindle_speed: any;

    constructor(machine: any) {
        // Mill - Mill, Lathe - Lathe, 3D Printer - Printer
        this.machineType = machine.mtype;
        this.modal = {
            motion: 0,                  // {G0,G1,G2,G3,G38.2,G80}
            feed_rate_mode: 94,         // {G93,G94}
            units: 1.0,                 // {G20,G21}  1in = 25.4mm
            distance: 90,               // {G90,G91}
            plane_select: 0,            // {G17,G18,G19}
            tool_length: 0,             // {G43.1,G49}
            coord_select: 0,            // {G54,G55,G56,G57,G58,G59}
            program_flow: 0,            // {M0,M1,M2,M30}
            coolant: 0,                 // {M7,M8,M9}
            spindle: 0,                 // {M3,M4,M5}
            cutter_comp: 40			   // {G40,G41,G42}
        };
        this.settings = {
            g0_speed: 10,			   // Speed for G0
            spindle_speed: 0,           // RPM
            feed_rate: null,            // Millimeters/min
            feed_rate93: 0,             // 1/F min
            tool: 0,                    // Tracks tool number.
            line_number: 0,             // Last line number sent
            machine_postion_g53: false, // If true the next modal command will use absolute position and set to false again
            coord_system: null,         // Current work coordinate system (G54+). Stores offset from absolute machine
            // position in mm. Loaded from EEPROM when called.  
            coord_offset: { x: 0, y: 0, z: 0 },// Retains the G92 coordinate offset (work coordinates) relative to
            // machine zero in mm. Non-persistent. Cleared upon reset and boot.    
            tool_length_offset: 0,      // Tracks tool length offset value when enabled.

            sys_abort: false,
            sys_rt_exec_state: 0,
            sys_rt_exec_alarm: 0,
            sys_suspend: false,
            pos28: machine.home1,
            pos30: machine.home2,
        };
        this.toolTable = {};
        this.coordinateSystemTable = [ // P0 active system, P1-P6 = G54-G59
            { x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 0, r: 0 },
            { x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 0, r: 0 }
        ];
        this.position = { ...this.settings.pos28 }; // Clone to avoid reference issues? Original was `this.settings.pos28`.
        // Wait, machine.home1 might be an object that could be mutated?
        // Let's assume shallow copy is safer if `pos28` is meant to be a starting state.
        // Actually original was `this.position = this.settings.pos28;`

        this.outputCommands = []; 		// {time:t,comand:cdata}

        // Coordinate system is P0
        this.settings.coord_system = this.coordinateSystemTable[0];

        this.N_ARC_CORRECTION = 0;

        this.invertRadius = 1;
        if (this.machineType == "Lathe") {
            this.invertRadius = -1;
            this.g18({ number: 18 } as any);
        }
        else if (this.machineType == "Mill") {
            this.g17({ number: 17 } as any);
        }
        else if (this.machineType == "3D Printer") {
            this.position.z = 0;
            this.g17({ number: 17 } as any);
        }
        this.stopRunning = false;
    }

    runCommand(cmd: Command) {
        if (!this.stopRunning)
            // @ts-ignore dynamic call
            return this[cmd.ctype! + cmd.number!](cmd);
    }

    getCommand() {
        return this.outputCommands.shift();
    }

    createTooTableEntry(tnumber: number) {
        this.toolTable[tnumber] = { x: 0, y: 0, z: 0, i: 0, j: 0, q: 0, r: 0 };
    }

    g9999(cmd: Command) { }
    m9999(cmd: Command) { }

    coordinatesToAbsolute(cmd: Command) {
        if (this.settings.machine_postion_g53 == true) {
            cmd.param.xyz.x = cmd.param.xyz.x === undefined ? this.position.x : cmd.param.xyz.x * this.modal.units;
            cmd.param.xyz.y = cmd.param.xyz.y === undefined ? this.position.y : cmd.param.xyz.y * this.modal.units;
            cmd.param.xyz.z = cmd.param.xyz.z === undefined ? this.position.z : cmd.param.xyz.z * this.modal.units;
            return;
        }
        if (this.modal.distance == 91) {
            cmd.param.xyz.x = cmd.param.xyz.x === undefined ? this.position.x : cmd.param.xyz.x * this.modal.units + this.position.x;
            cmd.param.xyz.y = cmd.param.xyz.y === undefined ? this.position.y : cmd.param.xyz.y * this.modal.units + this.position.y;
            cmd.param.xyz.z = cmd.param.xyz.z === undefined ? this.position.z : cmd.param.xyz.z * this.modal.units + this.position.z;
        }
        else {
            cmd.param.xyz.x = cmd.param.xyz.x === undefined ? this.position.x : cmd.param.xyz.x + this.settings.coord_system.x + this.settings.coord_offset.x;
            cmd.param.xyz.y = cmd.param.xyz.y === undefined ? this.position.y : cmd.param.xyz.y + this.settings.coord_system.y + this.settings.coord_offset.y;
            cmd.param.xyz.z = cmd.param.xyz.z === undefined ? this.position.z : cmd.param.xyz.z + this.settings.coord_system.z + this.settings.coord_offset.z;
        }
    }

    f0(cmd: Command) {
        if (this.modal.feed_rate_mode == 93)
            this.settings.feed_rate93 = cmd.param['f'];
        else
            this.settings.feed_rate = cmd.param['f'];
        return true;
    }

    s0(cmd: Command) {
        if (this.machineType != '3D Printer') {
            if (cmd.param.s < 0)
                throw new ErrorParser(cmd.line!.lineNumber, "Wrong S number. S cannot be a negative number", cmd.line!.rawLine);
            else
                this.spindle_speed = cmd.param.s;
        }
        return true;
    }

    move3dPrinter(cmd: Command) {
        if (this.machineType == "3D Printer" && cmd.param.a == undefined && cmd.param.e == undefined) {
            this.coordinatesToAbsolute(cmd);
            this.position.x = cmd.param.xyz.x;
            this.position.y = cmd.param.xyz.y;
            this.position.z = cmd.param.xyz.z;
            return true;
        }
        return false;
    }

    g0(cmd: Command) {
        if (this.move3dPrinter(cmd))
            return;
        this.coordinatesToAbsolute(cmd);
        let l: any = {
            x0: this.position.x, x1: cmd.param.xyz.x,
            y0: this.position.y, y1: cmd.param.xyz.y,
            z0: this.position.z, z1: cmd.param.xyz.z
        }
        this.position.x = l.x1;
        this.position.y = l.y1;
        this.position.z = l.z1;

        l.ctype = 0;
        l.cmd = cmd;
        if (this.machineType == "3D Printer" && cmd.param.a == undefined && cmd.param.e == undefined)
            return;
        this.outputCommands.push(l);
    }

    g1(cmd: Command) {
        if (this.move3dPrinter(cmd)) {
            return;
        }
        this.coordinatesToAbsolute(cmd);
        let l: any = {
            x0: this.position.x, x1: cmd.param.xyz.x,
            y0: this.position.y, y1: cmd.param.xyz.y,
            z0: this.position.z, z1: cmd.param.xyz.z
        }
        this.position.x = l.x1;
        this.position.y = l.y1;
        this.position.z = l.z1;
        l.ctype = 1;
        l.cmd = cmd;
        this.outputCommands.push(l);
    }

    g2(cmd: Command) {
        if (this.move3dPrinter(cmd))
            return;
        this.coordinatesToAbsolute(cmd);
        // @ts-ignore
        let x = cmd.param.xyz[this.axisXYZ_0] - this.position[this.axisXYZ_0];
        // @ts-ignore
        let y = cmd.param.xyz[this.axisXYZ_1] - this.position[this.axisXYZ_1];
        let z = cmd.param.xyz[this.axisXYZ_linear];

        if (cmd.param.r !== undefined) {
            cmd.param.r *= this.modal.units;
            let d2 = x * x + y * y;
            let h_x2_div_d = 4.0 * cmd.param.r * cmd.param.r - x * x - y * y;
            if (h_x2_div_d < 0)
                throw new ErrorParser(cmd.line!.lineNumber, "Wrong radius", cmd.line!.rawLine);
            h_x2_div_d = Math.sqrt(h_x2_div_d) / Math.sqrt(d2) * this.invertRadius;
            if (cmd.param.r < 0) {
                h_x2_div_d = -h_x2_div_d;
                cmd.param.r = -cmd.param.r;
            }
            cmd.param.ijk[this.axisIJK_0] = 0.5 * (x + (y * h_x2_div_d));
            cmd.param.ijk[this.axisIJK_1] = 0.5 * (y - (x * h_x2_div_d));
        }

        // @ts-ignore
        let center_axis0 = this.position[this.axisXYZ_0] + cmd.param.ijk[this.axisIJK_0];
        // @ts-ignore
        let center_axis1 = this.position[this.axisXYZ_1] + cmd.param.ijk[this.axisIJK_1];
        let r_axis0 = -cmd.param.ijk[this.axisIJK_0];  // Radius vector from center to current location
        let r_axis1 = -cmd.param.ijk[this.axisIJK_1];
        let rt_axis0 = cmd.param.xyz[this.axisXYZ_0] - center_axis0;
        let rt_axis1 = cmd.param.xyz[this.axisXYZ_1] - center_axis1;

        let arc_tolerance = 0.0002 // mm

        let angular_travel = Math.atan2(r_axis0 * rt_axis1 - r_axis1 * rt_axis0, r_axis0 * rt_axis0 + r_axis1 * rt_axis1);

        let segments = Math.floor(Math.abs(0.5 * angular_travel * cmd.param.r) /
            Math.sqrt(arc_tolerance * (2 * cmd.param.r - arc_tolerance)));
        let theta_per_segment = angular_travel / segments;
        // @ts-ignore
        let linear_per_segment = (cmd.param.xyz[this.axisXYZ_linear] - this.position[this.axisXYZ_linear]) / segments;

        let cos_T = 2.0 - theta_per_segment * theta_per_segment;
        let sin_T = theta_per_segment * 0.16666667 * (cos_T + 4.0);
        cos_T *= 0.5;

        let sin_Ti;
        let cos_Ti;
        let r_axisi;
        let i;
        let count = 0;

        for (i = 1; i < segments; i++) { // Increment (segments-1).

            if (count < this.N_ARC_CORRECTION) {
                // Apply vector rotation matrix. ~40 usec
                r_axisi = r_axis0 * sin_T + r_axis1 * cos_T;
                r_axis0 = r_axis0 * cos_T - r_axis1 * sin_T;
                r_axis1 = r_axisi;
                count++;
            }
            else {
                // Arc correction to radius vector. Computed only every N_ARC_CORRECTION increments. ~375 usec
                // Compute exact location by applying transformation matrix from initial radius vector(=-offset).
                cos_Ti = Math.cos(i * theta_per_segment);
                sin_Ti = Math.sin(i * theta_per_segment);
                r_axis0 = -cmd.param.ijk[this.axisIJK_0] * cos_Ti + cmd.param.ijk[this.axisIJK_1] * sin_Ti;
                r_axis1 = -cmd.param.ijk[this.axisIJK_0] * sin_Ti - cmd.param.ijk[this.axisIJK_1] * cos_Ti;
                count = 0;
            }

            let pos: any = {};
            pos[this.axisXYZ_0] = center_axis0 + r_axis0;
            pos[this.axisXYZ_1] = center_axis1 + r_axis1;
            pos[this.axisXYZ_linear] = linear_per_segment * i + z;

            let l: any = {
                x0: this.position.x, x1: pos.x,
                y0: this.position.y, y1: pos.y,
                z0: this.position.z, z1: pos.z
            }
            this.position.x = l.x1;
            this.position.y = l.y1;
            this.position.z = l.z1;
            l.ctype = 2;
            l.cmd = cmd;
            this.outputCommands.push(l);
        }

        let l: any = {
            x0: this.position.x, x1: cmd.param.xyz.x,
            y0: this.position.y, y1: cmd.param.xyz.y,
            z0: this.position.z, z1: cmd.param.xyz.z
        }
        this.position.x = l.x1;
        this.position.y = l.y1;
        this.position.z = l.z1;
        l.ctype = 2;
        l.cmd = cmd;
        this.outputCommands.push(l);

        this.position.x = cmd.param.xyz.x;
        this.position.y = cmd.param.xyz.y;
        this.position.z = cmd.param.xyz.z;
    }

    g3(cmd: Command) {
        if (this.move3dPrinter(cmd))
            return;
        this.coordinatesToAbsolute(cmd);
        // @ts-ignore
        let x = cmd.param.xyz[this.axisXYZ_0] - this.position[this.axisXYZ_0];
        // @ts-ignore
        let y = cmd.param.xyz[this.axisXYZ_1] - this.position[this.axisXYZ_1];
        let z = cmd.param.xyz[this.axisXYZ_linear];

        if (cmd.param.r !== undefined) {
            cmd.param.r *= this.modal.units;
            let d2 = x * x + y * y;
            let h_x2_div_d = 4.0 * cmd.param.r * cmd.param.r - x * x - y * y;
            if (h_x2_div_d < 0)
                throw new ErrorParser(cmd.line!.lineNumber, "Wrong radius", cmd.line!.rawLine);
            h_x2_div_d = -Math.sqrt(h_x2_div_d) / Math.sqrt(d2) * this.invertRadius;
            if (cmd.param.r < 0) {
                h_x2_div_d = -h_x2_div_d;
                cmd.param.r = -cmd.param.r;
            }
            cmd.param.ijk[this.axisIJK_0] = 0.5 * (x + (y * h_x2_div_d));
            cmd.param.ijk[this.axisIJK_1] = 0.5 * (y - (x * h_x2_div_d));
        }

        // @ts-ignore
        let center_axis0 = this.position[this.axisXYZ_0] + cmd.param.ijk[this.axisIJK_0];
        // @ts-ignore
        let center_axis1 = this.position[this.axisXYZ_1] + cmd.param.ijk[this.axisIJK_1];
        let r_axis0 = -cmd.param.ijk[this.axisIJK_0];  // Radius vector from center to current location
        let r_axis1 = -cmd.param.ijk[this.axisIJK_1];
        let rt_axis0 = cmd.param.xyz[this.axisXYZ_0] - center_axis0;
        let rt_axis1 = cmd.param.xyz[this.axisXYZ_1] - center_axis1;

        let arc_tolerance = 0.0002 // mm

        let angular_travel = Math.atan2(r_axis0 * rt_axis1 - r_axis1 * rt_axis0, r_axis0 * rt_axis0 + r_axis1 * rt_axis1);

        let segments = Math.floor(Math.abs(0.5 * angular_travel * cmd.param.r) /
            Math.sqrt(arc_tolerance * (2 * cmd.param.r - arc_tolerance)));
        let theta_per_segment = angular_travel / segments;
        // @ts-ignore
        let linear_per_segment = (cmd.param.xyz[this.axisXYZ_linear] - this.position[this.axisXYZ_linear]) / segments;

        let cos_T = 2.0 - theta_per_segment * theta_per_segment;
        let sin_T = theta_per_segment * 0.16666667 * (cos_T + 4.0);
        cos_T *= 0.5;

        let sin_Ti;
        let cos_Ti;
        let r_axisi;
        let i;
        let count = 0;

        for (i = 1; i < segments; i++) { // Increment (segments-1).

            if (count < this.N_ARC_CORRECTION) {
                // Apply vector rotation matrix. ~40 usec
                r_axisi = r_axis0 * sin_T + r_axis1 * cos_T;
                r_axis0 = r_axis0 * cos_T - r_axis1 * sin_T;
                r_axis1 = r_axisi;
                count++;
            }
            else {
                // Arc correction to radius vector. Computed only every N_ARC_CORRECTION increments. ~375 usec
                // Compute exact location by applying transformation matrix from initial radius vector(=-offset).
                cos_Ti = Math.cos(i * theta_per_segment);
                sin_Ti = Math.sin(i * theta_per_segment);
                r_axis0 = -cmd.param.ijk[this.axisIJK_0] * cos_Ti + cmd.param.ijk[this.axisIJK_1] * sin_Ti;
                r_axis1 = -cmd.param.ijk[this.axisIJK_0] * sin_Ti - cmd.param.ijk[this.axisIJK_1] * cos_Ti;
                count = 0;
            }

            let pos: any = {};
            pos[this.axisXYZ_0] = center_axis0 + r_axis0;
            pos[this.axisXYZ_1] = center_axis1 + r_axis1;
            pos[this.axisXYZ_linear] = linear_per_segment * i + z;

            let l: any = {
                x0: this.position.x, x1: pos.x,
                y0: this.position.y, y1: pos.y,
                z0: this.position.z, z1: pos.z
            }
            this.position.x = l.x1;
            this.position.y = l.y1;
            this.position.z = l.z1;
            l.ctype = 3;
            l.cmd = cmd;
            this.outputCommands.push(l);
        }

        let l: any = {
            x0: this.position.x, x1: cmd.param.xyz.x,
            y0: this.position.y, y1: cmd.param.xyz.y,
            z0: this.position.z, z1: cmd.param.xyz.z
        }
        this.position.x = l.x1;
        this.position.y = l.y1;
        this.position.z = l.z1;
        l.ctype = 3;
        l.cmd = cmd;
        this.outputCommands.push(l);

        this.position.x = cmd.param.xyz.x;
        this.position.y = cmd.param.xyz.y;
        this.position.z = cmd.param.xyz.z;
    }

    g4(cmd: Command) { }

    g10(cmd: Command) {
        let l = Math.round(cmd.param['l']);
        delete cmd.param['l'];
        let p = Math.round(cmd.param['p']);
        delete cmd.param['p'];
        // Set Tool Table
        if (l == 1) {
            if (this.toolTable[p] === undefined)
                throw new ErrorParser(cmd.line!.lineNumber, "Wrong G10 L1. Invalid P word", cmd.line!.rawLine);
            for (let k in cmd.param)
                this.toolTable[p][k] = cmd.param[k];
        }
        else if (l == 2) {
            if (p < 0 || p > 6)
                throw new ErrorParser(cmd.line!.lineNumber, "Wrong G10 L2. Invalid P word", cmd.line!.rawLine);
            for (let k in cmd.param)
                this.coordinateSystemTable[p][k] = cmd.param[k];
        }
    }

    g17(cmd: Command) {
        this.plane_select = cmd.number;
        this.axisXYZ_0 = 'x';
        this.axisXYZ_1 = 'y';
        this.axisXYZ_linear = 'z';
        this.axisIJK_0 = 'i';
        this.axisIJK_1 = 'j';
        this.axisIJK_linear = 'k';
    }

    g18(cmd: Command) {
        this.plane_select = cmd.number;
        this.axisXYZ_0 = 'x';
        this.axisXYZ_1 = 'z';
        this.axisXYZ_linear = 'y';
        this.axisIJK_0 = 'i';
        this.axisIJK_1 = 'k';
        this.axisIJK_linear = 'j';
    }

    g19(cmd: Command) {
        this.plane_select = cmd.number;
        this.axisXYZ_0 = 'y';
        this.axisXYZ_1 = 'z';
        this.axisXYZ_linear = 'x';
        this.axisIJK_0 = 'j';
        this.axisIJK_1 = 'k';
        this.axisIJK_linear = 'i';
    }

    g20(cmd: Command) {
        this.modal.units = 25.4;
    }

    g21(cmd: Command) {
        this.modal.units = 1.0;
    }

    g28(cmd: Command) { }
    g30(cmd: Command) { }

    g40(cmd: Command) {
        this.modal.cutter_comp = 40;
    }
    g41(cmd: Command) {
        this.modal.cutter_comp = 41;
    }
    g42(cmd: Command) {
        this.modal.cutter_comp = 42;
    }
    g43(cmd: Command) { }
    g49(cmd: Command) { }
    g53(cmd: Command) { }

    g54(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G54. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[1];
    }
    g55(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G55. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[2];
    }
    g56(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G56. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[3];
    }
    g57(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G57. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[4];
    }
    g58(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G58. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[5];
    }
    g59(cmd: Command) {
        if (this.modal.cutter_comp != 40)
            throw new ErrorParser(this.settings.line_number, "Wrong G59. Cutter compensation is on", "");
        this.settings.coord_system = this.coordinateSystemTable[6];
    }

    g61(cmd: Command) { }
    g64(cmd: Command) { }

    g90(cmd: Command) {
        this.modal.distance = 90;
    }
    g91(cmd: Command) {
        this.modal.distance = 91;
    }

    g92(cmd: Command) {
        for (let k in cmd.param.xyz)
            // @ts-ignore
            this.settings.coord_offset[k] = cmd.param.xyz[k] * this.modal.units;
    }

    g93(cmd: Command) {
        this.modal.feed_rate_mode = 93;
    }
    g94(cmd: Command) {
        this.modal.feed_rate_mode = 94;
        this.settings.feed_rate = null;
    }

    g98(cmd: Command) { }
    g99(cmd: Command) { }

    m0(cmd: Command) { }
    m1(cmd: Command) { }
    m2(cmd: Command) { }
    m3(cmd: Command) { }
    m4(cmd: Command) { }
    m5(cmd: Command) { }
    m6(cmd: Command) { }
    m7(cmd: Command) { }
    m8(cmd: Command) { }
    m9(cmd: Command) { }

    m30(cmd: Command) {
        this.stopRunning = true;
    }

    m48(cmd: Command) { }
    m49(cmd: Command) { }
    m60(cmd: Command) { }
    m82(cmd: Command) { }
    m83(cmd: Command) { }
    m104(cmd: Command) { }
    m109(cmd: Command) { }
}
