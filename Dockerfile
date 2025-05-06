FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["yarn", "start:prod"] 