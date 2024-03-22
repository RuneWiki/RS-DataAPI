import fs from 'fs';

export default class ClientScript {
    static opcodes = new Map(); // opcode <-> command
    static largeOpcodes = new Set(); // opcode -> large
    static pushConstantStringOp = null;
    static pushConstantLongOp = null;

    static loadOpcodeMap(path) {
        const csv = fs.readFileSync(path, 'ascii')
            .replaceAll('\r', '').split('\n').map(line => line.split(',')).slice(1).filter(line => line.length > 1)
            .map(([command, opcode, large]) => [command, parseInt(opcode, 16), large === 'true']);

        for (const op of csv) {
            const [command, opcode, large] = op;

            this.opcodes.set(opcode, command);
            if (large) {
                this.largeOpcodes.add(opcode);
            }

            if (command === 'push_constant_string') {
                this.pushConstantStringOp = opcode;
            } else if (command === 'push_constant_long') {
                this.pushConstantLongOp = opcode;
            }
        }
    }

    constructor(buf, switchSupport, longSupport, objectStack) {
        const trailerPos = this.decodeHeader(buf, switchSupport, longSupport);

        let pc = 0;
        while (buf.pos < trailerPos) {
            const opcode = buf.g2();
            this.decodeInstruction(opcode, buf, pc, longSupport, objectStack);
            pc++;
        }

        if (buf.pos !== trailerPos) {
            console.log(this);
            throw new Error('Incomplete read');
        }
    }

    decodeHeader(buf, switchSupport, longSupport) {
        let trailerPos = 0;
        if (switchSupport) {
            buf.pos = buf.length - 2;
            const trailerLen = buf.g2();

            let extraDataLen = 12;
            if (longSupport) {
                extraDataLen += 4;
            }
            trailerPos = buf.length - 2 - trailerLen - extraDataLen;
        } else {
            buf.pos = buf.length - 12;
            trailerPos = buf.pos;
        }

        buf.pos = trailerPos;
        const instructions = buf.g4s();
        this.intLocals = buf.g2();
        this.stringLocals = buf.g2();
        if (longSupport) {
            this.longLocals = buf.g2();
        }
        this.intArgs = buf.g2();
        this.stringArgs = buf.g2();
        if (longSupport) {
            this.longArgs = buf.g2();
        }

        if (switchSupport) {
            const switches = buf.g1();

            if (switches > 0) {
                this.switchTables = new Array();

                for (let i = 0; i < switches; i++) {
                    let cases = buf.g2();
                    const table = new Map();

                    while (cases-- > 0) {
                        const value = buf.g4s();
                        const offset = buf.g4s();
                        table.set(value, offset);
                    }

                    this.switchTables[i] = Array.from(table.entries());
                }
            }
        }

        buf.pos = 0;
        this.opcodes = new Uint16Array(instructions);
        this.name = buf.fastgjstr();
        return trailerPos;
    }

    decodeInstruction(opcode, buf, pc, longSupport, objectStack) {
        if (opcode === ClientScript.pushConstantStringOp) {
            if (this.stringOperands === null) {
                this.stringOperands = new Array(this.opcodes.length);
            }

            if (objectStack) {
                const baseType = buf.g1();

                if (baseType === 0) {
                    this.intOperands[pc] = buf.g4s();
                } else if (baseType === 1) {
                    this.longOperands[pc] = buf.g8();
                } else if (baseType === 2) {
                    this.stringOperands[pc] = buf.gjstr();
                } else if (baseType === 3) {
                    throw new Error('Unsupported base var type');
                }
            } else {
                this.stringOperands[pc] = buf.gjstr();
            }
        } else if (longSupport && opcode === ClientScript.pushConstantLongOp) {
            if (this.longOperands === null) {
                this.longOperands = new BigInt64Array(this.opcodes.length);
            }

            this.longOperands[pc] = buf.g8();
        } else {
            if (this.intOperands === null) {
                this.intOperands = new Int32Array(this.opcodes.length);
            }

            if (ClientScript.largeOpcodes.has(opcode)) {
                this.intOperands[pc] = buf.g4s();
            } else {
                this.intOperands[pc] = buf.g1();
            }
        }

        this.opcodes[pc] = opcode;
    }

    name = null;
    trigger = 0;
    intArgs = 0;
    stringArgs = 0;
    longArgs = 0;
    intLocals = 0;
    stringLocals = 0;
    longLocals = 0;
    opcodes = null;
    intOperands = null;
    stringOperands = null;
    longOperands = null;
    switchTables = null;
}
