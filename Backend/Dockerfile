#the image you want to pull including version number and os
FROM node:16-alpine

#changing the user from root to node
USER node

#make the directory as a node user and not root  
RUN mkdir /home/node/src

#setting the workdir(this is always set as root)
WORKDIR /home/node/src

#Copies everything from this folder to container (copy package.json first to maximise docker caching)
COPY --chown=node:node package.json package-lock.json /home/node/src/

#installs everything in the package-lock json in the container
RUN npm install

#Copies everything from this folder to container 
COPY --chown=node:node . /home/node/src/


EXPOSE 3000

CMD ["npm", "start"]
