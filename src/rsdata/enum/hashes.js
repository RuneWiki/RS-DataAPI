import fs from 'fs';

export function hashCode(str) {
    // str = str.toString();

    let hash = 0;
    // str = str.toLowerCase();
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + str.charCodeAt(i) - hash) | 0;
    }
    return hash;
}

let master = {};

function addHash(name) {
    let hash = hashCode(name);

    if (!master[hash]) {
        master[hash] = [];
    }

    if (master[hash].indexOf(name) === -1) {
        master[hash].push(name);
    }
}

export function initHashes() {
    // our own reversed hashes
    let found = fs.readFileSync('config/hashes/found.tsv', 'ascii').replace(/\r/g, '').split('\n');
    for (let i = 0; i < found.length; i++) {
        let [hash, ...names] = found[i].split('\t');

        master[hash] = [];
        for (let j = 0; j < names.length; j++) {
            master[hash].push(names[j]);
        }
    }

    // seed with known names from OSRS
    fs.readFileSync('config/hashes/osrs.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        // some do not have a name
        if (parts.length > 3 && parts[4].length) {
            addHash(parts[4]);
        }
    });

    // seed with interface names from RS2
    fs.readFileSync('config/hashes/leanbow.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        addHash(parts[1]);
    });

    // seed with known late-era RS2/RS3 names
    fs.readFileSync('config/hashes/walied.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        // some do not have a name
        if (parts.length > 3 && parts[4].length) {
            addHash(parts[4]);
        }
    });

    fs.readFileSync('config/hashes/walied.individual.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(name => {
        addHash(name);
    });

    fs.readFileSync('config/hashes/walied.individual.components.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(name => {
        addHash(name);
    });

    // seed with known names from openrs2
    fs.readFileSync('config/hashes/openrs2.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        addHash(parts[1]);
    });

    // seed with names from greg
    fs.readFileSync('config/hashes/greg.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        // some do not have a name
        if (parts.length > 3 && parts[4] && parts[4].length) {
            addHash(parts[4]);
        }
    });

    // seed with names from chex
    fs.readFileSync('config/hashes/chex.tsv', 'ascii').replace(/\r/g, '').split('\n').forEach(x => {
        let parts = x.split('\t');

        // some do not have a name
        if (parts.length > 3 && parts[4] && parts[4].length) {
            addHash(parts[4]);
        }
    });

    // expand sprite groups
    Object.keys(master).forEach(hash => {
        let names = master[hash];

        for (let i = 0; i < names.length; i++) {
            if (names[i].indexOf(',') !== -1) {
                if (names[i].indexOf('[') !== -1) {
                    continue;
                }

                let parts = names[i].split(',');

                addHash(`${parts[0]}`);
                for (let j = 0; j < 120; j++) {
                    addHash(`${parts[0]},${j}`);
                }
            }
        }
    });

    // 194-377
    let oldEngine = [
        // title
        'index.dat',
        'logo.dat',
        'p11.dat',
        'p12.dat',
        'b12.dat',
        'q8.dat',
        'runes.dat',
        'title.dat',
        'titlebox.dat',
        'titlebutton.dat',
        // seen in 274
        'p11_full.dat',
        'p12_full.dat',
        'b12_full.dat',
        'q8_full.dat',

        // config
        'flo.dat',
        'flo.idx',
        'idk.dat',
        'idk.idx',
        'loc.dat',
        'loc.idx',
        'npc.dat',
        'npc.idx',
        'obj.dat',
        'obj.idx',
        'seq.dat',
        'seq.idx',
        'spotanim.dat',
        'spotanim.idx',
        'varp.dat',
        'varp.idx',
        // seen in 254
        'varbit.dat',
        'varbit.idx',
        // seen in 274
        'mesanim.dat',
        'mesanim.idx',
        'mes.dat',
        'mes.idx',
        'param.dat',
        'param.idx',
        'hunt.dat',
        'hunt.idx',

        // interface
        'data',

        // media
        'backbase1.dat',
        'backbase2.dat',
        'backhmid1.dat',
        'backhmid2.dat',
        'backleft1.dat',
        'backleft2.dat',
        'backright1.dat',
        'backright2.dat',
        'backtop1.dat',
        'backtop2.dat',
        'backvmid1.dat',
        'backvmid2.dat',
        'backvmid3.dat',
        'chatback.dat',
        'combatboxes.dat',
        'combaticons.dat',
        'combaticons2.dat',
        'combaticons3.dat',
        'compass.dat',
        'cross.dat',
        'gnomeball_buttons.dat',
        'headicons.dat',
        'hitmarks.dat',
        // index.dat
        'invback.dat',
        'leftarrow.dat',
        'magicoff.dat',
        'magicoff2.dat',
        'magicon.dat',
        'magicon2.dat',
        'mapback.dat',
        'mapdots.dat',
        'mapflag.dat',
        'mapfunction.dat',
        'mapscene.dat',
        'miscgraphics.dat',
        'miscgraphics2.dat',
        'miscgraphics3.dat',
        'prayerglow.dat',
        'prayeroff.dat',
        'prayeron.dat',
        'redstone1.dat',
        'redstone2.dat',
        'redstone3.dat',
        'rightarrow.dat',
        'scrollbar.dat',
        'sideicons.dat',
        'staticons.dat',
        'staticons2.dat',
        'steelborder.dat',
        'steelborder2.dat',
        'sworddecor.dat',
        'tradebacking.dat',
        'wornicons.dat',
        // seen in 254
        'mapmarker.dat',
        'mod_icons.dat',
        'mapedge.dat',
        // seen in 336
        'blackmark.dat',
        'button_brown.dat',
        'button_brown_big.dat',
        'button_red.dat',
        'chest.dat',
        'coins.dat',
        'headicons_hint.dat',
        'headicons_pk.dat',
        'headicons_prayer.dat',
        'key.dat',
        'keys.dat',
        'leftarrow_small.dat',
        'letter.dat',
        'number_button.dat',
        'overlay_duel.dat',
        'overlay_multiway.dat',
        'pen.dat',
        'rightarrow_small.dat',
        'startgame.dat',
        'tex_brown.dat',
        'tex_red.dat',
        'titlescroll.dat',

        // models (225 and before)
        'base_head.dat',
        'base_label.dat',
        'base_type.dat',
        'frame_del.dat',
        'frame_head.dat',
        'frame_tran1.dat',
        'frame_tran2.dat',
        'ob_axis.dat',
        'ob_face1.dat',
        'ob_face2.dat',
        'ob_face3.dat',
        'ob_face4.dat',
        'ob_face5.dat',
        'ob_head.dat',
        'ob_point1.dat',
        'ob_point2.dat',
        'ob_point3.dat',
        'ob_point4.dat',
        'ob_point5.dat',
        'ob_vertex1.dat',
        'ob_vertex2.dat',

        // versionlist (introduced in 234)
        'anim_crc',
        'anim_index',
        'anim_version',
        'map_crc',
        'map_index',
        'map_version',
        'midi_crc',
        'midi_index',
        'midi_version',
        'model_crc',
        'model_index',
        'model_version',

        // textures
        // index.dat
        '0.dat',
        '1.dat',
        '2.dat',
        '3.dat',
        '4.dat',
        '5.dat',
        '6.dat',
        '7.dat',
        '8.dat',
        '9.dat',
        '10.dat',
        '11.dat',
        '12.dat',
        '13.dat',
        '14.dat',
        '15.dat',
        '16.dat',
        '17.dat',
        '18.dat',
        '19.dat',
        '20.dat',
        '21.dat',
        '22.dat',
        '23.dat',
        '24.dat',
        '25.dat',
        '26.dat',
        '27.dat',
        '28.dat',
        '29.dat',
        '30.dat',
        '31.dat',
        '32.dat',
        '33.dat',
        '34.dat',
        '35.dat',
        '36.dat',
        '37.dat',
        '38.dat',
        '39.dat',
        '40.dat',
        '41.dat',
        '42.dat',
        '43.dat',
        '44.dat',
        '45.dat',
        '46.dat',
        '47.dat',
        '48.dat',
        '49.dat',

        // wordenc
        'badenc.txt',
        'domainenc.txt',
        'fragmentsenc.txt',
        'tldlist.txt',

        // sounds
        'sounds.dat'
    ];
    for (let i = 0; i < oldEngine.length; i++) {
        addHash(oldEngine[i]);
        addHash(oldEngine[i].replace('.dat', ''));
    }

    // all possible static maps
    for (let x = 0; x < 200; x++) {
        for (let z = 0; z < 200; z++) {
            addHash(`m${x}_${z}`);
            addHash(`l${x}_${z}`);
            addHash(`n${x}_${z}`);
            addHash(`e${x}_${z}`);
            addHash(`um${x}_${z}`);
            addHash(`ul${x}_${z}`);
        }
    }

    // autogenerated com names
    for (let i = 0; i < 512; i++) {
        addHash(`com_${i}`);
        addHash(`button_${i}`);
        addHash(`layer_${i}`);
        addHash(`title_${i}`);
    }

    // simple com names 0-255
    for (let i = 0; i < 256; i++) {
        addHash(i.toString());
    }

    // simple com names a-z a1-z32
    for (let a = 0; a < 26; a++) {
        let char = String.fromCharCode(97 + a);
        addHash(char);
        addHash(`_${char}`);
        addHash(` _${char}`);
        addHash(`roles_${char}`);

        // a1 b2 etc
        for (let b = 0; b < 32; b++) {
            addHash(`${char}${b}`);
        }
    }

    // quest journal lines
    for (let i = 0; i < 320; i++) {
        addHash(`qj${i}`);
    }
}

export function exportHashes(list) {
    let out = '';

    for (let hash in list) {
        out += hash + '\t' + list[hash].join('\t') + '\n';
    }

    return out;
}

export function getNamesByHash(hash) {
    return master[hash] ?? [];
}
