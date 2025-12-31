import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const STATUS_OPTIONS = [
  { value: 'propozycja', label: 'PROPOZYCJA', bgColor: 'bg-neutral-200', textColor: 'text-neutral-600' },
  { value: 'wybrane', label: 'WYBRANE', bgColor: 'bg-violet-500', textColor: 'text-white' },
  { value: 'zamówione', label: 'ZAMÓWIONE', bgColor: 'bg-emerald-500', textColor: 'text-white' },
] as const;

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function StatusSelect({ value, onChange, disabled = false, compact = false }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0];

  const buttonSizeClasses = compact
    ? 'px-2 py-0.5 text-[9px]'
    : 'px-3 py-1 text-[10px]';

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
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
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-full ${buttonSizeClasses} font-semibold tracking-wide transition-all ${
          currentOption.bgColor
        } ${currentOption.textColor} ${!disabled ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
      >
        {currentOption.label}
        {!disabled && (
          <svg
            className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[140px]"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 9999,
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
