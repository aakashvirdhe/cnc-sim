
export class ErrorParser {
    line: number;
    message: string;
    data: string;

    constructor(line: number, message: string, data: string) {
        this.line = line;
        this.message = message;
        this.data = data;
    }

    toString() {
        return "Error on line " + this.line + ": " + this.message + "\n" + this.data;
    }
}

export class Command {
    ctype: string | null;
    mgroup: number | null;
    number: number | null;
    param: { ijk: any; xyz: any;[key: string]: any };
    line: GLine | null;
    x0: number = 0;
    y0: number = 0;
    z0: number = 0;
    x1: number = 0;
    y1: number = 0;
    z1: number = 0;

    constructor() {
        this.ctype = null; // g,m,f,s
        this.mgroup = null; // Modal groups
        this.number = null; // g or m number
        this.param = { ijk: {}, xyz: {} }; // Parameters
        this.line = null; // A pointer to the line
    }
}

export class GLine {
    coments: string[];
    lineNumber: number;
    rawLine: string;
    activeCommand: number | null;
    parser: Parser | undefined;

    constructor(line: string, parser?: Parser) {
        this.coments = [];
        this.lineNumber = 0;
        this.rawLine = line;
        this.activeCommand = null;
        this.parser = parser;
    }

    processLine() {
        if (!this.parser) return;
        let line = this.removeComment(this.rawLine);
        const splitLine = this.splitLine(line); // Renamed local var to avoid collision
        try {
            this.separeteCommands(splitLine);
        } catch (e) {
            console.log(e);
            throw e; // Re-throw to be caught by caller
        }
        this.activeCommand = this.parser.activeCommand;
    }

    removeComment(line: string) {
        // A comment can be anything inside left and right parenthesis or anything after a semicolon
        const re = /(;.*)|(\([^)]*\))/g;
        let m;

        while ((m = re.exec(line)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            this.coments.push(m[1]);
        }
        // Remove comments,line numbers and spaces
        return line.toLowerCase().replace(re, "").replace(/\s/g, "").replace(/n\d*/, "");
    }

    splitLine(line: string) {
        const re = /([a-z])([+-]?\d*\.?\d*)/g;
        let m;
        const result: any[] = [];
        while ((m = re.exec(line)) !== null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            let val = parseFloat(m[2]);
            if (m[1] == 'g' || m[1] == 'm') {
                if (val % 1 == 0)
                    val = Math.round(val);
                else
                    val = Math.round(val * 10);
            }
            result.push([m[1], val]);
        }
        return result;
    }

    separeteCommands(line: any[]) {
        if (!this.parser) return;
        const parametersList: any = {};
        const commandsUnsorted: any[] = [];

        for (let i = 0; i < line.length; i++) {
            const elem = line[i];
            if (elem[0] == 'g' || elem[0] == 'm' || elem[0] == 'f' || elem[0] == 's') {
                commandsUnsorted.push(elem);
            } else {
                parametersList[elem[0]] = elem[1];
            }
        }

        const ht: Command[] = new Array(24);
        let pos = 0;

        for (let i = 0; i < commandsUnsorted.length; i++) {
            const elem = commandsUnsorted[i];
            let c = new Command();
            c.ctype = elem[0];
            c.number = elem[1];
            let param; // Used in default cases

            switch (elem[0]) {
                case 'g':
                    switch (elem[1]) {
                        case 93: case 94:
                            this.parser.feedMode = elem[1];
                            c.mgroup = 5;
                            pos = 0;
                            break;
                        case 4:
                            if (!this.checkParameter(parametersList, c, 'p'))
                                throw new ErrorParser(this.lineNumber, "Wrong G4. Missing word P", this.rawLine);
                            if (c.param['p'] < 0)
                                throw new ErrorParser(this.lineNumber, "Wrong G4. P number must not be negative", this.rawLine);
                            c.mgroup = 0;
                            pos = 8;
                            break;
                        case 17: case 18: case 19:
                            c.mgroup = 2;
                            pos = 9;
                            break;
                        case 20: case 21:
                            c.mgroup = 6;
                            pos = 10;
                            break;
                        case 41: case 42: // Fallthrough
                            if (!this.checkParameter(parametersList, c, 'd'))
                                throw new ErrorParser(this.lineNumber, "Wrong G" + elem[1] + ". Missing word D", this.rawLine);
                        // eslint-disable-next-line no-fallthrough
                        case 40:
                            c.mgroup = 7;
                            pos = 11;
                            break;
                        case 43:
                            if (!this.checkParameter(parametersList, c, 'h'))
                                throw new ErrorParser(this.lineNumber, "Wrong G43. Missing word H", this.rawLine);
                        // eslint-disable-next-line no-fallthrough
                        case 49:
                            c.mgroup = 8;
                            pos = 12;
                            break;
                        case 54: case 55: case 56: case 57: case 58: case 59:
                            c.mgroup = 12;
                            pos = 13;
                            break;
                        case 61: case 64:
                            c.mgroup = 13;
                            pos = 14;
                            break;
                        case 90: case 91:
                            c.mgroup = 3;
                            pos = 15;
                            break;
                        case 98: case 99:
                            c.mgroup = 10;
                            pos = 16;
                            break;
                        case 30:
                            this.checkParameter(parametersList, c, 'p');
                            this.checkParameter(parametersList, c, 'h');
                        // eslint-disable-next-line no-fallthrough
                        case 28:
                            this.checkParameter(parametersList, c, 'x');
                            this.checkParameter(parametersList, c, 'y');
                            this.checkParameter(parametersList, c, 'z');
                            c.mgroup = 0;
                            pos = 17;
                            break;
                        case 10:
                            if (this.checkParameter(parametersList, c, 'l')) {
                                if (!this.checkParameter(parametersList, c, 'p'))
                                    throw new ErrorParser(this.lineNumber, "Wrong G10. Missing word P", this.rawLine);
                                this.checkParameter(parametersList, c, 'x');
                                this.checkParameter(parametersList, c, 'y');
                                this.checkParameter(parametersList, c, 'z');
                                this.checkParameter(parametersList, c, 'r');
                                if (c.param['l'] == 1 || c.param['l'] == 10 || c.param['l'] == 11) {
                                    this.checkParameter(parametersList, c, 'i');
                                    this.checkParameter(parametersList, c, 'j');
                                    this.checkParameter(parametersList, c, 'q');
                                }
                            }
                            else
                                throw new ErrorParser(this.lineNumber, "Wrong G10. Missing word L", this.rawLine);
                            c.mgroup = 0;
                            pos = 18;
                            break;
                        case 92:
                            let temp = false;
                            temp = this.checkParameter(parametersList, c, 'x') || temp;
                            temp = this.checkParameter(parametersList, c, 'y') || temp;
                            temp = this.checkParameter(parametersList, c, 'z') || temp;
                            temp = this.checkParameter(parametersList, c, 'e') || temp;
                            if (temp == false)
                                throw new ErrorParser(this.lineNumber, "Wrong G92. All axis words are omitted", this.rawLine);
                            c.mgroup = 0;
                            pos = 19;
                            break;
                        case 53:
                            c.mgroup = 0;
                            pos = 20;
                            break;
                        case 0: case 1: case 2: case 3:
                            this.parser.activeCommand = c.number;
                            c.mgroup = 1;
                            pos = 21;
                            break;
                        default:
                            c.number = 9999;
                            param = elem;
                            pos = 23;
                            break;
                    }
                    break;
                // Miscellaneous function
                case 'm':
                    switch (elem[1]) {
                        case 104:
                            pos = 3;
                            break;
                        case 6:
                            c.mgroup = 6;
                            pos = 4;
                            break;
                        case 3: case 4: case 5:
                            c.mgroup = 7;
                            pos = 5;
                            break;
                        case 7: case 8: case 9: case 109:
                            c.mgroup = 8;
                            pos = 6;
                            break;
                        case 48: case 49: case 82: case 83:
                            c.mgroup = 9;
                            pos = 7;
                            break;
                        case 0: case 1: case 2: case 30: case 60:
                            c.mgroup = 4;
                            pos = 22;
                            break;
                        default:
                            c.number = 9999;
                            param = elem;
                            pos = 23;
                            break;
                    }
                    break;
                // Feed rate
                case 'f':
                    c.number = 0;
                    c.param['f'] = elem[1];
                    pos = 1;
                    break;
                // Spindle speed or temperature
                case 's':
                    c.number = 0;
                    c.param['s'] = elem[1];
                    pos = 2;
                    break;
            }
            ht[pos] = c;
        }

        // Find axis words and generate a motion G code
        if (Object.keys(parametersList).length && this.parser.activeCommand !== null) {
            let temp = false;
            let temp2 = true;
            let c = new Command();
            temp = this.checkParameter(parametersList, c, 'x') || temp;
            temp = this.checkParameter(parametersList, c, 'y') || temp;
            temp = this.checkParameter(parametersList, c, 'z') || temp;
            this.checkParameter(parametersList, c, 'a');
            this.checkParameter(parametersList, c, 'e');
            if (this.parser.activeCommand == 2 || this.parser.activeCommand == 3) {
                temp2 = false;
                temp2 = this.checkParameter(parametersList, c, 'r') || temp2;
                temp2 = this.checkParameter(parametersList, c, 'i') || temp2;
                temp2 = this.checkParameter(parametersList, c, 'j') || temp2;
                temp2 = this.checkParameter(parametersList, c, 'k') || temp2;
            }
            if (temp == true && temp2 == true) {
                c.ctype = 'g';
                c.mgroup = 1;
                c.number = this.parser.activeCommand;
                // If G93 is active every line with G1,G2,G3 should have the F word 
                if (this.parser.feedMode == 93 && c.number != 0 && ht[1] === undefined)
                    throw new ErrorParser(this.lineNumber, "G93 is active but F word is missing", this.rawLine);
                ht[21] = c;
            }
            else
                delete ht[21]; // Undefined
        }
        // Fill the commands vector with the commands already sorted
        for (let i = 0; i < ht.length; i++) {
            if (ht[i] !== undefined) {
                ht[i].line = this;
                this.parser.commands.push(ht[i]);
            }
        }
    }

    checkParameter(parametersList: any, c: Command, parm: string) {
        if (parm in parametersList) {
            if (/x|y|z/.test(parm))
                c.param.xyz[parm] = parametersList[parm];
            else if (/i|j|k/.test(parm))
                c.param.ijk[parm] = parametersList[parm];
            else
                c.param[parm] = parametersList[parm];
            delete parametersList[parm];
            return true;
        }
        else
            return false;
    }
}

export class Parser {
    glines: GLine[];
    commands: Command[];
    activeCommand: number | null;
    feedMode: number | null;

    constructor() {
        this.glines = [];
        this.commands = [];
        this.activeCommand = null;
        this.feedMode = null;
    }

    getCommand() {
        return this.commands.shift();
    }

    parseLine(line: string) {
        let gline = new GLine(line, this);
        gline.lineNumber = this.glines.length + 1;
        gline.processLine();
        this.glines.push(gline);
    }

    parseCode(code: string) {
        const lines = code.split("\n");
        for (let i = 0; i < lines.length; i++) {
            this.parseLine(lines[i]);
        }
    }
}
