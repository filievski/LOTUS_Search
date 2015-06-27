'''
Created on Jun 27, 2015
@author: Filip Ilievski
'''

import sys
import os
import urllib2
import csv

def lookup_literal(literal, language):
	url="http://textindex.fii800.d2s.labs.vu.nl/candidates?query=" + literal
	content = urllib2.urlopen(url).read()
	print content


if __name__ == '__main__':

	if len(sys.argv)<2:
		print "Too litle arguments... \n\nUsage: \npython ask_for_it.py [csv_data_folder]"
		sys.exit()

	path=sys.argv[1]

	for file in os.listdir(path):
		fullpath=path + "/" + file

		with open(fullpath, 'rb') as csvfile:
			spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
			for row in spamreader:
				if path=="monuments":
					lookup_literal(row[0], "nl")
				else: # CONLL or COLD conferences
					lookup_literal(row[0], "en")
				sys.exit()
