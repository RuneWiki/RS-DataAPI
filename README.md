This is a datamining-oriented API for RuneScape and Old School RuneScape. It can be used locally or via https://api.runewiki.org/.  
It utilizes [OpenRS2 Archive](https://archive.openrs2.org/)'s API to access archived cache data.

See [names.tsv](./names.tsv) for a static output of hash names for revision 530.

## Standalone Scripts

Check out [src/rt4/tools](./src/rt4/tools). The files there are scripts I've written to do very specific things. Like dumping all images in rev 930.

## Web API

This can be used locally (default port: 3000) or via https://api.runewiki.org/. The public version has an API rate limit of 10 requests per 5 seconds.  
Mass-dumping sprites is better suited running a script.

If you have any suggestions on features to add, feel free to reach out here or on Discord.

### Running Locally

1. Install Node 16+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`
4. Run `npm start`

### Query Options

|name|desc|
|-|-|
|openrs2|Internal OpenRS2 ID|
|rev|RuneScape Build Number (major)|
|match|Combined with rev - matches a specific index out of multiple openrs2 rev matches. e.g. `?rev=530&match=1`

### Routes

GET `/find`:  
Print openrs2 cache metadata. Useful to get the OpenRS2 ID and metadata.
ex: https://api.runewiki.org/find?rev=530

GET `/download`:  
Redirect to openrs2's disk.zip for a specific revision (dat2/idx)
ex: https://api.runewiki.org/download?rev=214

GET `/read/:archive/:group`:  
Download a decompressed group

GET `/hashes`:  
Generate name hashes for a cache in runestar format (tsv)  
ex: https://api.runewiki.org/hashes?rev=214

GET `/hashes/:archive`:  
Generate name hashes for a single archive in runestar format (tsv), returns a little faster in larger caches  
ex: https://api.runewiki.org/hashes/8?rev=930

GET `/dump/inv`:  
Dump inventory configs into a text format (confirmed up to rev 930)  
ex: https://api.runewiki.org/dump/inv?rev=718

GET `/dump/obj`:  
Dump object configs into a text format (confirmed up to rev 727)  
ex: https://api.runewiki.org/dump/obj?rev=530

GET `/count/:archive`:  
Count the number of groups in an archive

GET `/count/:archive/:group`:  
Count the number of files in a group

GET `/sprite/:group`:  
Convert a sprite into PNG format. Accepts group name, group ID, or spritesheet name (without the `,n` bit at the end)  
ex: https://api.runewiki.org/sprite/magicon?rev=530
