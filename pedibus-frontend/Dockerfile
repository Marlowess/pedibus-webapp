# base image
FROM node:12.2.0

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add app
COPY frontend/ /app

# install and cache app dependencies
# COPY frontend/package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@7.3.9

# Build in production mode
CMD ng serve --host 0.0.0.0 --aot --optimization

# start app
# CMD ng serve --host 0.0.0.0
