import { useMemo, useRef, useState } from 'react';
import type { WorkflowVariableDescriptor } from '../models/variableCatalog';
import {
  BRANCH_OPERATORS,
  type BranchOperator,
  type ExpressionValueKind,
  isCompleteBranchExpression,
  mapVariableTypeToValueKind,
  parseBranchCondition,
  serializeBranchCondition,
} from '../lib/workflowExpression';
import WorkflowVariablePicker from './WorkflowVariablePicker';

type Props = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  availableVariables: WorkflowVariableDescriptor[];
  disabled?: boolean;
  label?: string;
  required?: boolean;
};

type EditorMode = 'visual' | 'manual';

type VisualState = {
  variable: string;
  operator: BranchOperator;
  value: string;
  valueKind: ExpressionValueKind;
};

function resolveValueKind(
  variablePath: string,
  availableVariables: WorkflowVariableDescriptor[],
  fallback: ExpressionValueKind,
): ExpressionValueKind {
  const match = availableVariables.find((v) => v.path === variablePath);
  if (!match) return fallback;
  return mapVariableTypeToValueKind(match.type);
}

function toVisualState(
  condition: string | null | undefined,
  availableVariables: WorkflowVariableDescriptor[],
): VisualState | null {
  const parsed = parseBranchCondition(condition);
  if (!parsed) return null;
  return {
    variable: parsed.variable,
    operator: parsed.operator,
    value: parsed.value,
    valueKind: resolveValueKind(parsed.variable, availableVariables, parsed.valueKind),
  };
}

const EMPTY_VISUAL: VisualState = {
  variable: '',
  operator: '==',
  value: '',
  valueKind: 'unknown',
};

export default function WorkflowExpressionBuilder({
  value,
  onChange,
  availableVariables,
  disabled = false,
  label = 'Condition',
  required = false,
}: Props) {
  const seed = useMemo(
    () => toVisualState(value, availableVariables),
    // Mount-only seed; parent should remount this component when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [mode, setMode] = useState<EditorMode>(() =>
    value?.trim() && !seed ? 'manual' : 'visual',
  );
  const [manualReason, setManualReason] = useState<'unparseable' | 'user'>(() =>
    value?.trim() && !seed ? 'unparseable' : 'user',
  );
  const [visual, setVisual] = useState<VisualState>(() => seed ?? EMPTY_VISUAL);
  const [manual, setManual] = useState(() => value ?? '');
  const lastEmittedRef = useRef<string>(value ?? '');

  const emitVisual = (next: VisualState) => {
    let resolved = next;
    if (next.valueKind === 'boolean' && next.value !== 'true' && next.value !== 'false') {
      resolved = { ...next, value: 'true' };
    }
    setVisual(resolved);

    if (!resolved.variable.trim()) {
      lastEmittedRef.current = '';
      onChange('');
      return;
    }

    if (
      isCompleteBranchExpression({
        variable: resolved.variable,
        operator: resolved.operator,
        value: resolved.value,
        valueKind: resolved.valueKind,
      })
    ) {
      const serialized = serializeBranchCondition({
        variable: resolved.variable,
        operator: resolved.operator,
        value: resolved.value,
        valueKind: resolved.valueKind,
      });
      lastEmittedRef.current = serialized;
      onChange(serialized);
    }
  };

  const selectVariable = (variable: WorkflowVariableDescriptor) => {
    const valueKind = mapVariableTypeToValueKind(variable.type);
    let nextValue = visual.value;
    if (valueKind === 'boolean') {
      nextValue = nextValue === 'true' || nextValue === 'false' ? nextValue : 'true';
    } else if (valueKind === 'number' && visual.valueKind !== 'number') {
      nextValue = '';
    }

    emitVisual({
      ...visual,
      variable: variable.path,
      valueKind,
      value: nextValue,
    });
  };

  const preview =
    mode === 'visual' &&
    isCompleteBranchExpression({
      variable: visual.variable,
      operator: visual.operator,
      value: visual.value,
      valueKind: visual.valueKind,
    })
      ? serializeBranchCondition({
          variable: visual.variable,
          operator: visual.operator,
          value: visual.value,
          valueKind: visual.valueKind,
        })
      : null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
        {!disabled ? (
          mode === 'visual' ? (
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-[#0077E6] hover:underline"
              onClick={() => {
                const current =
                  preview ??
                  (visual.variable.trim()
                    ? `${visual.variable.trim()} ${visual.operator} ${visual.value}`.trim()
                    : lastEmittedRef.current);
                setManual(current);
                setManualReason('user');
                setMode('manual');
                lastEmittedRef.current = current;
                onChange(current);
              }}
            >
              Edit as expression
            </button>
          ) : (
            <button
              type="button"
              className="text-xs text-[#0077E6] hover:underline disabled:opacity-40 disabled:no-underline"
              disabled={!parseBranchCondition(manual)}
              onClick={() => {
                const parsed = toVisualState(manual, availableVariables);
                if (!parsed) return;
                setVisual(parsed);
                setMode('visual');
                const serialized = serializeBranchCondition({
                  variable: parsed.variable,
                  operator: parsed.operator,
                  value: parsed.value,
                  valueKind: parsed.valueKind,
                });
                lastEmittedRef.current = serialized;
                onChange(serialized);
              }}
            >
              Use visual builder
            </button>
          )
        ) : null}
      </div>

      {mode === 'manual' ? (
        <div className="space-y-2">
          {manualReason === 'unparseable' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-800">
                This condition could not be opened in the visual editor. Edit the expression
                manually so it is not lost.
              </p>
            </div>
          ) : null}
          <textarea
            value={manual}
            disabled={disabled}
            rows={3}
            spellCheck={false}
            onChange={(e) => {
              setManual(e.target.value);
              lastEmittedRef.current = e.target.value;
              onChange(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder='Application.Status == "Qualified"'
          />
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-gray-600">Variable</span>
              <WorkflowVariablePicker
                variables={availableVariables}
                disabled={disabled}
                label="Select Variable"
                onSelect={selectVariable}
              />
            </div>
            <input
              type="text"
              disabled={disabled}
              spellCheck={false}
              value={visual.variable}
              placeholder="Application.Status"
              onChange={(e) => {
                const path = e.target.value;
                emitVisual({
                  ...visual,
                  variable: path,
                  valueKind: resolveValueKind(path, availableVariables, visual.valueKind),
                });
              }}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Pick from available variables or type a custom path.
            </p>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1.5">Operator</span>
            <select
              disabled={disabled}
              value={visual.operator}
              onChange={(e) =>
                emitVisual({ ...visual, operator: e.target.value as BranchOperator })
              }
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50 disabled:text-gray-500"
            >
              {BRANCH_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1.5">Value</span>
            <ValueInput
              disabled={disabled}
              valueKind={visual.valueKind}
              value={visual.value}
              onChange={(nextValue) => emitVisual({ ...visual, value: nextValue })}
            />
          </div>

          {preview ? (
            <div className="pt-1 border-t border-gray-200">
              <p className="text-[11px] text-gray-400 mb-1">Persisted condition</p>
              <p className="text-xs font-mono text-dark-text break-all">{preview}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ValueInput({
  valueKind,
  value,
  disabled,
  onChange,
}: {
  valueKind: ExpressionValueKind;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  if (valueKind === 'boolean') {
    return (
      <select
        disabled={disabled}
        value={value === 'false' ? 'false' : 'true'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (valueKind === 'number') {
    return (
      <input
        type="number"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50 disabled:text-gray-500"
      />
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      spellCheck={false}
      value={value}
      placeholder={valueKind === 'string' ? 'Qualified' : 'Value'}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50 disabled:text-gray-500"
    />
  );
}
