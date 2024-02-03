import {} from 'dotenv/config.js';
import fs from 'fs';

import { getNamesByHash, initHashes } from '#rsdata/enum/hashes.js';

import { findCache } from '#rsdata/util/OpenRS2.js';
import Js5MasterIndex from '#rsdata/util/Js5.js';

initHashes();

const refJs5 = new Js5MasterIndex(findCache(-1, 1473)); // 667
const refCs2 = await refJs5.getArchive(12);

const refOpNames = new Map();
const refOpNamesFile = fs.readFileSync('config/cs2/667.opcodes.csv', 'ascii').replaceAll('\r', '');
for (const line of refOpNamesFile.split('\n')) {
    const [op, name] = line.split(',');
    refOpNames.set(parseInt(op), name);
}

const targetJs5 = new Js5MasterIndex(findCache(727));
// const targetJs5 = new Js5MasterIndex(findCache(-1, 1202)); // nxt beta
const targetCs2 = await targetJs5.getArchive(12);

class ClientScript {
    constructor(buf, switchSupport, longSupport, refScript, largeOps) {
        const trailerPos = this.decodeHeader(buf, switchSupport, longSupport);

        if (refScript && refScript.opcodes.length !== this.opcodes.length) {
            throw new Error('Opcode count mismatch: ' + refScript.opcodes.length + ' vs ' + this.opcodes.length);
        }

        let pc = 0;
        while (buf.pos < trailerPos) {
            const opcode = buf.g2();
            this.decodeInstruction(opcode, buf, longSupport, pc, refScript, largeOps);
            pc++;
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
        const instructions = buf.g4();
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
                        const value = buf.g4();
                        const offset = buf.g4();
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

    decodeInstruction(opcode, buf, longSupport, pc, refScript, largeOps) {
        const pushConstantStringOp = 3;
        const pushConstantLongOp = 54;
        const returnOp = 21;
        const popIntDiscardOp = 38;
        const popStringDiscardOp = 39;

        if (refScript && refScript.opcodes.length > 0) {
            if (opcode > 2000) {
                throw new Error('Likely bad opcode: ' + opcode);
            }

            const refOpcode = refScript.opcodes[pc];

            if (refOpcode === pushConstantStringOp) {
                if (this.stringOperands === null) {
                    this.stringOperands = new Array(this.opcodes.length);
                }

                this.stringOperands[pc] = buf.gjstr();
            } else if (longSupport && refOpcode === pushConstantLongOp) {
                if (this.longOperands === null) {
                    this.longOperands = new BigInt64Array(this.opcodes.length);
                }

                this.longOperands[pc] = buf.g8();
            } else {
                if (this.intOperands === null) {
                    this.intOperands = new Int32Array(this.opcodes.length);
                }

                if (largeOps) {
                    if (largeOps.has(opcode)) {
                        this.intOperands[pc] = buf.g4();
                    } else {
                        this.intOperands[pc] = buf.g1();
                    }
                } else {
                    if (refOpcode >= 150 || refOpcode === returnOp || refOpcode === popIntDiscardOp || refOpcode === popStringDiscardOp) {
                        this.intOperands[pc] = buf.g1();
                    } else {
                        this.intOperands[pc] = buf.g4();
                    }
                }
            }

            this.opcodes[pc++] = opcode;
        } else {
            if (opcode === pushConstantStringOp) {
                if (this.stringOperands === null) {
                    this.stringOperands = new Array(this.opcodes.length);
                }

                this.stringOperands[pc] = buf.gjstr();
            } else if (longSupport && opcode === pushConstantLongOp) {
                if (this.longOperands === null) {
                    this.longOperands = new BigInt64Array(this.opcodes.length);
                }

                this.longOperands[pc] = buf.g8();
            } else {
                if (this.intOperands === null) {
                    this.intOperands = new Int32Array(this.opcodes.length);
                }

                if (opcode >= 150 || opcode === returnOp || opcode === popIntDiscardOp || opcode === popStringDiscardOp) {
                    this.intOperands[pc] = buf.g1();
                } else {
                    this.intOperands[pc] = buf.g4();
                }
            }

            this.opcodes[pc] = opcode;
        }
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

fs.mkdirSync('data/cs2', { recursive: true });

const opcodeMap = new Map();
const matching = [];
for (let i = 0; i < refCs2.groupNameHashes.length; i++) {
    try {
        const ref = await refJs5.getGroup(12, i);
        const refLongSupport = true;
        const refScript = new ClientScript(ref, true, refLongSupport);

        const names = getNamesByHash(refCs2.groupNameHashes[i], true);
        refScript.name = names[0] ?? null;

        fs.writeFileSync('data/cs2/' + i + '.dat', ref.data);
        fs.writeFileSync('data/cs2/' + i + '.json', JSON.stringify(refScript, null, 2));

        if (refCs2.groupNameHashes[i] === targetCs2.groupNameHashes[i]) {
            const target = await targetJs5.getGroup(12, i);
            const targetLongSupport = true;

            let targetDelta = 0;
            if (!refLongSupport && refLongSupport !== targetLongSupport) {
                targetDelta = 4;
            }

            if (ref.length === target.length - targetDelta) {
                const targetScript = new ClientScript(target, true, targetLongSupport, refScript, null);
                targetScript.name = names[0] ?? null;
                fs.writeFileSync('data/cs2/' + i + '.target.json', JSON.stringify(targetScript, null, 2));

                for (let j = 0; j < targetScript.opcodes.length; j++) {
                    if (targetScript.opcodes[j] === 65535) {
                        console.log(i, j);
                    }

                    if (!opcodeMap.has(targetScript.opcodes[j])) {
                        opcodeMap.set(targetScript.opcodes[j], refScript.opcodes[j]);
                    }
                }

                matching.push({
                    id: i,
                    hash: refCs2.groupNameHashes[i],
                    name: names[0]
                });
            }
        }
    } catch (err) {
        console.error(i + ': ' + err.message);
        continue;
    }
}

fs.writeFileSync('data/cs2.json', JSON.stringify(matching, null, 2));

fs.writeFileSync('data/opcode.tsv', '727\t667\tName\n');
// const sortedMap = new Map([...opcodeMap.entries()].sort((a, b) => a[0] - b[0]));
const sortedMap = new Map([...opcodeMap.entries()].sort((a, b) => a[1] - b[1]));
for (const [targetOp, refOp] of sortedMap) {
    fs.appendFileSync('data/opcode.tsv', `${targetOp}\t${refOp}\t${refOpNames.get(refOp) ?? ''}\n`);
}
