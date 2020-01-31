#!/bin/bash
# Use this script for always getting the last version of pedibus server's code
# Written by Stefano Brilli, Tue Oct 15th 2019

# Remove mongo container
echo '> Removing mongo container...'
container=$(sudo docker ps -a --format="{{.Image}} {{.ID}}" | grep mongo | cut -d " " -f 2)
sudo docker rm $container 2> /dev/null
echo '> Done.'

# Remove mongo image
echo '> Removing pedibus frontend image...'
image=$(sudo docker images --format="{{.Repository}} {{.ID}}" | grep mongo | cut -d " " -f 2)
sudo docker rmi $image 2> /dev/null
echo '> Done.'

# Remove pedibus' container
echo '> Removing pedibus backend container...'
container=$(sudo docker ps -a --format="{{.Image}} {{.ID}}" | grep pedibus_backend | cut -d " " -f 2)
sudo docker rm $container 2> /dev/null
echo '> Done.'

# Remove pedibus' container
echo '> Removing pedibus frontend container...'
container=$(sudo docker ps -a --format="{{.Image}} {{.ID}}" | grep pedibus_frontend | cut -d " " -f 2)
sudo docker rm $container 2> /dev/null
echo '> Done.'

# Remove pedibus' image
echo '> Removing pedibus backend image...'
image=$(sudo docker images --format="{{.Repository}} {{.ID}}" | grep pedibus_backend | cut -d " " -f 2)
sudo docker rmi $image 2> /dev/null
echo '> Done.'

# Remove pedibus' image
echo '> Removing pedibus frontend image...'
image=$(sudo docker images --format="{{.Repository}} {{.ID}}" | grep pedibus_frontend | cut -d " " -f 2)
sudo docker rmi $image 2> /dev/null
echo '> Done.'