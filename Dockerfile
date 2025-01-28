# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the entire src directory
COPY src/ ./src/

# Expose port 8080
EXPOSE 8080

# Update the start command to point to the correct file
CMD ["node", "src/index.js"]