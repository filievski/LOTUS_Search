import csv
import os
import sys

path=sys.argv[1] + "/out/"
for file in os.listdir(path):
	readpath=path + file
	with open(readpath, 'rb') as csvfile:
		spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
		total=0.0
		for row in spamreader:
			try:
				if float(row[6])==0.0:
					total+=1.0
			except:
				continue
		print file, total
