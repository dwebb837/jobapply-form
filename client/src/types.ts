import { z } from 'zod';

export const applicationSchema = z.object({
    fullName: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
    email: z.string()
        .email("Invalid email address")
        .endsWith(".com", "Only .com domains are accepted"),
    phone: z.string()
        .regex(/^\d{10}$/, "Invalid phone number (10 digits required)"),
    resume: z.instanceof(FileList)
        .refine(files => files.length > 0, "Resume is required")
        .refine(files => files[0].type === "application/pdf", "Only PDF files are accepted"),
    coverLetter: z.string()
        .max(2000, "Cover letter must be less than 2000 characters")
        .optional(),
    salaryExpectation: z.number()
        .min(30000, "Minimum salary is $30,000")
        .max(500000, "Maximum salary is $500,000"),
    startDate: z.date()
        .min(new Date(), "Start date must be in the future")
        .optional(),
    noticePeriod: z.number()
        .min(0, "Notice period cannot be negative")
        .optional(),
    isRemote: z.boolean().optional(),
    officeLocation: z.string().optional()
}).refine(data => {
    if (data.isRemote === false && !data.officeLocation) {
        return false;
    }
    return true;
}, {
    message: "Office location is required for non-remote positions",
    path: ["officeLocation"]
}).refine(data => {
    if (data.noticePeriod && data.startDate) {
        const earliestStart = new Date();
        earliestStart.setDate(earliestStart.getDate() + data.noticePeriod);
        return data.startDate >= earliestStart;
    }
    return true;
}, {
    message: "Start date must account for notice period",
    path: ["startDate"]
});

export type ApplicationForm = z.infer<typeof applicationSchema>;
