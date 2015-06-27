'''
Created on Jun 27, 2015
@author: Filip Ilievski
'''

import sys
import os
import urllib2
import csv
from KafNafParserPy import *

def get_entity_lemma(entity, parser):
	for ref in entity.get_references():
		terms=ref.get_span().get_span_ids()
	term_text=[]
	for t in terms:
		term=parser.get_term(t)
		target_ids=term.get_span().get_span_ids()
		for tid in target_ids:
            		term_text.append(parser.get_token(tid).get_text())
        res=(" ").join(term_text)
	return res

if __name__ == '__main__':

	path="/Users/filipilievski/Downloads/datasets/aida-conll-naf.gold/"

	csvfile=open('aida/aida_darkies.csv', 'wb')
	csvwriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
	
	dark=0
	all=0
	for file in os.listdir(path):
		fullpath=path + file

		parser=KafNafParser(fullpath)

		for entity in parser.get_entities():
			for extref in entity.get_external_references():
				if extref.get_reference()=="--NME--":
					lemma=get_entity_lemma(entity, parser)
					csvwriter.writerow([lemma, file])
					dark+=1
			all+=1
	print dark, all
