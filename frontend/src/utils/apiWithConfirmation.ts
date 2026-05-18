'use client';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  confirmationRequired?: boolean;
  actionConfig?: {
    action: string;
    requiresConfirmation: boolean;
    requiresReason: boolean;
    message: string;
  };
  locked?: boolean;
  invoiceStatus?: string;
  invoiceNo?: string;
  data?: any;
}

// Show confirmation modal
function showConfirmationModal(config: ConfirmationConfig & { requireReason?: boolean }): Promise<{ confirmed: boolean; reason?: string }> {
  return new Promise((resolve) => {
    // Create modal elements
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4';
    
    const modal = document.createElement('div');
    modal.className = 'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto';
    
    const getTypeStyles = () => {
      switch (config.type) {
        case 'danger':
          return {
            icon: '⚠️',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
          };
        case 'info':
          return {
            icon: 'ℹ️',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          };
        default:
          return {
            icon: '⚠️',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
          };
      }
    };

    const styles = getTypeStyles();
    
    modal.innerHTML = `
      <div class="p-6">
        <!-- Icon and Title -->
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center mr-3">
            <span class="text-lg ${styles.iconColor}">${styles.icon}</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900">${config.title}</h3>
        </div>

        <!-- Message -->
        <div class="mb-6">
          <p class="text-sm text-gray-600 whitespace-pre-line">${config.message}</p>
        </div>

        ${config.requireReason ? `
        <!-- Reason Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${config.reasonLabel || 'Reason'} <span class="text-red-500">*</span>
          </label>
          <textarea
            id="confirmation-reason"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows="3"
            placeholder="${config.reasonPlaceholder || 'Please provide a reason for this action...'}"
            maxlength="500"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">
            <span id="char-count">0</span>/500 characters
          </p>
        </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3">
          <button
            id="cancel-btn"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ${config.cancelText || 'Cancel'}
          </button>
          <button
            id="confirm-btn"
            class="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn}"
          >
            ${config.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Handle reason input character count
    if (config.requireReason) {
      const reasonInput = modal.querySelector('#confirmation-reason') as HTMLTextAreaElement;
      const charCount = modal.querySelector('#char-count') as HTMLSpanElement;
      
      reasonInput?.addEventListener('input', () => {
        charCount.textContent = reasonInput.value.length.toString();
      });
    }

    // Handle cancel
    const cancelBtn = modal.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve({ confirmed: false });
    });

    // Handle confirm
    const confirmBtn = modal.querySelector('#confirm-btn');
    confirmBtn?.addEventListener('click', () => {
      let reason = '';
      
      if (config.requireReason) {
        const reasonInput = modal.querySelector('#confirmation-reason') as HTMLTextAreaElement;
        reason = reasonInput?.value?.trim() || '';
        
        if (!reason) {
          alert('Reason is required for this action');
          return;
        }
      }

      document.body.removeChild(overlay);
      resolve({ confirmed: true, reason: reason || undefined });
    });

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
        resolve({ confirmed: false });
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Main API function with confirmation support
export async function apiWithConfirmation(
  url: string,
  options: RequestInit = {},
  confirmationConfig?: Partial<ConfirmationConfig>
): Promise<ApiResponse> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    // First attempt
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data: ApiResponse = await response.json();

    // Handle locked invoices
    if (!response.ok && data.locked) {
      alert(`Cannot modify ${data.invoiceNo}: ${data.message}`);
      throw new Error(data.message || 'Invoice is locked');
    }

    // Handle confirmation requirement
    if (!response.ok && data.confirmationRequired && data.actionConfig) {
      const config: ConfirmationConfig = {
        title: confirmationConfig?.title || 'Confirm Action',
        message: data.actionConfig.message,
        type: confirmationConfig?.type || 'warning',
        requireReason: data.actionConfig.requiresReason,
        confirmText: confirmationConfig?.confirmText || 'Confirm',
        cancelText: confirmationConfig?.cancelText || 'Cancel',
        reasonLabel: confirmationConfig?.reasonLabel || 'Reason for this action',
        reasonPlaceholder: confirmationConfig?.reasonPlaceholder || 'Please provide a reason for this action...'
      };

      // Show confirmation dialog
      const result = await showConfirmationModal(config);

      if (!result.confirmed) {
        throw new Error('Action cancelled by user');
      }

      // Retry with confirmation headers
      const confirmedHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-confirm-action': 'true'
      };

      // Add any additional headers from the original request
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            confirmedHeaders[key] = value;
          }
        });
      }

      if (result.reason) {
        confirmedHeaders['x-action-reason'] = result.reason;
      }

      const confirmedResponse = await fetch(url, {
        ...options,
        headers: confirmedHeaders
      });

      return await confirmedResponse.json();
    }

    // Handle other errors
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Specific API functions for common actions
export const invoiceAPI = {
  updatePayment: (invoiceId: string, paymentData: any) =>
    apiWithConfirmation(`/api/invoices/${invoiceId}/payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    }, {
      title: 'Confirm Payment Update',
      message: 'Are you sure you want to update this invoice payment?',
      type: 'warning'
    }),

  cancelInvoice: (invoiceId: string) =>
    apiWithConfirmation(`/api/invoices/${invoiceId}/cancel`, {
      method: 'PUT'
    }, {
      title: 'Cancel Invoice',
      message: 'This will cancel the invoice and restore stock quantities.',
      type: 'danger',
      confirmText: 'Cancel Invoice'
    }),

  addPayment: (invoiceId: string, paymentData: any) =>
    apiWithConfirmation(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }, {
      title: 'Add Payment',
      message: 'Are you sure you want to add this payment?',
      type: 'info'
    })
};

export const stockAPI = {
  updateStock: (productId: string, stockData: any) =>
    apiWithConfirmation(`/api/products/${productId}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData)
    }, {
      title: 'Manual Stock Adjustment',
      message: 'Manual stock adjustments directly affect inventory levels and valuations.',
      type: 'warning',
      confirmText: 'Update Stock'
    })
};

export const salaryAPI = {
  updateSalary: (salaryId: string, salaryData: any) =>
    apiWithConfirmation(`/api/salary-payments/${salaryId}`, {
      method: 'PUT',
      body: JSON.stringify(salaryData)
    }, {
      title: 'Edit Salary Record',
      message: 'Are you sure you want to edit this salary record?',
      type: 'warning'
    }),

  deleteSalary: (salaryId: string) =>
    apiWithConfirmation(`/api/salary-payments/${salaryId}`, {
      method: 'DELETE'
    }, {
      title: 'Delete Salary Record',
      message: 'This will permanently delete the salary record and affect payroll calculations.',
      type: 'danger',
      confirmText: 'Delete Record'
    })
};

export default apiWithConfirmation;