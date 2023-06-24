## RT4-Data

Contains some datamining scripts based around my [RT4-Client](https://github.com/Pazaz/RT4-Client) (revision 530).  
The code here should work on 400-500 revs all the same and can easily switch by changing `OPENRS2_ID` inside `src/rt4/util/OpenRS2.js`.

See [names.tsv](./names.tsv) for a list of all the hash names I was able to identify.

## Web API

The web API interfaces with OpenRS2 to accelerate cache datamining.

```
Query parameters for all routes:
`openrs2`: internal OpenRS2 ID
`rev`: runescape build number
`match` (optional): use a specific index to match against multiple build numbers

All routes:
`/download`: redirect to openrs2 for a specific revision
`/find`: print openrs2 cache metadata
`/hashes`: name hashes for a cache in runestar format (tsv)

`/dump/inv`: Dump inventory configs into a text format
`/dump/obj`: Dump object configs into a text format

`/count/:group`
`/count/:group/:file`
```
