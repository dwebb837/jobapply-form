import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { customResolver } from './validators/customResolvers';
import { ApplicationForm } from './types';
import 'react-datepicker/dist/react-datepicker.css';

const FORM_STEPS = [
  { title: 'Personal Information', fields: ['fullName', 'email', 'phone', 'resume'] },
  { title: 'Professional Details', fields: ['salaryExpectation', 'coverLetter', 'startDate', 'noticePeriod', 'isRemote', 'officeLocation'] }
];

type ViewMode = 'form' | 'applications';

interface ApplicationListItem {
  id: string;
  fullName: string;
  email: string;
  salaryExpectation: number;
  startDate?: string;
  isRemote: boolean;
  createdAt: string;
}

const ApplicationModal = ({ application, onClose }: {
  application: ApplicationListItem | null,
  onClose: () => void
}) => {
  if (!application) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Application Details</h2>
        <button className="close-button" onClick={onClose}>&times;</button>

        <div className="details-grid">
          <div className="detail-item">
            <label>Name:</label>
            <span>{application.fullName}</span>
          </div>
          <div className="detail-item">
            <label>Email:</label>
            <span>{application.email}</span>
          </div>
          <div className="detail-item">
            <label>Salary:</label>
            <span>${application.salaryExpectation.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <label>Start Date:</label>
            <span>{application.startDate ? new Date(application.startDate).toLocaleDateString() : '-'}</span>
          </div>
          <div className="detail-item">
            <label>Remote:</label>
            <span>{application.isRemote ? 'Yes' : 'No'}</span>
          </div>
          <div className="detail-item">
            <label>Applied Date:</label>
            <span>{new Date(application.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          className="export-button"
          onClick={async () => {
            try {
              const response = await axios.post(
                'http://localhost:3001/api/export-pdf',
                { applicationId: application.id },
                { responseType: 'blob' }
              );
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `application_${application.id}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (error) {
              console.error('Export failed:', error);
              alert('Failed to export PDF');
            }
          }}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [salaryFilter, setSalaryFilter] = useState<[number, number]>([30000, 500000]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(allValues));
  }, [allValues]);

  useEffect(() => {
    const savedData = localStorage.getItem('formData');
    if (savedData) reset(JSON.parse(savedData));
  }, [reset]);

  useEffect(() => {
    if (viewMode === 'applications') {
      const fetchApplications = async () => {
        setIsLoadingApplications(true);
        try {
          const response = await axios.get('http://localhost:3001/api/applications', {
            params: {
              search: searchTerm,
              sort: sortBy,
              page: pagination.page,
              limit: pagination.limit
            }
          });
          setApplications(response.data.results);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            totalPages: response.data.totalPages
          }));
        } catch (error) {
          console.error('Error fetching applications:', error);
          alert('Failed to load applications');
        } finally {
          setIsLoadingApplications(false);
        }
      };
      fetchApplications();
    }
  }, [viewMode, searchTerm, sortBy, pagination.page]);

  const handleNext = async () => {
    const isValid = await trigger(FORM_STEPS[currentStep].fields as any);
    if (isValid) setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

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
      await axios.post('http://localhost:3001/api/application', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.removeItem('formData');
      alert('Application submitted successfully!');
      setViewMode('applications');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting application');
    }
  };

  return (
    <div className="container">
      <div className="view-switcher">
        <button
          className={viewMode === 'form' ? 'active' : ''}
          onClick={() => {
            setViewMode('form');
            setCurrentStep(0);

          }}
        >
          New Application
        </button>
        <button
          className={viewMode === 'applications' ? 'active' : ''}
          onClick={() => setViewMode('applications')}
        >
          View Applications ({pagination.total})
        </button>
      </div>

      {viewMode === 'form' ? (
        <>
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (currentStep === FORM_STEPS.length - 1) {
                  handleSubmit(onSubmit)(e);
                } else {
                  handleNext();
                }
              }
            }}
            noValidate
          >
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
                  {errors.salaryExpectation && (
                    <span className="error">{errors.salaryExpectation.message}</span>
                  )}
                  <div className="current-salary">
                    Current: ${salaryValue.toLocaleString()}/yr
                  </div>
                </div>

                <div className="form-group">
                  <label>Cover Letter</label>
                  <textarea
                    {...register('coverLetter')}
                    rows={4}
                    placeholder="Describe your qualifications..."
                  />
                  {errors.coverLetter && (
                    <span className="error">{errors.coverLetter.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    {...register('startDate', { valueAsDate: true })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.startDate && (
                    <span className="error">{errors.startDate.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Notice Period (days)</label>
                  <input
                    type="number"
                    {...register('noticePeriod', { valueAsNumber: true })}
                    min="0"
                  />
                  {errors.noticePeriod && (
                    <span className="error">{errors.noticePeriod.message}</span>
                  )}
                </div>

                <div className="form-group checkbox-group remote-group">
                  Remote Position
                  <input
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
                    {errors.officeLocation && (
                      <span className="error">{errors.officeLocation.message}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-navigation">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="secondary"
                >
                  Back
                </button>
              )}

              {currentStep < FORM_STEPS.length - 1 ? (
                <button type="button" onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? 'submitting' : ''}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        <div className="applications-view">
          <div className="controls">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoadingApplications}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={isLoadingApplications}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          <div className="advanced-filters">
            <div className="filter-group">
              <label>Date Range:</label>
              <DatePicker
                selectsRange
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
                className="date-picker-input"
              />
            </div>
            <div className="filter-group">
              <label>Salary Range ($):</label>
              <div className="salary-filter">
                <input
                  type="number"
                  value={salaryFilter[0]}
                  onChange={(e) => setSalaryFilter([Number(e.target.value), salaryFilter[1]])}
                  min="30000"
                  max="500000"
                />
                <span>to</span>
                <input
                  type="number"
                  value={salaryFilter[1]}
                  onChange={(e) => setSalaryFilter([salaryFilter[0], Number(e.target.value)])}
                  min="30000"
                  max="500000"
                />
              </div>
            </div>
          </div>

          {isLoadingApplications ? (
            <div className="loading">Loading applications...</div>
          ) : (
            <>
              <div className="applications-list">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Salary</th>
                      <th>Start Date</th>
                      <th>Remote</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && setSelectedApplication(app)}
                      >
                        <td>{app.fullName}</td>
                        <td>{app.email}</td>
                        <td>${app.salaryExpectation.toLocaleString()}</td>
                        <td>{app.startDate ? new Date(app.startDate).toLocaleDateString() : '-'}</td>
                        <td>{app.isRemote ? 'Yes' : 'No'}</td>
                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-controls">
                <button
                  disabled={pagination.page === 1 || isLoadingApplications}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages || isLoadingApplications}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
}
