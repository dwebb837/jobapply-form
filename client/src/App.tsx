import { useForm } from 'react-hook-form';
import axios from 'axios';
import { customResolver } from './validators/customResolvers';
import { ApplicationForm } from './types';

export default function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationForm>({
    resolver: customResolver,
    defaultValues: {
      isRemote: false,
      salaryExpectation: 50000
    }
  });

  const isRemote = watch('isRemote');
  const salaryValue = watch('salaryExpectation');

  const onSubmit = async (data: ApplicationForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof FileList) {
        formData.append(key, value[0]);
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
      } else if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

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
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <input
            type="number"
            {...register('salaryExpectation', { valueAsNumber: true })}
            min="30000"
            max="500000"
          />
          <div className="salary-range">
            <span>$30k/yr</span>
            <input
              type="range"
              {...register('salaryExpectation', { valueAsNumber: true })}
              min="30000"
              max="500000"
              step="1000"
            />
            <span>$500k/yr</span>
          </div>
          {errors.salaryExpectation && <span className="error">{errors.salaryExpectation.message}</span>}
          <div className="current-salary">Current: ${salaryValue?.toLocaleString()}/yr</div>
        </div>

        <div className="form-group">
          <label>Resume (PDF only)</label>
          <input
            type="file"
            accept=".pdf"
            {...register('resume')}
          />
          {errors.resume && <span className="error">{errors.resume.message}</span>}
        </div>

        <div className="form-group">
          <label>Cover Letter</label>
          <textarea
            {...register('coverLetter')}
            rows={4}
            placeholder="Describe your qualifications..."
          />
          {errors.coverLetter && <span className="error">{errors.coverLetter.message}</span>}
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            {...register('startDate', { valueAsDate: true })}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.startDate && <span className="error">{errors.startDate.message}</span>}
        </div>

        <div className="form-group">
          <label>Notice Period (days)</label>
          <input
            type="number"
            {...register('noticePeriod', { valueAsNumber: true })}
            min="0"
          />
          {errors.noticePeriod && <span className="error">{errors.noticePeriod.message}</span>}
        </div>

        <div className="form-group checkbox-group is-remote-group">
          <label htmlFor='isRemoteInput'>
            Remote Position
          </label>
          <input
              id='isRemoteInput'
              type="checkbox"
              {...register('isRemote')}
          />
        </div>

        {!isRemote && (
          <div className="form-group">
            <label>Office Location</label>
            <input
              {...register('officeLocation')}
              placeholder="Enter office address"
            />
            {errors.officeLocation && <span className="error">{errors.officeLocation.message}</span>}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
