
import { Parser, Command } from './gcode/Parser';
import { Interpreter } from './gcode/Interpreter';

let parser: Parser;
let interpreter: Interpreter;

function init(header: any) {
    parser = new Parser();
    interpreter = new Interpreter(header.machine);
}

function runCode(data: any) {
    const code = data.code;
    const errList: string[] = [];
    try {
        parser.parseCode(code);
    } catch (e) {
        errList.push(String(e));
    }
    let cmd: Command | undefined;
    while (cmd = parser.getCommand()) {
        try {
            interpreter.runCommand(cmd);
        }
        catch (e) {
            errList.push(String(e));
        }
    }

    const l = interpreter.outputCommands.length * 2 * 3;
    const positions = new Float32Array(l);
    const color = new Float32Array(interpreter.outputCommands.length * 2);
    let i = 0;
    let c = 0;

    while (i < l) {
        const cmd = interpreter.getCommand();

        positions[i + 0] = cmd.x0;
        positions[i + 1] = cmd.y0;
        positions[i + 2] = cmd.z0;

        positions[i + 3] = cmd.x1;
        positions[i + 4] = cmd.y1;
        positions[i + 5] = cmd.z1;

        color[c] = cmd.ctype;
        color[c + 1] = cmd.ctype;

        c += 2;
        i += 6;
    }
    return { positions: positions, color: color, error: errList };
}

self.onmessage = function (ev) {
    init(ev.data.header);
    let result;
    result = runCode(ev.data);
    self.postMessage(result);
};
