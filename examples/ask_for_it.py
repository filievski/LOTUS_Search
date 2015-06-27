'''
Created on Jun 27, 2015
@author: Filip Ilievski
'''

import sys
import os


if __name__ == '__main__':

	if len(sys.argv)<2:
		print "Too litle arguments... \n\nUsage: \npython ask_for_it.py [csv_data_folder]"
		sys.exit()

	path=sys.argv[1]

	for file in os.listdir(path):
		print path + "/" + file
	
