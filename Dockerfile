FROM node:18

# Install required packages for node-canvas and fonts
RUN apt-get update && apt-get install -y \
  libcairo2-dev \
  libjpeg-dev \
  libpango1.0-dev \
  libgif-dev \
  librsvg2-dev \
  fontconfig \
  fonts-dejavu \
  && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy files into the container
COPY . .

# Install dependencies
RUN npm install

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
