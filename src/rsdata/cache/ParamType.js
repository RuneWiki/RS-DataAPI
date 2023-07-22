const stats = [
    'attack', 'defence', 'strength', 'hitpoints', 'ranged', 'prayer',
    'magic', 'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking',
    'crafting', 'smithing', 'mining', 'herblore', 'agility', 'thieving',
    'slayer', 'farming', 'runecraft', 'hunter', 'construction', 'summoning',
];

export default class ParamType {
    static getType(code) {
        if (typeof code === 'number') {
            code = String.fromCharCode(code);
        }

        let type = '';
        switch (code) {
            case '1':
                type = 'boolean';
            case 'A':
                type = 'seq';
                break;
            case 'C':
                type = 'colour';
                break;
            case 'F':
                type = 'toplevelinterface';
                break;
            case 'H':
                type = 'locshape';
                break;
            case 'I':
                type = 'component';
                break;
            case 'J':
                type = 'struct';
                break;
            case 'K':
                type = 'idkit';
                break;
            case 'L':
                type = 'overlayinterface';
                break;
            case 'M':
                type = 'midi';
                break;
            case 'N':
                type = 'npc_mode';
                break;
            case 'O':
                type = 'namedobj';
                break;
            case 'P':
                type = 'synth';
                break;
            case 'R':
                type = 'area';
                break;
            case 'S':
                type = 'stat';
                break;
            case 'T':
                type = 'npc_stat';
                break;
            case '`':
                type = 'wma';
                break;
            case 'a':
                type = 'interface';
                break;
            case 'c':
                type = 'coord';
                break;
            case 'd':
                type = 'graphic';
                break;
            case 'f':
                type = 'fontmetrics';
                break;
            case 'g':
                type = 'enum';
                break;
            case 'i':
                type = 'int';
                break;
            case 'j':
                type = 'jingle';
                break;
            case 'k':
                type = 'char';
                break;
            case 'l':
                type = 'loc';
                break;
            case 'm':
                type = 'model';
                break;
            case 'n':
                type = 'npc';
                break;
            case 'o':
                type = 'obj';
                break;
            case 'p':
                type = 'player_uid';
                break;
            case 's':
                type = 'string';
                break;
            case 't':
                type = 'spotanim';
                break;
            case 'u':
                type = 'npc_uid';
                break;
            case 'v':
                type = 'inv';
                break;
            case 'x':
                type = 'texture';
                break;
            case 'y':
                type = 'category';
                break;
            case 'µ':
                type = 'mapelement';
                break;
            case '×':
                type = 'hitmark';
                break;
            case 'Ð':
                type = 'dbrow';
                break;
            case 'Ý':
                type = 'movespeed';
                break;
            case '-':
                type = 'entityoverlay';
                break;
            case '.':
                type = 'stringvector';
                break;
            default:
                type = code;
                console.log(`Unknown param type ${code}: ${code.charCodeAt(0)}`);
                break;
        }

        return type;
    }

    static prefixTypeValue(type, value) {
        switch (type) {
            case 'seq':
            case 'component':
            case 'idkit':
            case 'namedobj':
            case 'obj':
            case 'synth':
            case 'stat':
            case 'coord':
            case 'enum':
            case 'char':
            case 'loc':
            case 'model':
            case 'npc':
            case 'spotanim':
            case 'inv':
            case 'category':
            case 'struct':
                if (value === -1) {
                    return 'null';
                }
                break;
        }

        switch (type) {
            case 'seq':
                return 'seq_' + value;
            case 'component':
                return `interface_${(value >> 16) & 0xFFFF}:com_${value & 0xFFFF}`;
            case 'idkit':
                return 'idk_' + value;
            case 'namedobj':
            case 'obj':
                return 'obj_' + value;
            case 'synth':
                return 'sound_' + value;
            case 'stat':
                return stats[value] ?? value;
            case 'coord': {
                const level = value >> 28 & 0x3;
                const x = value >> 14 & 0x3FFF;
                const z = value & 0x3FFF;
                return `${level}_${x >> 6}_${z >> 6}_${x & 0x3F}_${z & 0x3F}`;
            }
            case 'enum':
                return 'enum_' + value;
            case 'char':
                return String.fromCharCode(value);
            case 'loc':
                return 'loc_' + value;
            case 'model':
                return 'model_' + value;
            case 'npc':
                return 'npc_' + value;
            case 'spotanim':
                return 'spotanim_' + value;
            case 'inv':
                return 'inv_' + value;
            case 'category':
                return 'category_' + value;
            case 'struct':
                return 'struct_' + value;
            default:
                return value;
        }
    }
}
