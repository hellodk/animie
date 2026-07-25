export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
