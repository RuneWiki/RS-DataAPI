## RS-DataAPI

This is a datamining-oriented API for RuneScape and Old School RuneScape. It can be used locally or via https://api.runewiki.org/.  
It utilizes [OpenRS2 Archive](https://archive.openrs2.org/) to access all of its archived caches.

See [names.tsv](./names.tsv) for a static output of hash names for revision 530.

### Query Parameters

```
`openrs2`: internal OpenRS2 ID

`rev`: runescape build number

`match` (optional w/ rev): use a specific index to match against multiple build numbers, e.g. rev=530 matches openrs2=254 but you want openrs2=731, you can use rev=530&match=1. This is mainly intended for readability purposes.
```

### Routes

```
GET `/find`: print openrs2 cache metadata

GET `/download`: redirect to openrs2's disk.zip for a specific revision

GET `/read/:archive/:group`: download a decompressed group

GET `/hashes`: name hashes for a cache in runestar format (tsv)
ex: https://api.runewiki.org/hashes?rev=214

GET `/hashes/:archive`: name hashes for a single archive in runestar format (tsv), returns a little faster in larger caches

GET `/dump/inv`: Dump inventory configs into a text format (confirmed up to rev 930)
ex: https://api.runewiki.org/dump/obj?rev=718

GET `/dump/obj`: Dump object configs into a text format (confirmed up to rev 727)
ex: https://api.runewiki.org/dump/obj?rev=530

GET `/count/:archive`: Count the number of groups in an archive

GET `/count/:archive/:group`: Count the number of files in a group

GET `/sprite/:group`: Convert a sprite into PNG format. Accepts group name, group ID, or spritesheet name (without the `,n` bit at the end)
ex: https://api.runewiki.org/sprite/magicon?rev=530
```
