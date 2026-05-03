# Use Node.js LTS
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy server, shared, and other necessary folders
COPY server/ ./server/
COPY shared/ ./shared/

# Expose the port (Cloud Run sets PORT env)
EXPOSE 3001

# Command to run the server
CMD [ "node", "server/index.js" ]
