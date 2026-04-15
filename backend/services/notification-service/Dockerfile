FROM node:22-bullseye

WORKDIR /app

# Install system deps first (better caching)
RUN apt-get update && apt-get install -y openssl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (important for Prisma)
RUN npm install

# Copy app
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "index.js"]