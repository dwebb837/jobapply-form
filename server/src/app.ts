import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

type MulterFile = Express.Multer.File;

interface Application {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    salaryExpectation: number;
    startDate?: string;
    noticePeriod?: number;
    isRemote: boolean;
    officeLocation?: string;
    resumePath: string;
    createdAt: string;
}

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

let applications: Application[] = [];

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.4.0'
    });
});

app.get('/api/applications', (req: Request, res: Response) => {
    try {
        const { search = '', sort = 'newest', page = 1, limit = 10 } = req.query;
        const parsedPage = Math.max(1, parseInt(page as string));
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit as string)));

        let filtered = applications.filter(app =>
            app.fullName.toLowerCase().includes((search as string).toLowerCase()) ||
            app.email.toLowerCase().includes((search as string).toLowerCase())
        );

        filtered.sort((a, b) => {
            if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sort === 'name') return a.fullName.localeCompare(b.fullName);
            return 0;
        });

        const startIndex = (parsedPage - 1) * parsedLimit;
        const paginated = filtered.slice(startIndex, startIndex + parsedLimit);

        res.json({
            total: filtered.length,
            page: parsedPage,
            totalPages: Math.ceil(filtered.length / parsedLimit),
            results: paginated.map(app => ({
                ...app,
                phone: '***' + app.phone.slice(-3),
                email: app.email.replace(/(.{3}).+@(.+)/, '$1***@$2'),
                salaryExpectation: Number(app.salaryExpectation.toFixed(2))
            }))
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/application', upload.single('resume'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Resume is required' });
            return;
        }

        const newApplication: Application = {
            id: Buffer.from(Date.now().toString()).toString('base64'),
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            salaryExpectation: parseFloat(req.body.salaryExpectation),
            startDate: req.body.startDate,
            noticePeriod: req.body.noticePeriod ? parseInt(req.body.noticePeriod) : undefined,
            isRemote: req.body.isRemote === 'true',
            officeLocation: req.body.officeLocation,
            resumePath: req.file.path,
            createdAt: new Date().toISOString()
        };

        applications = [newApplication, ...applications];

        console.log('New application:', {
            ...newApplication,
            phone: '***',
            email: newApplication.email.substring(0, 3) + '***',
            salaryExpectation: '***',
            ipAddress: req.ip?.replace(/(\d+\.\d+\.)\d+\.\d+/, '$1***'),
            userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
        });

        setTimeout(() => {
            res.status(201).json({
                success: true,
                applicationId: newApplication.id,
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
});
