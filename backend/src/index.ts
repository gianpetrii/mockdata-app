import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MockData API is running' });
});

// API routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
