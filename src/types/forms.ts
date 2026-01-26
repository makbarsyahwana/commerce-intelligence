// Forms Domain Types

export interface SyncFormData {
  provider?: string;
  force?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}
