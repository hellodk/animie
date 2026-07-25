import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { setupSocketServer } from './socket';

const app = express();
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/scenarios', (_req, res) => {
  const { SCENARIOS } = require('@kubequest/shared');
  res.json(SCENARIOS.map((s: { id: string; name: string; category: string; difficulty: number; estimatedMinutes: number; maxPoints: number; description: string }) => ({
    id: s.id, name: s.name, category: s.category,
    difficulty: s.difficulty, estimatedMinutes: s.estimatedMinutes,
    maxPoints: s.maxPoints, description: s.description,
  })));
});

const httpServer = http.createServer(app);
setupSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`🚀 KubeQuest server running on port ${config.port}`);
  console.log(`   Client URL: ${config.clientUrl}`);
});
