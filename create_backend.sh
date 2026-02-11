#!/bin/bash
cd backend

# Create index.js
cat > src/index.js << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRoutes from './routes/posts.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create middleware/errorHandler.js
cat > src/middleware/errorHandler.js << 'EOF'
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error'
    }
  });
}
EOF

echo "Backend files created successfully"
