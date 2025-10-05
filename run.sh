#!/bin/sh


isPackagesInstalled=0
isEnvPresent=0


for item in $(ls -a)
do
    if [ $item == "node_modules" ]; then
        isPackagesInstalled=1

    elif [ $item == ".env" ]; then 
        isEnvPresent=1;

    fi
done 

# checking if dependencies have been installed
if [ $isPackagesInstalled == 0 ]; then
    npm install
fi


#check if env avialable before continuing
if [ $isEnvPresent == 0 ]; then 
    echo "No .env file present"

else 
    #building the project
    tsc
    #start http server
    npm start
fi





