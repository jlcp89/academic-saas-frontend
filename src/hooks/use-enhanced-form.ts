import { useState, useCallback, useEffect } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNotificationStore } from '@/lib/stores/notification-store';
import toast from 'react-hot-toast';

interface EnhancedFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToasts?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSuccess?: boolean;
  autoSave?: {
    enabled: boolean;
    debounceMs?: number;
    storageKey: string;
  };
}

interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  submitCount: number;
  lastSubmittedAt: Date | null;
  errors: Record<string, string>;
}

export function useEnhancedForm<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  successMessage = 'Form submitted successfully',
  errorMessage = 'An error occurred while submitting the form',
  showToasts = true,
  validateOnChange = true,
  validateOnBlur = true,
  resetOnSuccess = false,
  autoSave,
  ...formOptions
}: EnhancedFormOptions<T>) {
  const { addNotification } = useNotificationStore();
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isDirty: false,
    isValid: false,
    submitCount: 0,
    lastSubmittedAt: null,
    errors: {},
  });

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: validateOnChange ? 'onChange' : validateOnBlur ? 'onBlur' : 'onSubmit',
    ...formOptions,
  });

  const { 
    handleSubmit, 
    formState: { errors, isDirty, isValid, isSubmitting },
    watch,
    reset,
    setError,
    clearErrors,
    trigger,
  } = form;

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave?.enabled) return;

    const subscription = watch((value) => {
      if (isDirty) {
        const timeoutId = setTimeout(() => {
          try {
            localStorage.setItem(autoSave.storageKey, JSON.stringify(value));
          } catch (error) {
            console.warn('Failed to auto-save form data:', error);
          }
        }, autoSave.debounceMs || 1000);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isDirty, autoSave]);

  // Load auto-saved data on mount
  useEffect(() => {
    if (!autoSave?.enabled) return;

    try {
      const savedData = localStorage.getItem(autoSave.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
      }
    } catch (error) {
      console.warn('Failed to load auto-saved form data:', error);
    }
  }, [autoSave, reset]);

  // Update form state
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      isDirty,
      isValid,
      isSubmitting,
      errors: Object.keys(errors).reduce((acc, key) => {
        acc[key] = errors[key as keyof typeof errors]?.message || '';
        return acc;
      }, {} as Record<string, string>),
    }));
  }, [isDirty, isValid, isSubmitting, errors]);

  const handleFormSubmit = useCallback(async (data: T) => {
    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
    }));

    try {
      await onSubmit(data);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        lastSubmittedAt: new Date(),
      }));

      if (showToasts) {
        toast.success(successMessage);
      }

      addNotification({
        title: 'Success',
        message: successMessage,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess(data);
      }

      if (resetOnSuccess) {
        reset();
      }

      // Clear auto-saved data on successful submit
      if (autoSave?.enabled) {
        try {
          localStorage.removeItem(autoSave.storageKey);
        } catch (error) {
          console.warn('Failed to clear auto-saved data:', error);
        }
      }

    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
      }));

      const errorInstance = error instanceof Error ? error : new Error(errorMessage);
      
      if (showToasts) {
        toast.error(errorInstance.message);
      }

      addNotification({
        title: 'Error',
        message: errorInstance.message,
        type: 'error',
      });

      if (onError) {
        onError(errorInstance);
      }

      // Handle validation errors from server
      if (error && typeof error === 'object' && 'field' in error) {
        const fieldError = error as { field: string; message: string };
        setError(fieldError.field as Path<T>, {
          type: 'server',
          message: fieldError.message,
        });
      }
    }
  }, [onSubmit, onSuccess, onError, successMessage, errorMessage, showToasts, addNotification, reset, resetOnSuccess, setError, autoSave]);

  // Validate specific field
  const validateField = useCallback(async (fieldName: Path<T>) => {
    const result = await trigger(fieldName);
    return result;
  }, [trigger]);

  // Validate all fields
  const validateForm = useCallback(async () => {
    const result = await trigger();
    return result;
  }, [trigger]);

  // Reset form with optional data
  const resetForm = useCallback((data?: T) => {
    reset(data);
    clearErrors();
    setFormState(prev => ({
      ...prev,
      submitCount: 0,
      lastSubmittedAt: null,
      errors: {},
    }));
  }, [reset, clearErrors]);

  // Clear auto-saved data
  const clearAutoSave = useCallback(() => {
    if (autoSave?.enabled) {
      try {
        localStorage.removeItem(autoSave.storageKey);
      } catch (error) {
        console.warn('Failed to clear auto-saved data:', error);
      }
    }
  }, [autoSave]);

  // Set field value with validation
  const setFieldValue = useCallback((fieldName: Path<T>, value: any, shouldValidate = true) => {
    form.setValue(fieldName, value, { 
      shouldDirty: true,
      shouldValidate,
    });
  }, [form]);

  // Set multiple field values
  const setFieldValues = useCallback((values: Partial<T>, shouldValidate = true) => {
    Object.entries(values).forEach(([key, value]) => {
      setFieldValue(key as Path<T>, value, shouldValidate);
    });
  }, [setFieldValue]);

  // Get field error message
  const getFieldError = useCallback((fieldName: Path<T>) => {
    return formState.errors[fieldName] || '';
  }, [formState.errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: Path<T>) => {
    return Boolean(formState.errors[fieldName]);
  }, [formState.errors]);

  // Submit form programmatically
  const submitForm = useCallback(() => {
    handleSubmit(handleFormSubmit)();
  }, [handleSubmit, handleFormSubmit]);

  return {
    ...form,
    // Enhanced form state
    formState,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    isValid: formState.isValid,
    submitCount: formState.submitCount,
    lastSubmittedAt: formState.lastSubmittedAt,
    
    // Enhanced methods
    handleSubmit: handleSubmit(handleFormSubmit),
    validateField,
    validateForm,
    resetForm,
    clearAutoSave,
    setFieldValue,
    setFieldValues,
    getFieldError,
    hasFieldError,
    submitForm,
  };
}

// Hook for form field validation status
export function useFieldValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
) {
  const fieldState = form.getFieldState(fieldName);
  const error = form.formState.errors[fieldName];
  
  return {
    hasError: Boolean(error),
    error: error?.message || '',
    isTouched: fieldState.isTouched,
    isDirty: fieldState.isDirty,
    isValidating: fieldState.isValidating,
  };
}

// Hook for form submission with loading states
export function useFormSubmission<T extends FieldValues>(
  onSubmit: (data: T) => Promise<void>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showToasts?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  const submit = useCallback(async (data: T) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(data);
      
      if (options?.showToasts !== false) {
        toast.success(options?.successMessage || 'Success');
      }

      addNotification({
        title: 'Success',
        message: options?.successMessage || 'Operation completed successfully',
        type: 'success',
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (options?.errorMessage || 'An error occurred');
      setError(errorMessage);

      if (options?.showToasts !== false) {
        toast.error(errorMessage);
      }

      addNotification({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });

      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit, options, addNotification]);

  return {
    submit,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}