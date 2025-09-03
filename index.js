
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import setupSocket from "./socket.js";
import createApp from "./loaders/express.js";


import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8747;
const databaseURL = process.env.DATABASE_URL;

mongoose.set('strictQuery', true);
mongoose
  .connect(databaseURL, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Database connection successful");
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });

const app = createApp(__dirname);
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Security measures active: Rate limiting, CORS, Helmet, Input sanitization`);
});

server.timeout = 30000;
const io = setupSocket(server);
app.set("io", io);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

export default app;