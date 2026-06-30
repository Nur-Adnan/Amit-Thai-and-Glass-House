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

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Please provide a reason for this action...',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setReasonError('Reason is required for this action');
      return;
    }

    setReasonError('');
    onConfirm(reason.trim() || undefined);
  };

  const handleCancel = () => {
    setReason('');
    setReasonError('');
    onCancel();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmColor: 'danger' as const
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmColor: 'warning' as const
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmColor: 'primary' as const
        };
      default:
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmColor: 'warning' as const
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleCancel(); }}
      placement="center"
      size="md"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <span className={`text-lg ${styles.iconColor}`}>{styles.icon}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </ModalHeader>

        <ModalBody>
          {/* Message */}
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>

          {/* Reason Input */}
          {requireReason && (
            <div>
              <Textarea
                label={
                  <span>
                    {reasonLabel} <span className="text-red-500">*</span>
                  </span>
                }
                labelPlacement="outside"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                minRows={3}
                placeholder={reasonPlaceholder}
                maxLength={500}
                isInvalid={!!reasonError}
                errorMessage={reasonError}
                className="resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {reason.length}/500 characters
              </p>
            </div>
          )}
        </ModalBody>

        {/* Action Buttons */}
        <ModalFooter>
          <Button
            variant="bordered"
            onPress={handleCancel}
            isDisabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            color={styles.confirmColor}
            onPress={handleConfirm}
            isDisabled={loading}
            isLoading={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
