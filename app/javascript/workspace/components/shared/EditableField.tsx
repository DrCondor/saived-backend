import { useState, useRef, useEffect } from 'react';

interface EditableFieldProps {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'url' | 'textarea';
  placeholder?: string;
  emptyText?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function EditableField({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  emptyText = '—',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (required && !trimmed) {
      setEditValue(String(value ?? ''));
    } else if (trimmed !== String(value ?? '')) {
      onChange(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(String(value ?? ''));
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <span className={className}>
        {value ?? emptyText}
      </span>
    );
  }

  if (isEditing) {
    const baseInputClass = `w-full bg-white border border-emerald-300 rounded px-1.5 py-0.5 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${inputClassName}`;

    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className={baseInputClass}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        step={type === 'number' ? 'any' : undefined}
        min={type === 'number' ? '0' : undefined}
        className={baseInputClass}
      />
    );
  }

  const displayValue = value !== null && value !== undefined && value !== '' ? String(value) : emptyText;
  const isEmpty = displayValue === emptyText;

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`text-left hover:bg-emerald-50 hover:text-emerald-700 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors ${isEmpty ? 'text-neutral-400' : ''} ${className}`}
    >
      {displayValue}
    </button>
  );
}
