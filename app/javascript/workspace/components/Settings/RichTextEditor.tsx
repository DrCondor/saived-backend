import { useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  maxLength?: number;
  placeholder?: string;
}

const COLORS = [
  { id: 'black', label: 'Czarny', hex: '#1a1a1a' },
  { id: 'gray', label: 'Szary', hex: '#666666' },
  { id: 'emerald', label: 'Zielony', hex: '#059669' },
];

const SIZES = [
  { id: 'small', label: 'Maly', size: '10px' },
  { id: 'normal', label: 'Normalny', size: '12px' },
  { id: 'large', label: 'Duzy', size: '14px' },
];

export default function RichTextEditor({
  value,
  onChange,
  maxLength = 500,
  placeholder = 'Wpisz tekst...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasUserEdited = useRef(false);
  const lastExternalValue = useRef(value);

  // Sync value from props, but only if user hasn't started editing
  useEffect(() => {
    if (editorRef.current && !hasUserEdited.current && value !== lastExternalValue.current) {
      editorRef.current.innerHTML = value || '';
      lastExternalValue.current = value;
    }
  }, [value]);

  // Initialize on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastExternalValue.current = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getTextLength = useCallback(() => {
    return editorRef.current?.textContent?.length || 0;
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    // Mark that user has started editing
    hasUserEdited.current = true;

    const textLength = getTextLength();
    if (textLength > maxLength) {
      // Truncate text if over limit
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const offset = range?.startOffset || 0;

      // Restore previous content
      document.execCommand('undo');
      return;
    }

    onChange(editorRef.current.innerHTML);
  }, [onChange, maxLength, getTextLength]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');

  const handleColor = (hex: string) => {
    execCommand('foreColor', hex);
  };

  const handleSize = (size: string) => {
    // fontSize command uses 1-7 scale, we'll use inline style instead
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Create a span with the font size
    const span = document.createElement('span');
    span.style.fontSize = size;
    range.surroundContents(span);

    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if (e.key === 'i') {
        e.preventDefault();
        handleItalic();
      }
    }
  };

  const textLength = getTextLength();

  return (
    <div className="border border-border rounded-lg overflow-hidden focus-within:border-border-hover focus-within:ring-1 focus-within:ring-border-hover">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-hover border-b border-border">
        {/* Bold */}
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 rounded hover:bg-surface-inset transition-colors"
          title="Pogrubienie (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 rounded hover:bg-surface-inset transition-colors"
          title="Kursywa (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
          </svg>
        </button>

        <div className="w-px h-5 bg-border-hover mx-1" />

        {/* Colors */}
        {COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => handleColor(color.hex)}
            className="p-1 rounded hover:bg-surface-inset transition-colors"
            title={color.label}
          >
            <div
              className="w-4 h-4 rounded-full border border-border-hover"
              style={{ backgroundColor: color.hex }}
            />
          </button>
        ))}

        <div className="w-px h-5 bg-border-hover mx-1" />

        {/* Sizes */}
        {SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => handleSize(size.size)}
            className="px-2 py-1 text-xs rounded hover:bg-surface-inset transition-colors"
            style={{ fontSize: size.size }}
            title={size.label}
          >
            A
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[100px] p-3 text-sm text-text-primary bg-surface focus:outline-none"
        data-placeholder={placeholder}
        style={{
          // Show placeholder when empty
          ...((!value || value === '<br>') && {
            position: 'relative',
          }),
        }}
        suppressContentEditableWarning
      />

      {/* Character count */}
      <div className="px-3 py-1.5 bg-surface-hover border-t border-border text-xs text-text-tertiary text-right">
        {textLength} / {maxLength}
      </div>
    </div>
  );
}
