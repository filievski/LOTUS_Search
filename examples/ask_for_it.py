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

def lookup_literal(qtype, literal, language):
	url="http://lotus.lodlaundromat.org/" + qtype + "?" + urllib.urlencode({"query": literal, "langtag": language, "size": 100})
	raw_content = urllib2.urlopen(url).read()
	content=json.loads(raw_content)
	took=content["took"]
	num_hits=content["hits"]["total"]
	all_hits=[]
	total=0.0
	dbpedia=0.0
	global total_dbpedia
	global total_total
	global total_took
	for hit in content["hits"]["hits"]:
		if "dbpedia.org/resource" in hit["_source"]["subject"]:
			dbpedia+=1.0
			total_dbpedia+=1.0
		total+=1.0
		total_total+=1.0
		if total<=20.0:
			all_hits.append(hit["_source"]["subject"])
	try:
		dbp_share=dbpedia*100.0/total
	except:
		dbp_share=None
	total_took+=took
	return took, num_hits, dbp_share, all_hits

total_dbpedia=0.0
total_total=0.0
total_took=0.0

if __name__ == '__main__':

	if len(sys.argv)<2:
		print "Too litle arguments... \n\nUsage: \npython ask_for_it.py [csv_data_folder]"
		sys.exit()

	path=sys.argv[1]

	for file in os.listdir(path):
		if file.endswith(".csv"):
			readpath=path + "/" + file
			with open(readpath, 'rb') as csvfile:
				spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
				for qtype in ["phrase", "langphrase", "flexible", "langflexible"]:
					writepath=path + "/out." + qtype + "/" + file
					with open(writepath, "wb") as writefile:	
						spamwriter=csv.writer(writefile, delimiter=',', quotechar='"')
						spamwriter.writerow(["Literal", "Source", "Part of the text", "Entity type", "ES Time elapsed", "# ES Hits", "DBpedia % (in first 100)", "Hits"])
							for row in spamreader:
								if path=="monuments":
									time, num_hits, dbp_share, all_hits = lookup_literal(row[0], "nl")
									spamwriter.writerow([row[0], row[1], row[2], row[3], time, num_hits, dbp_share, all_hits])
								elif path=="aida": # CONLL or COLD conferences
									time, num_hits, dbp_share, all_hits = lookup_literal(row[0], "en")
									spamwriter.writerow([row[0], row[1], time, num_hits, dbp_share, all_hits])
					print qtype, total_dbpedia, total_total, total_took
					global total_dbpedia
					global total_total
					global total_took
					total_dbpedia=0.0
					total_total=0.0
					total_took=0.0
