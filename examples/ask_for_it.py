'''
Created on Jun 27, 2015
@author: Filip Ilievski
'''

import sys
import os
import urllib
import urllib2
import csv
import json

def lookup_literal(literal, language):
	url="http://textindex.fii800.d2s.labs.vu.nl/candidates?" + urllib.urlencode({"query": literal})
	print url
	raw_content = urllib2.urlopen(url).read()
	content=json.loads(raw_content)
	took=content["took"]
	num_hits=content["hits"]["total"]
	return took, num_hits

if __name__ == '__main__':

	if len(sys.argv)<2:
		print "Too litle arguments... \n\nUsage: \npython ask_for_it.py [csv_data_folder]"
		sys.exit()

	path=sys.argv[1]

	for file in os.listdir(path):
		fullpath=path + "/" + file
		writepath=path + "/out." + file
		with open(writepath, "wb") as writefile:	
			spamwriter=csv.writer(writefile, delimiter=',', quotechar='"')
			spamwriter.writerow(["Literal", "Source", "Part of the text", "Entity type", "ES Time elapsed", "# ES Hits"])
			with open(fullpath, 'rb') as csvfile:
				spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
				for row in spamreader:
					if path=="monuments":
						time, num_hits=lookup_literal(row[0], "nl")
						spamwriter.writerow([row[0], row[1], row[2], row[3], time, num_hits])
					else: # CONLL or COLD conferences
						lookup_literal(row[0], "en")
