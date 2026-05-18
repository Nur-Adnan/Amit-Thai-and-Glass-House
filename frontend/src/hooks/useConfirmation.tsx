'use client';

import { useState } from 'react';

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

interface UseConfirmationReturn {
  showConfirmation: (config: ConfirmationConfig) => Promise<{ confirmed: boolean; reason?: string }>;
  ConfirmationComponent: React.ComponentType;
}

export function useConfirmation(): UseConfirmationReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: { confirmed: boolean; reason?: string }) => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const showConfirmation = (confirmationConfig: ConfirmationConfig): Promise<{ confirmed: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      setConfig(confirmationConfig);
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = (reason?: string) => {
    setLoading(true);
    if (resolvePromise) {
      resolvePromise({ confirmed: true, reason });
    }
    setIsOpen(false);
    setLoading(false);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise({ confirmed: false });
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const ConfirmationComponent = () => {
    if (!config) return null;

    return (
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 ${isOpen ? '' : 'hidden'}`}>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-center mb-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                config.type === 'danger' ? 'bg-red-100' :
                config.type === 'info' ? 'bg-blue-100' : 'bg-yellow-100'
              }`}>
                <span className={`text-lg ${
                  config.type === 'danger' ? 'text-red-600' :
                  config.type === 'info' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {config.type === 'info' ? 'ℹ️' : '⚠️'}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 whitespace-pre-line">{config.message}</p>
            </div>

            {/* Reason Input */}
            {config.requireReason && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.reasonLabel || 'Reason'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="confirmation-reason"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder={config.reasonPlaceholder || 'Please provide a reason for this action...'}
                  maxLength={500}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {config.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const reasonElement = document.getElementById('confirmation-reason') as HTMLTextAreaElement;
                  const reason = reasonElement?.value?.trim();
                  
                  if (config.requireReason && !reason) {
                    alert('Reason is required for this action');
                    return;
                  }
                  
                  handleConfirm(reason);
                }}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  config.type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                  config.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                  'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                }`}
              >
                {loading ? 'Processing...' : (config.confirmText || 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    showConfirmation,
    ConfirmationComponent
  };
}

// Helper function to make API calls with confirmation
export async function makeConfirmedRequest(
  url: string,
  options: RequestInit = {},
  confirmationConfig?: ConfirmationConfig
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // First attempt - might require confirmation
  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  // If confirmation is required
  if (!response.ok && data.confirmationRequired) {
    if (!confirmationConfig) {
      throw new Error('Confirmation required but no confirmation config provided');
    }

    // This function should be called from a component that has access to useConfirmation
    throw new Error('Confirmation required - handle this in the component');
  }

  return response;
}