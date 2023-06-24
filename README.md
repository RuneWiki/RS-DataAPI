## RT4-Data

Contains some datamining scripts based around my [RT4-Client](https://github.com/Pazaz/RT4-Client) (revision 530).  
The code here should work on 400-500 revs all the same and can easily switch by changing `OPENRS2_ID` inside `src/rt4/util/OpenRS2.js`.

See [names.tsv](./names.tsv) for a list of all the hash names I was able to identify.

## Web API

The web API interfaces with OpenRS2 to accelerate cache datamining.

```
/hashes?rev=
/dump/inv?rev=
/dump/obj?rev=
/count/:group?rev=
/count/:group/:file?rev=
```
