import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

// Type assertion as workaround
type MulterFile = Express.Multer.File;

interface CustomRequest extends express.Request {
  file?: MulterFile;
  body: {
    fullName: string;
    email: string;
    phone: string;
    coverLetter?: string;
    salaryExpectation: string;
  };
}

const app = express();
const upload = multer({ dest: 'uploads/' });
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit Application - Fixed handler signature
app.post(
    '/api/application',
    upload.single('resume'),
    (req: Request, res: Response): void => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'Resume is required' });
                return;
            }

            const application = {
                ...req.body,
                resumePath: req.file.path,
                createdAt: new Date().toISOString()
            };

            console.log('New application:', application);
            res.status(201).json({
                success: true,
                applicationId: Date.now().toString(36) + Math.random().toString(36).substr(2)
            });
        } catch (error) {
            console.error('Error submitting application:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
