# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the entire project directory
COPY . .

# Expose port 8080
EXPOSE 8080

# Start command pointing to the correct file
CMD ["node", "src/server.js"]