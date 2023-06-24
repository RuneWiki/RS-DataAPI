## RT4-Data

Contains some datamining tools based around my [RT4-Client](https://github.com/Pazaz/RT4-Client) (revision 530). It's been adapted to work with OSRS and up to RS2 rev 727 as well.

See [names.tsv](./names.tsv) for a list of all the hash names I was able to identify.

## Web API

The web API interfaces with OpenRS2 to accelerate cache datamining.

```
Query parameters for all routes:
`openrs2`: internal OpenRS2 ID
`rev`: runescape build number
`match` (optional): use a specific index to match against multiple build numbers

All routes:
`/find`: print openrs2 cache metadata
`/download`: redirect to openrs2 for a specific revision
`/read/:archive/:group`: download a decompressed group

`/hashes`: name hashes for a cache in runestar format (tsv)
`/hashes/:archive`: name hashes for a single archive in runestar format (tsv)

`/dump/inv`: Dump inventory configs into a text format
`/dump/obj`: Dump object configs into a text format

`/count/:archive`: Count the number of groups in an archive
`/count/:archive/:group`: Count the number of files in a group

`/sprite/:group`: Convert a sprite into PNG format. Accepts group name, group ID, or spritesheet name (without the `,n` bit at the end)
```
