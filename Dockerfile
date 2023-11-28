FROM oven/bun

# Copy the lock and package file
COPY bun.lockb . 
COPY package.json . 

# Install dependencies
RUN bun install

# Copy your source code
# If only files in the src folder changed, this is the only step that gets executed!
COPY command-plugins/ ./command-plugins/
COPY utils  ./utils/
COPY index.ts . 
COPY .env . 

CMD ["bun", "index.ts"]