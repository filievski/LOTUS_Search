# LOTUS: Linked Open Text Unleashed
API and web interface of LOTUS, award-winning full-text index to the LOD Laundromat, and the largest available LOD index today.

LOTUS was developed at VU University Amsterdam, as a collaboration between CLTL and the Knowledge Representation & Reasoning departments.

## Documentation

See http://lotus.lodlaundromat.org/docs for detailed description of the API parameters.

## Web interface

Also, try our web interface at http://lotus.lodlaundromat.org/ or http://lodsearch.org. 
Note: While the visual appearance of LOTUS has been changed since it has been presented at ESWC 2016, its functionality has been kept unchanged. The ESWC 2016 interface of LOTUS is still functional and can be accessed at http://lodsearch.org/eswc.

## Additional materials

 Video from ESWC 2016's presentation on LOTUS http://videolectures.net/eswc2016_ilievski_linked_data/

Research paper from ESWC 2016
https://link.springer.com/chapter/10.1007/978-3-319-34129-3_29

Slides from ESWC 2016's presentation on LOTUS
http://www.slideshare.net/FilipIlievski1/lotus-adaptive-text-search-for-big-linked-data
  
Workshop paper from the ISWC 2015 COLD Workshop
http://ceur-ws.org/Vol-1426/paper-06.pdf

## Awards

The LOTUS Semantic Search engine was awarded the 2nd place in the European Linked Open Data Competition 2016 (http://2016.semantics.cc/eldc).

## Installation guide

You are welcome to set up your own LOTUS engine. Please note that **setting a local copy of LOTUS requires both: to index a set of statements (see the LOTUS Indexer github[https://github.com/filipdbrsk/LOTUS_Indexer] for the indexing procedure used in the official LOTUS) and to set up a search API (using the code from this project)**. 

Provided that you have already prepared your LOTUS index with statements in ElasticSearch, you can easily set up this code to query that data with the same functionality as in the central LOTUS system. Steps:
1. Make sure that your version of Node.js is not too old (this code has been tested on v4.2 and v8.6.0.)
2. Run `npm install` or `npm install -g` to install all dependencies: `express`, `lodash/uniqBy` and `request`.
3. To start the LOTUS API server, simply run `node server.js`. Make sure the `query_url` variable in this script points to your own Elastic endpoint (currently, we use a protected endpoint whose authentication details we read from the file `config.json` - but setting `isCentralLOTUS` to false and setting your own `query_url` will do the trick for your own endpoint with your own configuration). Also, the port 8181 should be available, or you should change this setting in the final lines of the `server.js` script to another port that you are sure is free.

## Contact
Filip Ilievski (f.ilievski@vu.nl)
