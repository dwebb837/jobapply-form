import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const applicationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Invalid phone number"),
  resume: z.instanceof(FileList).refine(files => files.length > 0, "Resume is required"),
  coverLetter: z.string().optional(),
  salaryExpectation: z.number().min(30000, "Minimum salary is $30,000").max(500000)
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function App() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema)
  });

  const onSubmit = async (data: ApplicationForm) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('salaryExpectation', data.salaryExpectation.toString());
    formData.append('resume', data.resume[0]);
    if (data.coverLetter) formData.append('coverLetter', data.coverLetter);

    try {
      const baseUrl = 'http://localhost:3001';
      const response = await axios.post(`${baseUrl}/api/application`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Submission successful:', response.data);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting application');
    }
  };

  return (
    <div className="container">
      <h1>Job Application Form</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Full Name</label>
          <input {...register('fullName')} />
          {errors.fullName && <span className="error">{errors.fullName.message}</span>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" {...register('email')} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input {...register('phone')} />
          {errors.phone && <span className="error">{errors.phone.message}</span>}
        </div>

        <div className="form-group">
          <label>Salary Expectation ($)</label>
          <input type="number" {...register('salaryExpectation', { valueAsNumber: true })} />
          {errors.salaryExpectation && <span className="error">{errors.salaryExpectation.message}</span>}
        </div>

        <div className="form-group">
          <label>Resume (PDF only)</label>
          <input type="file" accept=".pdf" {...register('resume')} />
          {errors.resume && <span className="error">{errors.resume.message}</span>}
        </div>

        <div className="form-group">
          <label>Cover Letter</label>
          <textarea {...register('coverLetter')} rows={4} />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
