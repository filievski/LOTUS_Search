import os, csv, json

path="monuments/out/"
for file in os.listdir(path):
	readpath=path + "/" + file
	hname="monuments/html/" + file + ".html"
	h="<html><head>" + hname + "</head><body>"
	with open(readpath, 'rb') as csvfile:
		spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
		for row in spamreader:
			print row[-1]
			try:
				ent_array=json.loads(row[-1])
			except:
				continue
			ent_string=row[0]
			
			h+="<br/>" + ent_string + " : "
			c=0
			for res in ent_array:
				c+=1
				h+=" <a href='" + res + "'>Link" + str(c) + "</a>"
	h+="</body></html>"
	w=open(hname, "w")
	w.write(h)
	w.close()
