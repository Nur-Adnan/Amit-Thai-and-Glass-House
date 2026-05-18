import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Receipt, Users, Package } from 'lucide-react';

describe('EmptyState Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Basic Rendering', () => {
    test('should render with required props', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
        />
      );

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // SVG icon
    });

    test('should render with description', () => {
      render(
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Add your first customer to get started"
        />
      );

      expect(screen.getByText('No customers found')).toBeInTheDocument();
      expect(screen.getByText('Add your first customer to get started')).toBeInTheDocument();
    });

    test('should render with action button', () => {
      render(
        <EmptyState
          icon={Package}
          title="No products found"
          description="Start by adding your first product"
          action={{
            label: "Add Product",
            onClick: mockOnClick
          }}
        />
      );

      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Start by adding your first product')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    test('should render different icons correctly', () => {
      const { rerender } = render(
        <EmptyState
          icon={Receipt}
          title="Test"
        />
      );

      // Check that icon is rendered (we can't easily test which specific icon)
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

      // Test with different icon
      rerender(
        <EmptyState
          icon={Users}
          title="Test"
        />
      );

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    test('should apply correct icon styling', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="Test"
        />
      );

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement;
      expect(iconContainer).toHaveClass('mb-4', 'p-4', 'rounded-full', 'bg-muted/50');
    });
  });

  describe('Action Button', () => {
    test('should call onClick when action button is clicked', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          action={{
            label: "Create Invoice",
            onClick: mockOnClick
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Create Invoice' });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should render different button variants', () => {
      const { rerender } = render(
        <EmptyState
          icon={Receipt}
          title="Test"
          action={{
            label: "Primary Action",
            onClick: mockOnClick,
            variant: "default"
          }}
        />
      );

      let button = screen.getByRole('button', { name: 'Primary Action' });
      expect(button).toBeInTheDocument();

      rerender(
        <EmptyState
          icon={Receipt}
          title="Test"
          action={{
            label: "Secondary Action",
            onClick: mockOnClick,
            variant: "outline"
          }}
        />
      );

      button = screen.getByRole('button', { name: 'Secondary Action' });
      expect(button).toBeInTheDocument();

      rerender(
        <EmptyState
          icon={Receipt}
          title="Test"
          action={{
            label: "Tertiary Action",
            onClick: mockOnClick,
            variant: "secondary"
          }}
        />
      );

      button = screen.getByRole('button', { name: 'Tertiary Action' });
      expect(button).toBeInTheDocument();
    });

    test('should not render action button when not provided', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="No action available"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    test('should apply default styling classes', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="Test Title"
        />
      );

      const container = screen.getByText('Test Title').closest('div');
      expect(container).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'py-16',
        'px-4',
        'text-center'
      );
    });

    test('should apply custom className', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="Test Title"
          className="custom-empty-state"
        />
      );

      const container = screen.getByText('Test Title').closest('div');
      expect(container).toHaveClass('custom-empty-state');
    });

    test('should have proper text hierarchy', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="Main Title"
          description="Supporting description text"
        />
      );

      const title = screen.getByText('Main Title');
      const description = screen.getByText('Supporting description text');

      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-foreground', 'mb-2');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground', 'mb-6', 'max-w-sm');
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Create your first invoice to get started"
          action={{
            label: "Create Invoice",
            onClick: mockOnClick
          }}
        />
      );

      // Title should be a heading
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('No invoices found');

      // Button should be accessible
      const button = screen.getByRole('button', { name: 'Create Invoice' });
      expect(button).toBeInTheDocument();
    });

    test('should be keyboard accessible', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          action={{
            label: "Create Invoice",
            onClick: mockOnClick
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Create Invoice' });
      
      // Button should be focusable
      button.focus();
      expect(button).toHaveFocus();

      // Should trigger on Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should have proper ARIA attributes', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Create your first invoice to get started"
        />
      );

      const container = screen.getByText('No invoices found').closest('div');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Content Variations', () => {
    test('should handle long titles gracefully', () => {
      const longTitle = "This is a very long title that should wrap properly and maintain good readability";
      
      render(
        <EmptyState
          icon={Receipt}
          title={longTitle}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('should handle long descriptions gracefully', () => {
      const longDescription = "This is a very long description that provides detailed information about the empty state and what the user can do to resolve it. It should wrap properly and maintain good readability.";
      
      render(
        <EmptyState
          icon={Receipt}
          title="Test"
          description={longDescription}
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    test('should handle empty strings gracefully', () => {
      render(
        <EmptyState
          icon={Receipt}
          title=""
          description=""
        />
      );

      // Should still render the component structure
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Context-Specific Usage', () => {
    test('should work for invoice empty state', () => {
      render(
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Create your first invoice to get started"
          action={{
            label: "Create Invoice",
            onClick: mockOnClick
          }}
        />
      );

      expect(screen.getByText('No invoices found')).toBeInTheDocument();
      expect(screen.getByText('Create your first invoice to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Invoice' })).toBeInTheDocument();
    });

    test('should work for customer empty state', () => {
      render(
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Add your first customer to get started"
          action={{
            label: "Add Customer",
            onClick: mockOnClick
          }}
        />
      );

      expect(screen.getByText('No customers found')).toBeInTheDocument();
      expect(screen.getByText('Add your first customer to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Customer' })).toBeInTheDocument();
    });

    test('should work for inventory empty state', () => {
      render(
        <EmptyState
          icon={Package}
          title="No products found"
          description="Start by adding your first product"
          action={{
            label: "Add Product",
            onClick: mockOnClick
          }}
        />
      );

      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Start by adding your first product')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    });
  });
});