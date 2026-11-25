import type {
  OffboardingTemplateDetail,
  UpsertOffboardingTemplateRequest,
} from './offboarding';

export type TaskDraft = {
  key: string;
  title: string;
  description: string;
  category: string;
  assignmentType: string;
  defaultAssigneeUserId: string;
  dueOffsetDays: string;
  isRequired: boolean;
  requiresDocument: boolean;
  documentCategory: string;
  requiresApproval: boolean;
  dependsOnKey: string;
};

export type FormState = {
  name: string;
  description: string;
  separationType: string;
  departmentId: string;
  jobTitleId: string;
  employmentTypeId: string;
  estimatedDurationDays: string;
  isActive: boolean;
  isDefault: boolean;
  tasks: TaskDraft[];
};

export const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export const blankTask = (): TaskDraft => ({
  key: newKey(),
  title: '',
  description: '',
  category: 'Other',
  assignmentType: 'HR',
  defaultAssigneeUserId: '',
  dueOffsetDays: '',
  isRequired: true,
  requiresDocument: false,
  documentCategory: '',
  requiresApproval: false,
  dependsOnKey: '',
});

export function fromDetail(d: OffboardingTemplateDetail | null): FormState {
  if (!d) {
    return {
      name: '',
      description: '',
      separationType: '',
      departmentId: '',
      jobTitleId: '',
      employmentTypeId: '',
      estimatedDurationDays: '',
      isActive: true,
      isDefault: false,
      tasks: [blankTask()],
    };
  }
  return {
    name: d.name,
    description: d.description ?? '',
    separationType: d.separationType ?? '',
    departmentId: d.departmentId ?? '',
    jobTitleId: d.jobTitleId ?? '',
    employmentTypeId: d.employmentTypeId ?? '',
    estimatedDurationDays: d.estimatedDurationDays != null ? String(d.estimatedDurationDays) : '',
    isActive: d.isActive,
    isDefault: d.isDefault,
    tasks: d.tasks.map((task) => ({
      key: task.id,
      title: task.title,
      description: task.description ?? '',
      category: task.category,
      assignmentType: task.assignmentType,
      defaultAssigneeUserId: task.defaultAssigneeUserId ?? '',
      dueOffsetDays: task.dueOffsetDays != null ? String(task.dueOffsetDays) : '',
      isRequired: task.isRequired,
      requiresDocument: task.requiresDocument,
      documentCategory: task.documentCategory ?? '',
      requiresApproval: task.requiresApproval,
      dependsOnKey: task.dependsOnTaskId ?? '',
    })),
  };
}

/** A dependency must reference a task that appears earlier in the list. */
export function sanitizeDependencies(tasks: TaskDraft[]): TaskDraft[] {
  const seen = new Set<string>();
  return tasks.map((task) => {
    const dep = task.dependsOnKey && seen.has(task.dependsOnKey) ? task.dependsOnKey : '';
    seen.add(task.key);
    return dep === task.dependsOnKey ? task : { ...task, dependsOnKey: dep };
  });
}

export function toRequest(form: FormState): UpsertOffboardingTemplateRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    separationType: form.separationType || null,
    departmentId: form.departmentId || null,
    jobTitleId: form.jobTitleId || null,
    employmentTypeId: form.employmentTypeId || null,
    estimatedDurationDays: form.estimatedDurationDays ? Number(form.estimatedDurationDays) : null,
    isActive: form.isActive,
    isDefault: form.isDefault,
    tasks: form.tasks.map((task) => ({
      id: task.key,
      title: task.title.trim(),
      description: task.description.trim() || null,
      category: task.category,
      assignmentType: task.assignmentType,
      defaultAssigneeUserId: task.assignmentType === 'SpecificUser' && task.defaultAssigneeUserId ? task.defaultAssigneeUserId : null,
      dueOffsetDays: task.dueOffsetDays !== '' ? Number(task.dueOffsetDays) : null,
      isRequired: task.isRequired,
      requiresDocument: task.requiresDocument,
      documentCategory: task.requiresDocument && task.documentCategory.trim() ? task.documentCategory.trim() : null,
      requiresApproval: task.requiresApproval,
      dependsOnTaskId: task.dependsOnKey || null,
    })),
  };
}

/** Re-saves an existing template with only `isDefault` flipped (used by "Set as default"). */
export function detailToRequest(d: OffboardingTemplateDetail, patch: Partial<UpsertOffboardingTemplateRequest> = {}) {
  return { ...toRequest(fromDetail(d)), ...patch };
}

