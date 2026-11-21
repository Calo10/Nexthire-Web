import { useEffect, useRef, useState, type RefObject } from 'react';
import TextField from '../../../components/TextField';
import SelectField from '../../../components/SelectField';
import type { ConfigurationField } from '../models/activityCatalog';
import type { WorkflowVariableDescriptor } from '../models/variableCatalog';
import {
  insertTemplateVariable,
  isTemplateConfigurationField,
  isVariableConfigurationField,
} from '../lib/workflowVariables';
import WorkflowVariablePicker from './WorkflowVariablePicker';
import WorkflowExpressionBuilder from './WorkflowExpressionBuilder';

type Props = {
  fields: ConfigurationField[];
  values: Record<string, unknown>;
  disabled?: boolean;
  availableVariables?: WorkflowVariableDescriptor[];
  onChange: (key: string, value: unknown) => void;
};

function JsonField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ConfigurationField;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const initial =
    typeof value === 'string'
      ? value
      : JSON.stringify(value !== undefined ? value : {}, null, 2);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next =
      typeof value === 'string'
        ? value
        : JSON.stringify(value !== undefined ? value : {}, null, 2);
    setText(next);
    setError(null);
    // Only reset local editor when switching fields — not on every keystroke sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.key]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      <textarea
        disabled={disabled}
        rows={4}
        value={text}
        placeholder={field.placeholder ?? '{ }'}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          try {
            const parsed = JSON.parse(next || 'null') as unknown;
            setError(null);
            onChange(parsed);
          } catch {
            setError('Invalid JSON.');
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function VariableTextField({
  field,
  value,
  disabled,
  variables,
  onChange,
}: {
  field: ConfigurationField;
  value: unknown;
  disabled?: boolean;
  variables: WorkflowVariableDescriptor[];
  onChange: (value: unknown) => void;
}) {
  const stringValue = value == null ? '' : String(value);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
        <WorkflowVariablePicker
          variables={variables}
          disabled={disabled}
          label="Select Variable"
          onSelect={(variable) => onChange(variable.path)}
        />
      </div>
      <input
        type="text"
        disabled
        readOnly
        value={stringValue}
        placeholder={field.placeholder ?? 'Select a variable…'}
        className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 text-gray-700 cursor-not-allowed"
      />
      <p className="mt-1 text-[11px] text-gray-400">
        Select a variable from the list. Manual paths are not allowed.
      </p>
    </div>
  );
}

function TemplateTextField({
  field,
  value,
  disabled,
  variables,
  multiline,
  onChange,
}: {
  field: ConfigurationField;
  value: unknown;
  disabled?: boolean;
  variables: WorkflowVariableDescriptor[];
  multiline: boolean;
  onChange: (value: unknown) => void;
}) {
  const stringValue = value == null ? '' : String(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const rememberSelection = (
    el: HTMLInputElement | HTMLTextAreaElement | null,
  ) => {
    if (!el) return;
    setSelection({
      start: el.selectionStart ?? stringValue.length,
      end: el.selectionEnd ?? stringValue.length,
    });
  };

  const insertVariable = (variable: WorkflowVariableDescriptor) => {
    const { value: next, cursor } = insertTemplateVariable(
      stringValue,
      variable.path,
      selection.start,
      selection.end,
    );
    onChange(next);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
      setSelection({ start: cursor, end: cursor });
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
        <WorkflowVariablePicker
          variables={variables}
          disabled={disabled}
          label="Insert Variable"
          onSelect={insertVariable}
        />
      </div>
      {multiline ? (
        <textarea
          ref={inputRef as RefObject<HTMLTextAreaElement>}
          value={stringValue}
          disabled={disabled}
          placeholder={field.placeholder}
          rows={4}
          onSelect={(e) => rememberSelection(e.currentTarget)}
          onClick={(e) => rememberSelection(e.currentTarget)}
          onKeyUp={(e) => rememberSelection(e.currentTarget)}
          onChange={(e) => {
            onChange(e.target.value);
            rememberSelection(e.currentTarget);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      ) : (
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          type="text"
          value={stringValue}
          disabled={disabled}
          placeholder={field.placeholder}
          onSelect={(e) => rememberSelection(e.currentTarget)}
          onClick={(e) => rememberSelection(e.currentTarget)}
          onKeyUp={(e) => rememberSelection(e.currentTarget)}
          onChange={(e) => {
            onChange(e.target.value);
            rememberSelection(e.currentTarget);
          }}
          className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      )}
    </div>
  );
}

function ConfigurationFieldInput({
  field,
  value,
  disabled,
  variables,
  onChange,
}: {
  field: ConfigurationField;
  value: unknown;
  disabled?: boolean;
  variables: WorkflowVariableDescriptor[];
  onChange: (value: unknown) => void;
}) {
  const stringValue = value == null ? '' : String(value);
  const isVariable = isVariableConfigurationField(field.key, field.valueKind);
  const isTemplate = isTemplateConfigurationField(field.key, field.valueKind);

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-gray-300 text-[#0077E6] focus:ring-[#00AAFF]"
        />
        <span>
          {field.label}
          {field.required ? <span className="text-red-500 ml-1">*</span> : null}
        </span>
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <SelectField
        label={field.label}
        required={field.required}
        disabled={disabled}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: '', label: 'Select…' },
          ...(field.options ?? []),
        ]}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <TextField
        label={field.label}
        required={field.required}
        type="number"
        disabled={disabled}
        placeholder={field.placeholder}
        value={stringValue}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') onChange(undefined);
          else onChange(Number(raw));
        }}
      />
    );
  }

  if (field.type === 'json') {
    return <JsonField field={field} value={value} disabled={disabled} onChange={onChange} />;
  }

  if (field.type === 'expression' || field.valueKind === 'expression') {
    return (
      <WorkflowExpressionBuilder
        label={field.label}
        required={field.required}
        value={stringValue}
        disabled={disabled}
        availableVariables={variables}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (isVariable && (field.type === 'text' || field.type === 'textarea')) {
    return (
      <VariableTextField
        field={field}
        value={value}
        disabled={disabled}
        variables={variables}
        onChange={onChange}
      />
    );
  }

  if (isTemplate && (field.type === 'text' || field.type === 'textarea')) {
    return (
      <TemplateTextField
        field={field}
        value={value}
        disabled={disabled}
        variables={variables}
        multiline={field.type === 'textarea'}
        onChange={onChange}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
        <textarea
          value={stringValue}
          disabled={disabled}
          placeholder={field.placeholder}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>
    );
  }

  return (
    <TextField
      label={field.label}
      required={field.required}
      disabled={disabled}
      placeholder={field.placeholder}
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Renders activity configuration fields from the catalog.
 * Variable / template fields use WorkflowVariablePicker when availableVariables is provided.
 */
export default function DynamicActivityForm({
  fields,
  values,
  disabled = false,
  availableVariables = [],
  onChange,
}: Props) {
  if (fields.length === 0) {
    return (
      <p className="text-xs text-gray-500">This activity has no configuration.</p>
    );
  }

  const visibleFields = fields.filter((field) => {
    if (!field.visibleWhen) return true;
    return values[field.visibleWhen.key] === field.visibleWhen.equals;
  });

  return (
    <div className="space-y-4">
      {visibleFields.map((field) => (
        <div key={field.key} className="space-y-1">
          <ConfigurationFieldInput
            field={field}
            value={values[field.key]}
            disabled={disabled}
            variables={availableVariables}
            onChange={(value) => onChange(field.key, value)}
          />
          {field.helpText ? <p className="text-[11px] text-gray-400">{field.helpText}</p> : null}
        </div>
      ))}
    </div>
  );
}
