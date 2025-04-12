import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { customResolver } from './validators/customResolvers';
import { ApplicationForm } from './types';

const FORM_STEPS = [
  { title: 'Personal Information', fields: ['fullName', 'email', 'phone', 'resume'] },
  { title: 'Professional Details', fields: ['salaryExpectation', 'coverLetter', 'startDate', 'noticePeriod', 'isRemote', 'officeLocation'] }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ApplicationForm>({
    resolver: customResolver,
    defaultValues: JSON.parse(localStorage.getItem('formData') || '{}') || {
      isRemote: false,
      salaryExpectation: 50000
    }
  });

  const isRemote = watch('isRemote');
  const salaryValue = watch('salaryExpectation');
  const allValues = watch();

  // Save form data to localStorage on change
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(allValues));
  }, [allValues]);

  // Load draft on mount
  useEffect(() => {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
      reset(JSON.parse(savedData));
    }
  }, [reset]);

  const handleNext = async () => {
    const isValid = await trigger(FORM_STEPS[currentStep].fields as any);
    if (isValid) setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: ApplicationForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof FileList) formData.append(key, value[0]);
      else if (value instanceof Date) formData.append(key, value.toISOString());
      else if (typeof value === 'boolean') formData.append(key, value ? 'true' : 'false');
      else if (value !== undefined) formData.append(key, value.toString());
    });

    try {
      const response = await axios.post('http://localhost:3001/api/application', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Submission successful:', response.data);
      localStorage.removeItem('formData');
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting application');
    }
  };

  return (
    <div className="container">
      <h1>Job Application Form</h1>
      <div className="form-progress">
        {FORM_STEPS.map((step, index) => (
          <div
            key={step.title}
            className={`step ${index === currentStep ? 'active' : ''}`}
          >
            {index + 1}. {step.title}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Personal Information */}
        {currentStep === 0 && (
          <div className="form-step">
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
              <label>Resume (PDF only)</label>
              <input
                type="file"
                accept=".pdf"
                {...register('resume')}
              />
              {errors.resume && <span className="error">{errors.resume.message}</span>}
            </div>
          </div>
        )}

        {/* Step 2: Professional Details */}
        {currentStep === 1 && (
          <div className="form-step">
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
          </div>
        )}

        <div className="form-navigation">
          {currentStep > 0 && (
            <button type="button" onClick={handleBack} className="secondary">
              Back
            </button>
          )}

          {currentStep < FORM_STEPS.length - 1 ? (
            <button type="button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className={isSubmitting ? 'submitting' : ''}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
