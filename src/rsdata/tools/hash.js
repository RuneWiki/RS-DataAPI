function hashCode(str) {
    str = str.toString();

    let hash = 0;
    str = str.toLowerCase();
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + str.charCodeAt(i) - hash) | 0;
    }
    return hash;
}

if (process.argv.length < 2) {
    console.log('Usage: node hash.js <name>');
    process.exit(1);
}

let name = process.argv[2];
console.log(hashCode(name));
