import { Resolver } from 'react-hook-form';
import { ApplicationForm } from '../types';
import { applicationSchema } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';

export const customResolver: Resolver<ApplicationForm> = async (values, context, options) => {
    const zodResult = await zodResolver(applicationSchema)(values, context, options);

    if (!zodResult.errors) {
        const errors: Record<string, { type: string, message: string }> = {};

        // Business rule: Senior positions salary
        if (values.fullName.toLowerCase().includes('senior') && values.salaryExpectation < 80000) {
            errors.salaryExpectation = {
                type: 'business_rule',
                message: 'Senior positions must have salary expectation of at least $80,000'
            };
        }

        // Business rule: Executive positions require cover letter
        if (values.fullName.toLowerCase().includes('executive') && !values.coverLetter) {
            errors.coverLetter = {
                type: 'business_rule',
                message: 'Cover letter is required for executive positions'
            };
        }

        if (Object.keys(errors).length > 0) {
            return { values: {}, errors };
        }
    }

    return zodResult;
};
