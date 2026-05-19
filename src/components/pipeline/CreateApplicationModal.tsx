import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import type { Candidate } from '../../types/candidates';
import type { Job } from '../../types/dashboard';
import { candidatesApi } from '../../api/candidatesApi';
import { applicationsApi } from '../../api/applicationsApi';
import type { KanbanApplicationCard } from '../../types/applications';
import type { ApiError } from '../../lib/api';

export default function CreateApplicationModal({
  isOpen,
  jobs,
  job,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  jobs: Job[];
  job: Job | null;
  onClose: () => void;
  onCreated: (card: KanbanApplicationCard) => void;
}) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // default selected job to page-selected job
    setJobId(job ? String(job.id) : '');
  }, [isOpen, job]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const res = await candidatesApi.list({ page: 1, pageSize: 100 });
        const items = Array.isArray(res) ? (res as any[]) : (res as any)?.items || (res as any)?.data || [];
        if (!cancelled) setCandidates(items as Candidate[]);
      } catch (e) {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('candidates.errors.loadCandidates');
        if (!cancelled) setError(msg);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const candidateOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('common.none') },
      ...candidates.map((c) => ({
        value: c.id,
        label: `${`${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email} ${c.email ? `(${c.email})` : ''}`.trim(),
      })),
    ];
    return opts;
  }, [candidates, t]);

  const handleClose = () => {
    setCandidateId('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const selectedJob = jobs.find((j) => String(j.id) === String(jobId)) || job;
    if (!selectedJob) return;
    if (!candidateId) {
      setError(t('pipeline.errors.validation'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const created = await applicationsApi.create({ candidateId, jobId: selectedJob.id });
      onCreated({
        ...created,
        candidateName:
          created.candidateName ||
          `${candidates.find((c) => c.id === candidateId)?.firstName || ''} ${
            candidates.find((c) => c.id === candidateId)?.lastName || ''
          }`.trim(),
        jobTitle: created.jobTitle || selectedJob.title,
        jobId: created.jobId || selectedJob.id,
      });
      handleClose();
    } catch (e) {
      const err = e as ApiError;
      if (err && typeof err === 'object' && 'status' in err && (err as any).status === 409) {
        // Backend: { "message": "This candidate already has an application for the selected job." }
        setError(err.message || t('pipeline.errors.duplicate'));
      } else {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('pipeline.errors.create');
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('pipeline.modal.title')}
      subtitle={t('pipeline.modal.subtitle')}
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={isLoading || !job}>
            {isLoading ? t('common.actions.creating') : t('pipeline.modal.create')}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error ? <ErrorMessage message={error} /> : null}

        <SelectField
          label={t('pipeline.modal.candidate')}
          required
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          options={candidateOptions}
        />

        <SelectField
          label={t('pipeline.modal.job')}
          required
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          options={[
            { value: '', label: t('pipeline.selectJob') },
            ...jobs.map((j) => ({ value: String(j.id), label: j.title })),
          ]}
        />
      </form>
    </Modal>
  );
}

