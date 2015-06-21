# lodl_index
API of the textual index to the LOD Laundromat


#Example calls:
Candidates:
http://textindex.fii800.eculture.labs.vu.nl/candidates?query=Amsterdam%20Norwich

Fuzzy candidates:
http://textindex.fii800.eculture.labs.vu.nl/fuzzycandidates?query=Amsterdam%20Norwich


Identical resources:
http://textindex.fii800.eculture.labs.vu.nl/identical?query=http://dbpedia.org/resource/Airbus
(Just supply a certain resource URI to the parameter query. This returns resources to which your supplied resource is directly linked with a sameAs relation.)
