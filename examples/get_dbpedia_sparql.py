import csv
import os, sys
from SPARQLWrapper import SPARQLWrapper, JSON
import re, urlparse
import time

sparql = SPARQLWrapper("http://dbpedia.org/sparql")

os.environ['LC_ALL'] = 'en_US.UTF-8'

def check_if_dbpedia_literal(literal):
	sparql.setQuery("SELECT ?resource WHERE { ?resource ?property \"" + literal + "\" }")
	sparql.setReturnFormat(JSON)
	results = sparql.query().convert()
	f=False
	for result in results["results"]["bindings"]:
    		if result is not None:
			f=True
			break
	return f

def urlEncodeNonAscii(b):
    return re.sub('[\x80-\xFF]', lambda c: '%%%02x' % ord(c.group(0)), b)

def iriToUri(iri):
    parts= urlparse.urlparse(iri)
    return urlparse.urlunparse(
        part.encode('idna') if parti==1 else urlEncodeNonAscii(part.encode('utf-8'))
        for parti, part in enumerate(parts)
    )

if __name__ == '__main__':

        if len(sys.argv)<2:
                print "Too litle arguments... \n\nUsage: \npython ask_for_it.py [csv_data_folder]"
                sys.exit()

        path=sys.argv[1]
	found=0
	all_queries=0
        for file in os.listdir(path):
                if file.endswith(".csv"):
			readpath=path + "/" + file
			with open(readpath, 'rb') as csvfile:
				spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
				for row in spamreader:
					print row[0]
					if check_if_dbpedia_literal(row[0].decode('utf-8')):
						found += 1
						print "found"
					all_queries+=1
					time.sleep(0.050)

	print found, all_queries
