import { useCallback, useRef, useState } from 'react';
import type { PublicApiError } from '../../api/publicApiClient';
import { publicJobsApi } from '../../api/publicJobsApi';
import type { ApplyJobRequest, ApplyJobResponse } from '../../types/publicJobs';

export function useApplyJob(orgSlug: string, jobId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PublicApiError | null>(null);
  const [success, setSuccess] = useState<ApplyJobResponse | null>(null);
  const lastSubmitAt = useRef<number>(0);

  const submit = useCallback(
    async (payload: ApplyJobRequest) => {
      // Rate-limit UI: don't allow rapid repeats
      const now = Date.now();
      if (isSubmitting) return;
      if (now - lastSubmitAt.current < 1200) return;
      lastSubmitAt.current = now;

      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await publicJobsApi.apply(orgSlug, jobId, payload);
        setSuccess(res);
        return res;
      } catch (e) {
        setError(e as PublicApiError);
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, jobId, orgSlug]
  );

  return { submit, isSubmitting, error, success };
}

