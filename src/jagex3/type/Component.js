import { getNamesByHash } from '#rsdata/enum/hashes.js';

class ServerActiveProperties {
    static getTargetMask(events) {
        return events >>> 11 & 0x7F;
    }

    constructor(events, targetParam) {
        this.events = events;
        this.targetParam = targetParam;
    }
}

export class Component {
    static async decodeGroup(archive, group) {
        const inter = {};

        const debugname = getNamesByHash(archive.groupNameHashes[group]);
        if (debugname.length) {
            inter.debugname = debugname.length > 1 ? debugname : debugname[0];
        }

        const children = [];
        const capacity = await archive.getGroupCapacity(group);
        if (capacity == 0) {
            return [];
        }

        for (let i = 0; i < capacity; i++) {
            const bytes = await archive.getFile(group, i);
            if (bytes) {
                const com = new Component();
                com.id = (group << 16) + i;
                const debugname = getNamesByHash(archive.fileNameHashes[group][i]);
                if (debugname.length) {
                    com.debugname = debugname.length > 1 ? debugname : debugname[0];
                }
                com.root = group;
                com.child = i;
                if (bytes.data[0] === 255) {
                    com.decodeIf3(bytes);
                } else {
                    com.decodeIf1(bytes);
                }
                children[i] = com;
            }
        }

        inter.children = children;
        return inter;
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

    decodeIf1(buf) {
        this.if3 = false;
        this.type = buf.g1();
        this.buttonType = buf.g1();
        this.clientCode = buf.g2();
        this.x = buf.g2s();
        this.y = buf.g2s();
        this.width = buf.g2();
        this.height = buf.g2();
        this.heightMode = 0;
        this.xMode = 0;
        this.yMode = 0;
        this.widthMode = 0;
        this.alpha = buf.g1();
        this.layer = buf.g2();
        if (this.layer === 65535) {
            this.layer = -1;
        } else {
            this.layer += this.id & 0xFFFF0000;
        }
        this.overLayer = buf.g2();
        if (this.overLayer === 65535) {
            this.overLayer = -1;
        }
        const comparatorCount = buf.g1();
        if (comparatorCount > 0) {
            this.scriptComparator = [];
            this.scriptOperand = [];
            for (let i = 0; i < comparatorCount; i++) {
                this.scriptComparator[i] = buf.g1();
                this.scriptOperand[i] = buf.g2();
                if (buf.pos > buf.length) {
                    throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (child: ${this.child})`);
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
                    throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (child: ${this.child})`);
                }
                for (let j = 0; j < opcodeCount; j++) {
                    this.scripts[i][j] = buf.g2();
                    if (this.scripts[i][j] === 65535) {
                        this.scripts[i][j] = -1;
                    }
                    if (buf.pos > buf.length) {
                        throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (child: ${this.child})`);
                    }
                }
            }
        }
        let events = 0;
        if (this.type == 0) {
            this.scroll = buf.g2();
            this.hide = buf.g1() == 1;
        }
        if (this.type == 1) {
            buf.g2();
            buf.g1();
        }
        if (this.type == 2) {
            this.widthMode = 3;
            this.heightMode = 3;
            const draggable = buf.g1();
            if (draggable == 1) {
                events = 0x10000000;
            }
            const interactable = buf.g1();
            if (interactable == 1) {
                events |= 0x40000000;
            }
            const usable = buf.g1();
            if (usable == 1) {
                events |= 0x80000000;
            }
            const local309 = buf.g1();
            if (local309 == 1) {
                events |= 0x20000000;
            }
            this.marginX = buf.g1();
            this.marginY = buf.g1();
            this.invSlotOffsetY = [];
            this.invSlotOffsetX = [];
            this.invSlotGraphic = [];
            for (let i = 0; i < 20; i++) {
                if (buf.g1() == 1) {
                    this.invSlotOffsetX[i] = buf.g2s();
                    this.invSlotOffsetY[i] = buf.g2s();
                    this.invSlotGraphic[i] = buf.g4s();
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
                }
            }
        }
        if (this.type == 3) {
            this.fill = buf.g1() == 1;
        }
        if (this.type == 4 || this.type == 1) {
            this.center = buf.g1();
            this.valign = buf.g1();
            this.linehei = buf.g1();
            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            }
            this.shadowed = buf.g1() == 1;
        }
        if (this.type == 4) {
            this.text = buf.gjstr();
            this.activeText = buf.gjstr();
        }
        if (this.type == 1 || this.type == 3 || this.type == 4) {
            this.colour = buf.g4s();
        }
        if (this.type == 3 || this.type == 4) {
            this.activeColour = buf.g4s();
            this.overColour = buf.g4s();
            this.activeOverColour = buf.g4s();
        }
        if (this.type == 5) {
            this.graphic = buf.g4s();
            this.activeGraphic = buf.g4s();
        }
        if (this.type == 6) {
            this.modelType = 1;
            this.model = buf.g2();
            this.anInt5909 = 1;
            if (this.model == 65535) {
                this.model = -1;
            }
            this.activeModel = buf.g2();
            if (this.activeModel == 65535) {
                this.activeModel = -1;
            }
            this.anim = buf.g2();
            if (this.anim == 65535) {
                this.anim = -1;
            }
            this.activeAnim = buf.g2();
            if (this.activeAnim == 65535) {
                this.activeAnim = -1;
            }
            this.zoom = buf.g2();
            this.xan = buf.g2();
            this.yan = buf.g2();
        }
        if (this.type == 7) {
            this.heightMode = 3;
            this.widthMode = 3;
            this.center = buf.g1();
            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            }
            this.shadowed = buf.g1() == 1;
            this.colour = buf.g4s();
            this.marginX = buf.g2();
            this.marginY = buf.g2();
            const interactable = buf.g1();
            if (interactable == 1) {
                events |= 0x40000000;
            }
            this.iops = new String[5];
            for (let i = 0; i < 5; i++) {
                const op = buf.gjstr();
                if (op.length > 0) {
                    this.iops[i] = op;
                    events |= 0x1 << i + 23;
                }
            }
        }
        if (this.type == 8) {
            this.text = buf.gjstr();
        }
        if (this.buttonType == 2 || this.type == 2) {
            this.actionVerb = buf.gjstr();
            this.action = buf.gjstr();
            const actionTarget = buf.g2() & 0x3F;
            events |= actionTarget << 11;
        }
        if (buf.pos > buf.length) {
            throw new Error(`Buffer read exceeded length: ${buf.pos} / ${buf.length} (child: ${this.child})`);
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
            }
        }
        if (this.buttonType == 1 || this.buttonType == 4 || this.buttonType == 5) {
            events |= 0x400000;
        }
        if (this.buttonType == 6) {
            events |= 0x1;
        }
        this.serverActiveProperties = new ServerActiveProperties(events, -1);
        if (buf.pos !== buf.length) {
            throw new Error(`Buffer was not fully read: ${buf.pos} / ${buf.length} (child: ${this.child})`);
        }
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
        } else {
            this.layer += this.id & 0xFFFF0000;
        }
        this.hide = buf.g1() == 1;
        if (this.type == 0) {
            this.scrollWidth = buf.g2();
            this.scroll = buf.g2();
            this.noClickThrough = buf.g1() == 1;
        }
        if (this.type == 5) {
            this.graphic = buf.g4s();
            this.angle = buf.g2();
            const local160 = buf.g1();
            this.alpha = (local160 & 0x2) != 0;
            this.tiled = (local160 & 0x1) != 0;
            this.alpha = buf.g1();
            this.outline = buf.g1();
            this.graphicShadow = buf.g4s();
            this.horizontalFlip = buf.g1() == 1;
            this.verticalFlip = buf.g1() == 1;
            this.colour = buf.g4s();
        }
        if (this.type == 6) {
            this.modelType = 1;
            this.model = buf.g2();
            if (this.model == 65535) {
                this.model = -1;
            }
            this.xoff = buf.g2s();
            this.yoff = buf.g2s();
            this.xan = buf.g2();
            this.yan = buf.g2();
            this.zan = buf.g2();
            this.zoom = buf.g2();
            this.anim = buf.g2();
            if (this.anim == 65535) {
                this.anim = -1;
            }
            this.ortho = buf.g1() == 1;
            this.aShort50 = buf.g2s();
            this.aShort49 = buf.g2s();
            this.aBoolean411 = buf.g1() == 1;
            if (this.widthMode != 0) {
                this.anInt5957 = buf.g2();
            }
            if (this.heightMode != 0) {
                this.anInt5920 = buf.g2();
            }
        }
        if (this.type == 4) {
            this.font = buf.g2();
            if (this.font == 65535) {
                this.font = -1;
            }
            this.text = buf.gjstr();
            this.linehei = buf.g1();
            this.center = buf.g1();
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
            this.linewid = buf.g1();
            this.colour = buf.g4s();
            this.lineDirection = buf.g1() == 1;
        }
        const local460 = buf.g3();
        const local464 = buf.g1();
        if (local464 != 0) {
            this.aByteArray74 = new byte[10];
            this.anIntArray662 = new int[10];
            this.aByteArray73 = new byte[10];
            while (local464 != 0) {
                const local493 = (local464 >> 4) - 1;
                const local501 = buf.g1() | local464 << 8;
                local501 &= 4095;
                if (local501 == 4095) {
                    this.anIntArray662[local493] = -1;
                } else {
                    this.anIntArray662[local493] = local501;
                }
                this.aByteArray74[local493] = buf.g1b();
                this.aByteArray73[local493] = buf.g1b();
                local464 = buf.g1();
            }
        }
        this.opBase = buf.gjstr();
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
            for (let local604 = 0; local604 < this.opCursors.length; local604++) {
                this.opCursors[local604] = -1;
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
        this.dragDeadZone = buf.g1();
        this.dragDeadTime = buf.g1();
        this.dragRender = buf.g1() == 1;
        this.actionVerb = buf.gjstr();
        if (ServerActiveProperties.getTargetMask(local460) != 0) {
            local661 = buf.g2();
            if (local661 == 65535) {
                local661 = -1;
            }
            this.anInt5930 = buf.g2();
            if (this.anInt5930 == 65535) {
                this.anInt5930 = -1;
            }
            this.anInt5890 = buf.g2();
            if (this.anInt5890 == 65535) {
                this.anInt5890 = -1;
            }
        }
        this.serverActiveProperties = new ServerActiveProperties(local460, local661);
        this.anObjectArray22 = this.readArguments(buf);
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
            throw new Error(`Buffer was not fully read: ${buf.pos} / ${buf.length} (child: ${this.child})`);
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
