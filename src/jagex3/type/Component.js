import { getNamesByHash } from '#rsdata/enum/hashes.js';

class ServerActiveProperties {
    static getTargetMask(events) {
        return events >>> 11 & 0x7F;
    }

    constructor(events, targetParam) {
        this.events = events.toString(16);
        this.targetParam = targetParam;
    }
}

const vAlign = {
    0: 'top',
    1: 'centre',
    2: 'bottom'
};

const hAlign = {
    0: 'left',
    1: 'centre',
    2: 'right'
};

export class Component {
    static async decodeGroup(group, comArchive, spriteArchive) {
        const inter = {};

        const debugname = getNamesByHash(comArchive.groupNameHashes[group]);
        if (debugname.length) {
            inter.debugname = debugname.length > 1 ? debugname : debugname[0];
        }

        const children = [];
        const capacity = await comArchive.getGroupCapacity(group);
        if (capacity == 0) {
            return [];
        }

        const defs = [];

        for (let i = 0; i < capacity; i++) {
            const bytes = await comArchive.getFile(group, i);
            if (bytes) {
                const com = new Component();
                // com.id = (group << 16) + i;
                const debugname = getNamesByHash(comArchive.fileNameHashes[group][i]);
                if (debugname.length) {
                    com.debugname = debugname.length > 1 ? debugname : debugname[0];
                }
                com.root = group;
                com.com = i;
                if (bytes.data[0] === 255) {
                    if (i === 0) {
                        // defs.push('if3=yes', '');
                    }

                    com.decodeIf3(bytes);
                } else {
                    if (i === 0) {
                        defs.push('if3=no', '');
                    }

                    const decoded = com.decodeIf1(bytes, comArchive, spriteArchive);
                    defs.push(...decoded, '');
                }
                children[i] = com;
            }
        }

        if (defs.length) {
            return defs.join('\n');
        } else {
            inter.children = children;
            return inter;
        }
    }

    static decode(buf) {
        const com = new Component();
        if (buf.data[0] === 255) {
            com.decodeIf3(buf);
        } else {
            com.decodeIf1(buf);
        }
        return com;
    }

    decodeIf1(buf, comArchive, spriteArchive) {
        const def = [
            `[${this.debugname ?? 'com_' + this.com}]`
        ];

        this.if3 = false;

        this.type = buf.g1();
        switch (this.type) {
            case 0:
                def.push('type=layer');
                break;
            case 2:
                def.push('type=inv');
                break;
            case 3:
                def.push('type=rect');
                break;
            case 4:
                def.push('type=text');
                break;
            case 5:
                def.push('type=graphic');
                break;
            case 6:
                def.push('type=model');
                break;
            case 7:
                def.push('type=invtext');
                break;
            default:
                def.push(`type=${this.type}`);
                break;
        }

        this.buttonType = buf.g1();
        switch (this.buttonType) {
            case 0:
                break;
            case 1:
                def.push('buttontype=normal');
                break;
            case 2:
                def.push('buttontype=target');
                break;
            case 3:
                def.push('buttontype=close');
                break;
            case 4:
                def.push('buttontype=toggle');
                break;
            case 5:
                def.push('buttontype=select');
                break;
            case 6:
                def.push('buttontype=pause');
                break;
            default:
                def.push(`buttontype=${this.buttonType}`);
                break;
        }

        this.clientCode = buf.g2();
        if (this.clientCode != 0) {
            def.push(`clientcode=${this.clientCode}`);
        }

        this.x = buf.g2s();
        if (this.x != 0) {
            def.push(`x=${this.x}`);
        }

        this.y = buf.g2s();
        if (this.y != 0) {
            def.push(`y=${this.y}`);
        }

        this.width = buf.g2();
        if (this.width != 0) {
            def.push(`width=${this.width}`);
        }

        this.height = buf.g2();
        if (this.width != 0) {
            def.push(`height=${this.height}`);
        }

        this.xMode = 0;
        this.yMode = 0;
        this.widthMode = 0;
        this.heightMode = 0;

        this.alpha = buf.g1();
        if (this.alpha != 0) {
            def.push(`alpha=${this.alpha}`);
        }

        this.layer = buf.g2();
        if (this.layer === 65535) {
            this.layer = -1;
        } else {
            const debugname = getNamesByHash(comArchive.fileNameHashes[this.root][this.layer]);
            if (debugname.length) {
                def.push(`layer=${debugname.length > 1 ? debugname : debugname[0]}`);
            } else {
                def.push(`layer=com_${this.layer}`);
            }
        }

        this.overLayer = buf.g2();
        if (this.overLayer === 65535) {
            this.overLayer = -1;
        } else {
            const debugname = getNamesByHash(comArchive.fileNameHashes[this.root][this.overLayer]);
            if (debugname.length) {
                def.push(`overlayer=${debugname.length > 1 ? debugname : debugname[0]}`);
            } else {
                def.push(`overlayer=com_${this.overLayer}`);
            }
        }

        const comparatorCount = buf.g1();
        if (comparatorCount > 0) {
            this.scriptComparator = [];
            this.scriptOperand = [];

            for (let i = 0; i < comparatorCount; i++) {
                this.scriptComparator[i] = buf.g1();
                this.scriptOperand[i] = buf.g2();

                if (buf.pos > buf.length) {
                    throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (com: ${this.com})`);
                }
            }
        }

        const scriptCount = buf.g1();
        if (scriptCount > 0) {
            this.scripts = [];
            for (let i = 0; i < scriptCount; i++) {
                const opcodeCount = buf.g2();
                this.scripts[i] = [];

                if (buf.pos > buf.length) {
                    throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (com: ${this.com})`);
                }

                for (let j = 0; j < opcodeCount; j++) {
                    this.scripts[i][j] = buf.g2();
                    if (this.scripts[i][j] === 65535) {
                        this.scripts[i][j] = -1;
                    }

                    if (buf.pos > buf.length) {
                        throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (com: ${this.com})`);
                    }
                }
            }
        }

        if (comparatorCount > 0 || scriptCount > 0) {
            for (let i = 0; i < this.scripts.length; i++) {
                let opcount = 1;

                if (this.scripts[i].length === 1) {
                    // empty script
                    def.push(`script${i + 1}op1=\n`);
                }

                for (let j = 0; j < this.scripts[i].length - 1; j++) {
                    let str = `script${i + 1}op${opcount++}=`;

                    switch (this.scripts[i][j]) {
                        case 1: {
                            const stat = this.scripts[i][++j];
                            str += `stat_level,${stat}`;
                            break;
                        }
                        case 2: {
                            const stat = this.scripts[i][++j];
                            str += `stat_base_level,${stat}`;
                            break;
                        }
                        case 3: {
                            const stat = this.scripts[i][++j];
                            str += `stat_xp,${stat}`;
                            break;
                        }
                        case 4: {
                            const obj = this.scripts[i][++j];
                            const inv = this.scripts[i][++j];
                            str += `inv_count,inv_${inv},obj_${obj}`;
                            break;
                        }
                        case 5: {
                            const varp = this.scripts[i][++j];
                            str += `testvar,varp_${varp}`;
                            break;
                        }
                        case 6: {
                            const stat = this.scripts[i][++j];
                            str += `stat_xp_remaining,${stat}`;
                            break;
                        }
                        case 7: {
                            const varp = this.scripts[i][++j];
                            str += `op7,varp_${varp}`;
                            break;
                        }
                        case 8: {
                            str += 'combat_level';
                            break;
                        }
                        case 9: {
                            str += 'total_xp';
                            break;
                        }
                        case 10: {
                            const obj = this.scripts[i][++j];
                            const inv = this.scripts[i][++j];
                            str += `inv_contains,inv_${inv},obj_${obj}`;
                            break;
                        }
                        case 11: {
                            str += 'runenergy';
                            break;
                        }
                        case 12: {
                            str += 'runweight';
                            break;
                        }
                        case 13: {
                            const varp = this.scripts[i][++j];
                            const bit = this.scripts[i][++j];
                            str += `testbit,varp_${varp},${bit}`;
                            break;
                        }
                        case 14: {
                            const varbit = this.scripts[i][++j];
                            str += `testvarbit,varbit_${varbit}`;
                            break;
                        }
                        case 15: {
                            str += 'sub';
                            break;
                        }
                        case 16: {
                            str += 'div';
                            break;
                        }
                        case 17: {
                            str += 'mul';
                            break;
                        }
                        case 18: {
                            str += 'coordx';
                            break;
                        }
                        case 19: {
                            str += 'coordz';
                            break;
                        }
                        case 20: {
                            const value = this.scripts[i][++j];
                            str += `constant,${value.toString()}`;
                            break;
                        }
                    }

                    def.push(str);
                }

                if (this.scriptComparator && this.scriptComparator[i]) {
                    let str = `script${i + 1}=`;
                    switch (this.scriptComparator[i]) {
                        case 1:
                            str += 'eq';
                            break;
                        case 2:
                            str += 'lt';
                            break;
                        case 3:
                            str += 'gt';
                            break;
                        case 4:
                            str += 'neq';
                            break;
                    }
                    str += `,${this.scriptOperand[i]}`;
                    def.push(str);
                }
            }
        }

        let events = 0;
        if (this.type == 0) {
            this.scrollHeight = buf.g2(); // individual properties
            if (this.scrollHeight != 0) {
                def.push(`scrollheight=${this.scrollHeight}`);
            }

            this.hide = buf.g1() == 1;
            if (this.hide) {
                def.push('hide=yes');
            }
        }

        if (this.type == 1) {
            buf.g2();
            buf.g1();
        }

        if (this.type == 2) {
            this.widthMode = 3;
            this.heightMode = 3;

            const isDragTarget = buf.g1();
            if (isDragTarget == 1) {
                events = 0x10000000;
                def.push('isdragtarget=yes');
            }

            const interactable = buf.g1();
            if (interactable == 1) {
                events |= 0x40000000;
                def.push('interactable=yes');
            }

            const usable = buf.g1(); // isUseTarget? or is that "interactable"?
            if (usable == 1) {
                events |= 0x80000000;
                def.push('usable=yes');
            }

            const replaces = buf.g1();
            if (replaces == 1) {
                events |= 0x20000000;
                def.push('replaces=yes');
            }

            this.marginX = buf.g1();
            this.marginY = buf.g1();

            if (this.marginX != 0 || this.marginY != 0) {
                def.push(`margin=${this.marginX},${this.marginY}`);
            }

            this.invSlotOffsetY = [];
            this.invSlotOffsetX = [];
            this.invSlotGraphic = [];
            for (let i = 0; i < 20; i++) {
                if (buf.g1() == 1) {
                    this.invSlotOffsetX[i] = buf.g2s();
                    this.invSlotOffsetY[i] = buf.g2s();
                    this.invSlotGraphic[i] = buf.g4s();

                    const names = getNamesByHash(spriteArchive.groupNameHashes[this.font]);
                    let name = 'sprite_' + this.font;
                    if (name.length) {
                        name = names.length > 1 ? names : names[0];
                    }

                    if (this.invSlotOffsetX[i] != 0 || this.invSlotOffsetY[i] != 0) {
                        def.push(`slot${i + 1}=${name}:${com.invSlotOffsetX[i]},${com.invSlotOffsetY[i]}\n`);
                    } else {
                        def.push(`slot${i + 1}=${name}`);
                    }
                } else {
                    this.invSlotGraphic[i] = -1;
                }
            }

            this.iops = [];
            for (let i = 0; i < 5; i++) {
                const op = buf.gjstr();
                if (op.length > 0) {
                    this.iops[i] = op;
                    events |= 0x1 << (i + 23);
                    def.push(`option${i}=${op}`);
                }
            }
        }

        if (this.type == 3) {
            this.fill = buf.g1() == 1;
            if (this.fill) {
                def.push('fill=yes');
            }
        }

        if (this.type == 4 || this.type == 1) {
            this.halign = buf.g1();
            if (this.halign != 0) {
                def.push(`halign=${hAlign[this.halign]}`);
            }

            this.valign = buf.g1();
            if (this.valign != 0) {
                def.push(`valign=${vAlign[this.valign]}`);
            }

            this.lineHeight = buf.g1();
            if (this.lineHeight != 0) {
                def.push(`linehei=${this.lineHeight}`);
            }

            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            } else {
                const name = getNamesByHash(spriteArchive.groupNameHashes[this.font]);
                if (name.length) {
                    def.push(`font=${name.length > 1 ? name : name[0]}`);
                } else {
                    def.push(`font=sprite_${this.font}`);
                }
            }

            this.shadowed = buf.g1() == 1;
            if (this.shadowed) {
                def.push('shadowed=yes');
            }
        }

        if (this.type == 4) {
            this.text = buf.gjstr();
            if (this.text.length > 0) {
                def.push(`text=${this.text}`);
            }

            this.activeText = buf.gjstr();
            if (this.activeText.length > 0) {
                def.push(`activetext=${this.activeText}`);
            }
        }

        if (this.type == 1 || this.type == 3 || this.type == 4) {
            this.colour = buf.g4s();
            if (this.colour != 0) {
                def.push(`colour=0x${this.colour.toString(16).padStart(6, '0')}`);
            }
        }

        if (this.type == 3 || this.type == 4) {
            this.activeColour = buf.g4s();
            if (this.activeColour != 0) {
                def.push(`activecolour=0x${this.activeColour.toString(16).padStart(6, '0')}`);
            }

            this.overColour = buf.g4s();
            if (this.overColour != 0) {
                def.push(`overcolour=0x${this.overColour.toString(16).padStart(6, '0')}`);
            }

            this.activeOverColour = buf.g4s();
            if (this.activeOverColour != 0) {
                def.push(`activeovercolour=0x${this.activeOverColour.toString(16).padStart(6, '0')}`);
            }
        }

        if (this.type == 5) {
            this.graphic = buf.g4s();
            if (this.graphic != -1) {
                const name = getNamesByHash(spriteArchive.groupNameHashes[this.graphic]);
                if (name.length) {
                    def.push(`graphic=${name.length > 1 ? name : name[0]}`);
                } else {
                    def.push(`graphic=sprite_${this.graphic}`);
                }
            }

            this.activeGraphic = buf.g4s();
            if (this.activeGraphic != -1) {
                const name = getNamesByHash(spriteArchive.groupNameHashes[this.activeGraphic]);
                if (name.length) {
                    def.push(`activegraphic=${name.length > 1 ? name : name[0]}`);
                } else {
                    def.push(`activegraphic=sprite_${this.activeGraphic}`);
                }
            }
        }

        if (this.type == 6) {
            this.modelType = 1;
            this.anInt5909 = 1;

            this.model = buf.g2();
            if (this.model == 65535) {
                this.model = -1;
            } else {
                def.push(`model=model_${this.model}`);
            }

            this.activeModel = buf.g2();
            if (this.activeModel == 65535) {
                this.activeModel = -1;
            } else {
                def.push(`activemodel=model_${this.activeModel}`);
            }

            this.anim = buf.g2();
            if (this.anim == 65535) {
                this.anim = -1;
            } else {
                def.push(`anim=seq_${this.anim}`);
            }

            this.activeAnim = buf.g2();
            if (this.activeAnim == 65535) {
                this.activeAnim = -1;
            } else {
                def.push(`activeanim=seq_${this.activeAnim}`);
            }

            this.zoom = buf.g2();
            if (this.zoom != 0) {
                def.push(`zoom=${this.zoom}`);
            }

            this.xan = buf.g2();
            if (this.xan != 0) {
                def.push(`xan=${this.xan}`);
            }

            this.yan = buf.g2();
            if (this.yan != 0) {
                def.push(`yan=${this.yan}`);
            }
        }

        if (this.type == 7) {
            this.heightMode = 3;
            this.widthMode = 3;

            this.halign = buf.g1();
            if (this.halign != 0) {
                def.push(`halign=${this.halign}`);
            }

            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            } else {
                def.push(`font=${this.font}`);
            }

            this.shadowed = buf.g1() == 1;
            if (this.shadowed) {
                def.push('shadowed=yes');
            }

            this.colour = buf.g4s();
            if (this.colour != 0) {
                def.push(`colour=0x${this.colour.toString(16).padStart(6, '0')}`);
            }

            this.marginX = buf.g2();
            this.marginY = buf.g2();

            if (this.marginX != 0 || this.marginY != 0) {
                def.push(`margin=${this.marginX},${this.marginY}`);
            }

            const interactable = buf.g1();
            if (interactable == 1) {
                events |= 0x40000000;
                def.push('interactable=yes');
            }

            this.iops = new String[5];
            for (let i = 0; i < 5; i++) {
                const op = buf.gjstr();
                if (op.length > 0) {
                    this.iops[i] = op;
                    events |= 0x1 << i + 23;
                    def.push(`option${i}=${op}`);
                }
            }
        }

        if (this.type == 8) {
            this.text = buf.gjstr();
            if (this.text.length > 0) {
                def.push(`text=${this.text}`);
            }
        }

        if (this.buttonType == 2 || this.type == 2) {
            this.targetVerb = buf.gjstr();
            if (this.targetVerb.length > 0) {
                def.push(`targetverb=${this.targetVerb}`);
            }

            this.target = buf.gjstr();
            if (this.target.length > 0) {
                def.push(`target=${this.target}`);
            }

            const targetMask = buf.g2() & 0x3F;
            events |= targetMask << 11;
            if (targetMask != 0) {
                def.push(`targetmask=${targetMask.toString(16)}`);
            }
        }

        if (buf.pos > buf.length) {
            throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (com: ${this.com})`);
        }

        if (this.buttonType == 1 || this.buttonType == 4 || this.buttonType == 5 || this.buttonType == 6) {
            this.option = buf.gjstr();

            if (this.option.length == 0) {
                if (this.buttonType == 1) {
                    this.option = 'Ok';
                }
                if (this.buttonType == 4) {
                    this.option = 'Select';
                }
                if (this.buttonType == 5) {
                    this.option = 'Select';
                }
                if (this.buttonType == 6) {
                    this.option = 'Continue';
                }
            } else {
                def.push(`option=${this.option}`);
            }
        }

        if (this.buttonType == 1 || this.buttonType == 4 || this.buttonType == 5) {
            events |= 0x400000;
        }

        if (this.buttonType == 6) {
            events |= 0x1;
        }

        this.activeProperties = new ServerActiveProperties(events, -1);
        if (buf.pos !== buf.length) {
            throw new Error(`Buffer was not fully read: ${buf.pos} / ${buf.length} (com: ${this.com})`);
        }

        return def;
    }

    decodeIf3(buf) {
        this.if3 = true;
        buf.pos++;
        this.type = buf.g1();
        if ((this.type & 0x80) != 0) {
            this.type &= 127;
            buf.gjstr();
        }
        this.clientCode = buf.g2();
        this.x = buf.g2s();
        this.y = buf.g2s();
        this.width = buf.g2();
        this.height = buf.g2();
        this.widthMode = buf.g1b();
        this.heightMode = buf.g1b();
        this.xMode = buf.g1b();
        this.yMode = buf.g1b();
        this.layer = buf.g2();
        if (this.layer === 65535) {
            this.layer = -1;
        }
        this.hide = buf.g1() == 1;
        if (this.type == 0) {
            this.scrollWidth = buf.g2(); // individual properties
            this.scrollHeight = buf.g2(); // individual properties
            this.noClickThrough = buf.g1() == 1;
        }
        if (this.type == 5) {
            this.graphic = buf.g4s();
            this.angle = buf.g2();
            const spriteFlag = buf.g1();
            this.tiled = (spriteFlag & 0x1) != 0;
            this.alpha = (spriteFlag & 0x2) != 0;
            this.alpha = buf.g1();
            this.outline = buf.g1();
            this.graphicShadow = buf.g4s();
            this.vflip = buf.g1() == 1;
            this.hflip = buf.g1() == 1;
            this.colour = buf.g4s();
        }
        if (this.type == 6) {
            this.modelType = 1;
            this.model = buf.g2();
            if (this.model == 65535) {
                this.model = -1;
            }
            this.xoff2d = buf.g2s();
            this.yoff2d = buf.g2s();
            this.xan = buf.g2();
            this.yan = buf.g2();
            this.zan = buf.g2();
            this.zoom = buf.g2();
            this.anim = buf.g2();
            if (this.anim == 65535) {
                this.anim = -1;
            }
            this.orthogonal = buf.g1() == 1;
            this.aShort50 = buf.g2s();
            this.aShort49 = buf.g2s();
            this.ignoreDepthMask = buf.g1() == 1;
            if (this.widthMode != 0) {
                this.viewportWidth = buf.g2();
            }
            if (this.heightMode != 0) {
                this.viewportHeight = buf.g2();
            }
        }
        if (this.type == 4) {
            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            }
            this.text = buf.gjstr();
            this.lineHeight = buf.g1();
            this.halign = buf.g1();
            this.valign = buf.g1();
            this.shadowed = buf.g1() == 1;
            this.colour = buf.g4s();
        }
        if (this.type == 3) {
            this.colour = buf.g4s();
            this.fill = buf.g1() == 1;
            this.alpha = buf.g1();
        }
        if (this.type == 9) {
            this.lineWidth = buf.g1();
            this.colour = buf.g4s();
            this.lineDirection = buf.g1() == 1;
        }
        const targetMask = buf.g3();
        const keyCount = buf.g1();
        if (keyCount != 0) {
            this.keyCodes = new byte[10];
            this.keyPressDelay = new int[10];
            this.keyHeldMask = new byte[10];
            while (keyCount != 0) {
                const local493 = (keyCount >> 4) - 1;
                const local501 = buf.g1() | keyCount << 8;
                local501 &= 4095;
                if (local501 == 4095) {
                    this.keyPressDelay[local493] = -1;
                } else {
                    this.keyPressDelay[local493] = local501;
                }
                this.keyCodes[local493] = buf.g1b();
                this.keyHeldMask[local493] = buf.g1b();
                keyCount = buf.g1();
            }
        }
        this.opBase = buf.gjstr(); // active properties
        const local551 = buf.g1();
        const local555 = local551 >> 4;
        const ops = local551 & 0xF;
        if (ops > 0) {
            this.ops = [];
            for (let i = 0; i < ops; i++) {
                this.ops[i] = buf.gjstr();
            }
        }
        if (local555 > 0) {
            const local596 = buf.g1();
            this.opCursors = new int[local596 + 1];
            for (let i = 0; i < this.opCursors.length; i++) {
                this.opCursors[i] = -1;
            }
            this.opCursors[local596] = buf.g2();
        }
        if (local555 > 1) {
            const local638 = buf.g1();
            this.opCursors[local638] = buf.g2();
        }
        this.pauseText = buf.gjstr();
        if (this.pauseText === '') {
            this.pauseText = null;
        }
        let local661 = -1;
        this.dragDeadZone = buf.g1(); // active properties
        this.dragDeadTime = buf.g1(); // active properties
        this.dragRender = buf.g1() == 1;
        this.targetVerb = buf.gjstr(); // active properties
        if (ServerActiveProperties.getTargetMask(targetMask) != 0) {
            local661 = buf.g2();
            if (local661 == 65535) {
                local661 = -1;
            }
            this.targetCursorId = buf.g2();
            if (this.targetCursorId == 65535) {
                this.targetCursorId = -1;
            }
            this.cursorId = buf.g2();
            if (this.cursorId == 65535) {
                this.cursorId = -1;
            }
        }
        this.activeProperties = new ServerActiveProperties(targetMask, local661);
        this.onLoad = this.readArguments(buf);
        this.onMouseOver = this.readArguments(buf);
        this.onMouseLeave = this.readArguments(buf);
        this.onTargetLeave = this.readArguments(buf);
        this.onTargetEnter = this.readArguments(buf);
        this.onVarpTransmit = this.readArguments(buf);
        this.onInvTransmit = this.readArguments(buf);
        this.onStatTransmit = this.readArguments(buf);
        this.onTimer = this.readArguments(buf);
        this.onOp = this.readArguments(buf);
        this.onMouseRepeat = this.readArguments(buf);
        this.onClick = this.readArguments(buf);
        this.onClickRepeat = this.readArguments(buf);
        this.onRelease = this.readArguments(buf);
        this.onHold = this.readArguments(buf);
        this.onDrag = this.readArguments(buf);
        this.onDragComplete = this.readArguments(buf);
        this.onScrollWheel = this.readArguments(buf);
        this.onVarcTransmit = this.readArguments(buf);
        this.onVarcstrTransmit = this.readArguments(buf);
        this.varpTriggers = this.readTriggers(buf);
        this.inventoryTriggers = this.readTriggers(buf);
        this.statTriggers = this.readTriggers(buf);
        this.varcTriggers = this.readTriggers(buf);
        this.varcstrTriggers = this.readTriggers(buf);
        if (buf.pos !== buf.length) {
            throw new Error(`Buffer was not fully read: ${buf.pos} / ${buf.length} (com: ${this.com})`);
        }
    }

    readArguments(buf) {
        const len = buf.g1();
        if (len == 0) {
            return null;
        }

        let args = [];
        for (let i = 0; i < len; i++) {
            const type = buf.g1();
            if (type == 0) {
                args[i] = buf.g4s();
            } else if (type == 1) {
                args[i] = buf.gjstr();
            }
        }
        this.hasHook = true;
        return args;
    }

    readTriggers(buf) {
        const len = buf.g1();
        if (len == 0) {
            return null;
        }
        let triggers = [];
        for (let i = 0; i < len; i++) {
            triggers[i] = buf.g4s();
        }
        return triggers;
    }
}
