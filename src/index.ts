import "dotenv/config";
import express from 'express';
import { registerRoutes } from './routes';

const app = express();
app.use(express.json());

registerRoutes(app);

const port = parseInt(process.env.PORT || '3000');

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});