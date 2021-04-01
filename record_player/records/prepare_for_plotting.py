import os
import shutil
import json
#srcPath = "C:/Users/a_k257/Desktop/lab1_all"

srcPath = os.getcwd()
srcFiles = os.listdir(srcPath)
plotData = []#[['correct','incorrect']]

# os.makedirs(srcPath + '/l1')
# os.makedirs(srcPath + '/l2')
# os.makedirs(srcPath + '/l3')


for f in srcFiles:
    #print(f)
    #print(type(f))
    if f.endswith('.js'):
        
        with open(f) as dataFile:
            data = dataFile.read()
            obj = data[data.find('{') : data.rfind('}')+1]
            jsonObj = json.loads(obj)
            usrcsore = [jsonObj['correctTotal'], jsonObj['mistakeTotal']]
            plotData.append(usrcsore)

print(plotData)
#file = open("data.txt", "w")
#file.write(str(plotData))
#file.close



	# currentFileName = f
	# currentFilePath = srcPath + '/' + currentFileName
	# trimmedName = currentFileName.split('_')[1] #currentFileName[:currentFileName.find('_')]
	# #studID = currentFileName.split('_')[1]
	# newFilePath = None

