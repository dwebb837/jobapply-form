import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

type MulterFile = Express.Multer.File;

interface CustomRequest extends express.Request {
    file?: MulterFile;
    body: {
        fullName: string;
        email: string;
        phone: string;
        coverLetter?: string;
        salaryExpectation: string;
        startDate?: string;
        noticePeriod?: string;
        isRemote?: string;
        officeLocation?: string;
    };
}

const app = express();
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.2.0'
    });
});

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
                createdAt: new Date().toISOString(),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            };

            console.log('New application:', {
                ...application,
                phone: '***',
                email: application.email.substring(0, 3) + '***',
                salaryExpectation: '***',
                startDate: application.startDate || 'N/A',
                noticePeriod: application.noticePeriod || 'N/A',
                isRemote: application.isRemote || 'false',
                ipAddress: application.ipAddress?.replace(/(\d+\.\d+\.)\d+\.\d+/, '$1***'),
                userAgent: application.userAgent?.substring(0, 50) + '...'
            });

            // Simulate processing delay
            setTimeout(() => {
                res.status(201).json({
                    success: true,
                    applicationId: Buffer.from(Date.now().toString()).toString('base64'),
                    nextSteps: [
                        'Application received',
                        'HR review pending',
                        'Background check authorization needed'
                    ]
                });
            }, 1500);

        } catch (error) {
            console.error('Error submitting application:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
});
