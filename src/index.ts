import "dotenv/config";
import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';

const app = express();

// ✅ CORS setup - allows your React frontend to connect
app.use(cors({
  origin: [
    "http://localhost:5173",      // Vite (React) dev server
    "http://localhost:3000",
    "https://menda-production-bc57.up.railway.app",
    "https://menda.co.za",        // ← we'll update this when you buy the domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

registerRoutes(app);

const port = parseInt(process.env.PORT || '3000');

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});