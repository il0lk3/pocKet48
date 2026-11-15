import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Pocket48 backend running on http://${HOST}:${PORT}`);
});
