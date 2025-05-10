import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Verify essential environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma client with error handling
let prisma;
try {
  prisma = new PrismaClient();
  // Test database connection
  await prisma.$connect();
  console.log('✅ Successfully connected to the database');
} catch (error) {
  console.error('❌ Failed to connect to the database:', error);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary with error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configuration loaded');
} catch (error) {
  console.error('❌ Failed to configure Cloudinary:', error);
  process.exit(1);
}

// Configure Multer with Cloudinary storage
let upload;
try {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'noticing_eye_photos',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
    }
  });
  upload = multer({ storage: storage });
  console.log('✅ Multer with Cloudinary storage configured');
} catch (error) {
  console.error('❌ Failed to configure Multer with Cloudinary:', error);
  process.exit(1);
}

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Initialize admin route - creates an admin if none exists
app.post('/api/init-admin', async (req, res) => {
  try {
    const { username, password, secretKey } = req.body;

    // Validate secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ message: 'Unauthorized: Invalid secret key' });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already initialized' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin in database
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: 'Admin created successfully', adminId: admin.id });
  } catch (error) {
    console.error('Error initializing admin:', error);
    res.status(500).json({ message: 'Server error initializing admin' });
  }
});

// Admin login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server login error' });
  }
});

// Upload photo route (protected)
app.post('/api/photos', authenticateAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, day, date } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Received photo data:', { title, description, day, date });

    const photo = await prisma.photo.create({
      data: {
        title,
        description,
        day: day || null,  // Ensure we handle the day field
        date,
        imageUrl: req.file.path,
        publicId: req.file.filename
      }
    });

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Server error uploading photo' });
  }
});

// Get all photos route
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'Server error fetching photos' });
  }
});

// Get single photo by ID route
app.get('/api/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await prisma.photo.findUnique({
      where: { id: Number(id) }
    });

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ message: 'Server error fetching photo' });
  }
});

// Update photo route (protected)
app.put('/api/photos/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, day, date } = req.body;

    console.log('Updating photo with data:', { id, title, description, day, date });

    const updatedPhoto = await prisma.photo.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        day: day || null,  // Ensure we handle the day field
        date,
      }
    });

    res.status(200).json({
      message: 'Photo updated successfully',
      photo: updatedPhoto
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ message: 'Server error updating photo' });
  }
});

// Delete photo route (protected)
app.delete('/api/photos/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the photo to get its public ID
    const photo = await prisma.photo.findUnique({
      where: { id: Number(id) }
    });

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Delete from Cloudinary if public ID exists
    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId);
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Server error deleting photo' });
  }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
});

// Start server with error handling
try {
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
  }).on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
