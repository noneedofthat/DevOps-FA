import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';

const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    /\.vercel\.app$/, // Matches any *.vercel.app deployment preview or production domain
  ],
  credentials: true
}));
app.use(express.json());

import fs from 'fs';
import path from 'path';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads folder statically
app.use('/uploads', express.static(uploadDir));

// Set up Multer for local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint for generating cryptographic token for team invites
app.post('/api/invite', (req, res) => {
  const { teamId } = req.body;
  if (!teamId) {
    return res.status(400).json({ error: 'teamId is required' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  res.json({ token, teamId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
});

// Secure file upload endpoint
app.post('/api/upload', upload.single('asset'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileInfo = {
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `http://localhost:5000/uploads/${req.file.filename}`
  };

  res.json({ message: 'File uploaded successfully', file: fileInfo });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
