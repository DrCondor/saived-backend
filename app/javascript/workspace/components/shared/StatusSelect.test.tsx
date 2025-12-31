import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../tests/test-utils';
import StatusSelect from './StatusSelect';

describe('StatusSelect', () => {
  const defaultProps = {
    value: 'propozycja',
    onChange: vi.fn(),
  };

  it('renders current status label', () => {
    render(<StatusSelect {...defaultProps} />);
    expect(screen.getByText('PROPOZYCJA')).toBeInTheDocument();
  });

  it('renders wybrane status', () => {
    render(<StatusSelect {...defaultProps} value="wybrane" />);
    expect(screen.getByText('WYBRANE')).toBeInTheDocument();
  });

  it('renders zamówione status', () => {
    render(<StatusSelect {...defaultProps} value="zamówione" />);
    expect(screen.getByText('ZAMÓWIONE')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<StatusSelect {...defaultProps} />);

    const button = screen.getByRole('button', { name: /propozycja/i });
    fireEvent.click(button);

    // All options should be visible in dropdown
    expect(screen.getAllByText('PROPOZYCJA')).toHaveLength(2); // Button + dropdown
    expect(screen.getByText('WYBRANE')).toBeInTheDocument();
    expect(screen.getByText('ZAMÓWIONE')).toBeInTheDocument();
  });

  it('calls onChange when selecting new status', () => {
    const onChange = vi.fn();
    render(<StatusSelect {...defaultProps} onChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /propozycja/i }));

    // Select new status
    fireEvent.click(screen.getByText('WYBRANE'));

    expect(onChange).toHaveBeenCalledWith('wybrane');
  });

  it('does not call onChange when selecting same status', () => {
    const onChange = vi.fn();
    render(<StatusSelect {...defaultProps} onChange={onChange} value="propozycja" />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /propozycja/i }));

    // Click same status
    fireEvent.click(screen.getAllByText('PROPOZYCJA')[1]); // Click in dropdown

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open when disabled', () => {
    render(<StatusSelect {...defaultProps} disabled />);

    const button = screen.getByRole('button', { name: /propozycja/i });
    fireEvent.click(button);

    // Should only show the button, not the dropdown options
    expect(screen.queryAllByText('WYBRANE')).toHaveLength(0);
    expect(screen.queryAllByText('ZAMÓWIONE')).toHaveLength(0);
  });

  it('renders compact size when compact prop is true', () => {
    render(<StatusSelect {...defaultProps} compact />);

    const button = screen.getByRole('button', { name: /propozycja/i });
    expect(button).toHaveClass('px-2', 'py-0.5');
  });

  it('renders regular size by default', () => {
    render(<StatusSelect {...defaultProps} />);

    const button = screen.getByRole('button', { name: /propozycja/i });
    expect(button).toHaveClass('px-3', 'py-1');
  });

  it('shows dropdown arrow when not disabled', () => {
    render(<StatusSelect {...defaultProps} />);

    // SVG should be present
    const button = screen.getByRole('button', { name: /propozycja/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('hides dropdown arrow when disabled', () => {
    render(<StatusSelect {...defaultProps} disabled />);

    const button = screen.getByRole('button', { name: /propozycja/i });
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <StatusSelect {...defaultProps} />
      </div>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /propozycja/i }));
    expect(screen.getByText('WYBRANE')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Dropdown should close (WYBRANE in dropdown should be gone)
    expect(screen.queryAllByText('WYBRANE')).toHaveLength(0);
  });
});
