# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable for the MongoDB connection string
# 'mongodb' is the hostname of the MongoDB container on the shared Docker network
ENV MONGO_URI=mongodb://mongodb:27017/testdb

# Run server.js when the container launches
CMD ["node", "server.js"]
