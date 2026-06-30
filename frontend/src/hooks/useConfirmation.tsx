'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';

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
  const [reason, setReason] = useState('');

  const showConfirmation = (confirmationConfig: ConfirmationConfig): Promise<{ confirmed: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      setConfig(confirmationConfig);
      setReason('');
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = (reasonValue?: string) => {
    setLoading(true);
    if (resolvePromise) {
      resolvePromise({ confirmed: true, reason: reasonValue });
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

    const iconBg =
      config.type === 'danger' ? 'bg-red-100' :
      config.type === 'info' ? 'bg-blue-100' : 'bg-yellow-100';
    const iconColor =
      config.type === 'danger' ? 'text-red-600' :
      config.type === 'info' ? 'text-blue-600' : 'text-yellow-600';
    const confirmColor =
      config.type === 'danger' ? 'danger' :
      config.type === 'info' ? 'primary' : 'warning';

    return (
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) handleCancel(); }}
        placement="center"
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
              <span className={`text-lg ${iconColor}`}>
                {config.type === 'info' ? 'ℹ️' : '⚠️'}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
          </ModalHeader>

          <ModalBody>
            {/* Message */}
            <p className="text-sm text-gray-600 whitespace-pre-line">{config.message}</p>

            {/* Reason Input */}
            {config.requireReason && (
              <Textarea
                id="confirmation-reason"
                label={
                  <span>
                    {config.reasonLabel || 'Reason'} <span className="text-red-500">*</span>
                  </span>
                }
                labelPlacement="outside"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minRows={3}
                placeholder={config.reasonPlaceholder || 'Please provide a reason for this action...'}
                maxLength={500}
                className="resize-none"
              />
            )}
          </ModalBody>

          {/* Action Buttons */}
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={handleCancel}
              isDisabled={loading}
            >
              {config.cancelText || 'Cancel'}
            </Button>
            <Button
              color={confirmColor}
              onPress={() => {
                const trimmedReason = reason.trim();

                if (config.requireReason && !trimmedReason) {
                  alert('Reason is required for this action');
                  return;
                }

                handleConfirm(trimmedReason);
              }}
              isDisabled={loading}
              isLoading={loading}
            >
              {loading ? 'Processing...' : (config.confirmText || 'Confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
