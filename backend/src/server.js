import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initDatabase } from './data/index.js';
import routes from './routes/index.js';
import { CLIENT_URL, PORT } from './config/env.js';

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Unexpected error' });
});

const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
