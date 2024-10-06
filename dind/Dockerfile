# Use Docker DinD as the base image
FROM docker:latest

# Install Node.js (version 18 or your preferred version)
RUN apk add --no-cache nodejs npm

# Create a working directory for your Node.js app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose ports for the application and Docker API
EXPOSE 3000
EXPOSE 2375

# Set the environment variable to point to the Docker daemon
ENV DOCKER_HOST=tcp://localhost:2375

# Start Docker Daemon and the Node.js application
CMD ["sh", "-c", "dockerd --host=tcp://0.0.0.0:2375 --tls=false & sleep 5 && node index.js"]