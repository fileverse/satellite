# satellite

## Setup

```bash
git clone <your-repo-url>
cd satellite
# add proper env variables
cp config/.env.example config/.env
npm install
```

## Run

```bash
npm run start:api
```

## Environment Variables

Create a `.env` file in the `config/` directory with the following variables:

- `PORT`: Server port (default: 8001)
- `IP`: Server IP (default: 127.0.0.1)
- `MONGOURI`: MongoDB connection string
- `REDIS_URI`: Redis connection string (optional)
- `NODE_ENV`: Environment (development, production, etc.)
