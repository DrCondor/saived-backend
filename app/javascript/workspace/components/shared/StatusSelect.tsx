import { useState, useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'propozycja', label: 'PROPOZYCJA', bgColor: 'bg-neutral-200', textColor: 'text-neutral-600' },
  { value: 'wybrane', label: 'WYBRANE', bgColor: 'bg-violet-500', textColor: 'text-white' },
  { value: 'zamówione', label: 'ZAMÓWIONE', bgColor: 'bg-emerald-500', textColor: 'text-white' },
] as const;

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function StatusSelect({ value, onChange, disabled = false }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide transition-all ${
          currentOption.bgColor
        } ${currentOption.textColor} ${!disabled ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
      >
        {currentOption.label}
        {!disabled && (
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[140px]">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-neutral-50 flex items-center gap-2 ${
                option.value === value ? 'bg-neutral-50' : ''
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${option.bgColor}`}
              />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
