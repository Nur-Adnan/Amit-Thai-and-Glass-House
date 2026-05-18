import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';

describe('StatusBadge Component', () => {
  describe('Payment Status', () => {
    test('should render paid status correctly', () => {
      render(<StatusBadge status="paid" />);
      
      const badge = screen.getByText('Paid');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    test('should render partial status correctly', () => {
      render(<StatusBadge status="partial" />);
      
      const badge = screen.getByText('Partial');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    test('should render due status correctly', () => {
      render(<StatusBadge status="due" />);
      
      const badge = screen.getByText('Due');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('should render pending status correctly', () => {
      render(<StatusBadge status="pending" />);
      
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Stock Status', () => {
    test('should render in-stock status correctly', () => {
      render(<StatusBadge status="in-stock" />);
      
      const badge = screen.getByText('In Stock');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    test('should render low-stock status correctly', () => {
      render(<StatusBadge status="low-stock" />);
      
      const badge = screen.getByText('Low Stock');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    test('should render out-of-stock status correctly', () => {
      render(<StatusBadge status="out-of-stock" />);
      
      const badge = screen.getByText('Out of Stock');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Risk Status', () => {
    test('should render good status correctly', () => {
      render(<StatusBadge status="good" />);
      
      const badge = screen.getByText('Good');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    test('should render warning status correctly', () => {
      render(<StatusBadge status="warning" />);
      
      const badge = screen.getByText('Warning');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    test('should render critical status correctly', () => {
      render(<StatusBadge status="critical" />);
      
      const badge = screen.getByText('Critical');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('should render blocked status correctly', () => {
      render(<StatusBadge status="blocked" />);
      
      const badge = screen.getByText('Blocked');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Props and Customization', () => {
    test('should render custom text', () => {
      render(<StatusBadge status="paid" text="Fully Paid" />);
      
      expect(screen.getByText('Fully Paid')).toBeInTheDocument();
      expect(screen.queryByText('Paid')).not.toBeInTheDocument();
    });

    test('should hide icon when showIcon is false', () => {
      render(<StatusBadge status="paid" showIcon={false} />);
      
      const badge = screen.getByText('Paid');
      expect(badge).toBeInTheDocument();
      
      // Check that no SVG icon is present
      const icon = badge.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    test('should show icon by default', () => {
      render(<StatusBadge status="paid" />);
      
      const badge = screen.getByText('Paid');
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('should apply different sizes', () => {
      const { rerender } = render(<StatusBadge status="paid" size="sm" />);
      let badge = screen.getByText('Paid');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5');

      rerender(<StatusBadge status="paid" size="default" />);
      badge = screen.getByText('Paid');
      expect(badge).toHaveClass('text-xs', 'px-2.5', 'py-0.5');

      rerender(<StatusBadge status="paid" size="lg" />);
      badge = screen.getByText('Paid');
      expect(badge).toHaveClass('text-sm', 'px-3', 'py-1');
    });

    test('should apply animation for critical statuses', () => {
      const { rerender } = render(<StatusBadge status="critical" animate={true} />);
      let badge = screen.getByText('Critical');
      expect(badge).toHaveClass('animate-pulse');

      rerender(<StatusBadge status="out-of-stock" animate={true} />);
      badge = screen.getByText('Out of Stock');
      expect(badge).toHaveClass('animate-pulse');

      rerender(<StatusBadge status="blocked" animate={true} />);
      badge = screen.getByText('Blocked');
      expect(badge).toHaveClass('animate-pulse');
    });

    test('should not animate non-critical statuses', () => {
      render(<StatusBadge status="paid" animate={true} />);
      
      const badge = screen.getByText('Paid');
      expect(badge).not.toHaveClass('animate-pulse');
    });

    test('should apply custom className', () => {
      render(<StatusBadge status="paid" className="custom-class" />);
      
      const badge = screen.getByText('Paid');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<StatusBadge status="paid" />);
      
      const badge = screen.getByText('Paid');
      expect(badge).toHaveAttribute('role', 'status');
    });

    test('should be keyboard accessible', () => {
      render(<StatusBadge status="paid" />);
      
      const badge = screen.getByText('Paid');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Color Consistency', () => {
    test('should use consistent green colors for positive states', () => {
      const positiveStates = ['paid', 'active', 'in-stock', 'good'];
      
      positiveStates.forEach(status => {
        const { unmount } = render(<StatusBadge status={status as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800');
        unmount();
      });
    });

    test('should use consistent orange colors for warning states', () => {
      const warningStates = ['partial', 'low-stock', 'warning'];
      
      warningStates.forEach(status => {
        const { unmount } = render(<StatusBadge status={status as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
        unmount();
      });
    });

    test('should use consistent red colors for critical states', () => {
      const criticalStates = ['due', 'out-of-stock', 'critical', 'blocked'];
      
      criticalStates.forEach(status => {
        const { unmount } = render(<StatusBadge status={status as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('bg-red-100', 'text-red-800');
        unmount();
      });
    });

    test('should use consistent gray colors for neutral states', () => {
      const neutralStates = ['pending', 'inactive'];
      
      neutralStates.forEach(status => {
        const { unmount } = render(<StatusBadge status={status as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
        unmount();
      });
    });
  });
});