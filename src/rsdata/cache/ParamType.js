export default class ParamType {
    static getType(code) {
        if (typeof code === 'number') {
            code = String.fromCharCode(code);
        }

        let type = '';
        switch (code) {
            case 'i':
                type = 'int';
                break;
            case 'g':
                type = 'enum';
                break;
            case 'd':
                type = 'graphic';
                break;
            case 'O':
                type = 'namedobj';
                break;
            case 'm':
                type = 'model';
                break;
            case 'S':
                type = 'stat';
                break;
            case 's':
                type = 'string';
                break;
            case 'o':
                type = 'obj';
                break;
            case 'l':
                type = 'loc';
                break;
            case 'I':
                type = 'component';
                break;
            case 'J':
                type = 'struct';
                break;
            case '1':
                type = 'boolean';
                break;
            case 'c':
                type = 'coord';
                break;
            case 'y':
                type = 'category';
                break;
            case 't':
                type = 'spotanim';
                break;
            case 'n':
                type = 'npc';
                break;
            case 'v':
                type = 'inv';
                break;
            case 'P':
                type = 'synth';
                break;
            case 'A':
                type = 'seq';
                break;
            case 'Ð':
                type = 'dbrow';
                break;
            case 'µ':
                type = 'mapelement';
                break;
            case 'K':
                type = 'idkit';
                break;
            case '`':
                type = 'maparea';
                break;
            case 'j':
                type = 'jingle';
                break;
            case 'M':
                type = 'midi';
                break;
            default:
                console.log(`Unknown param type ${code}: ${code.charCodeAt(0)}`);
                break;
        }

        return type;
    }

    static getTypeCode(type) {
    }
}
