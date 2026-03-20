import app from './app';
import { env } from './config/env';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});