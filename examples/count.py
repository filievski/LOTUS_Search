import csv
import os

path="monuments/out/"
for file in os.listdir(path):
	readpath=path + file
	with open(readpath, 'rb') as csvfile:
		spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
		timeel=0.0
		dbp=0.0
		total=0.0
		for row in spamreader:
			try:
				timeel+=float(row[4])
				dbp+=float(row[6])
				total+=float(row[7])
			except:
				continue
	print timeel
	print dbp
	print total
