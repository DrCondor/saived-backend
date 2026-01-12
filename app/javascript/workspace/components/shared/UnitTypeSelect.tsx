import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UnitType } from '../../types';
import { UNIT_TYPES, getUnitLabel } from '../../utils/unitTypes';

interface UnitTypeSelectProps {
  value: UnitType;
  onChange: (value: UnitType) => void;
  disabled?: boolean;
}

export default function UnitTypeSelect({
  value,
  onChange,
  disabled = false,
}: UnitTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
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

  const handleSelect = (newValue: UnitType) => {
    if (newValue !== value) {
      onChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded px-1 py-0.5 -mx-1 transition-colors ${
          !disabled ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {getUnitLabel(value)}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[120px]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999,
            }}
          >
            {UNIT_TYPES.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleSelect(unit.id)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 flex items-center justify-between gap-3 ${
                  unit.id === value ? 'bg-neutral-50 font-medium' : ''
                }`}
              >
                <span>{unit.label}</span>
                <span className="text-neutral-400 text-[10px]">{unit.fullName}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
