
// Data validation service for ensuring data integrity
export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'required';
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

class DataValidationService {
  private schemas: Map<string, ValidationSchema> = new Map();

  constructor() {
    this.initializeSchemas();
  }

  private initializeSchemas() {
    // Order validation schema
    this.schemas.set('orders', {
      tokenNumber: [{ field: 'tokenNumber', type: 'required' }, { field: 'tokenNumber', type: 'string', min: 3 }],
      orderType: [{ field: 'orderType', type: 'required' }],
      items: [{ field: 'items', type: 'required' }],
      subtotal: [{ field: 'subtotal', type: 'number', min: 0 }],
      total: [{ field: 'total', type: 'number', min: 0 }]
    });

    // Menu item validation schema
    this.schemas.set('menuItems', {
      name: [{ field: 'name', type: 'required' }, { field: 'name', type: 'string', min: 1 }],
      price: [{ field: 'price', type: 'number', min: 0 }],
      category: [{ field: 'category', type: 'required' }],
      available: [{ field: 'available', type: 'boolean' }]
    });

    // Table validation schema
    this.schemas.set('tables', {
      number: [{ field: 'number', type: 'number', min: 1 }],
      capacity: [{ field: 'capacity', type: 'number', min: 1, max: 20 }],
      status: [{ field: 'status', type: 'required' }]
    });

    // Customer validation schema
    this.schemas.set('customers', {
      name: [{ field: 'name', type: 'string', min: 2 }],
      phone: [{ field: 'phone', type: 'phone' }],
      email: [{ field: 'email', type: 'email' }]
    });
  }

  validate(tableName: string, data: any): { isValid: boolean; errors: string[] } {
    const schema = this.schemas.get(tableName);
    if (!schema) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];

      for (const rule of rules) {
        const error = this.validateField(value, rule, fieldName);
        if (error) {
          errors.push(error);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return `${fieldName} is required`;
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return `${fieldName} must be a string`;
        }
        if (rule.min && value.length < rule.min) {
          return `${fieldName} must be at least ${rule.min} characters`;
        }
        if (rule.max && value.length > rule.max) {
          return `${fieldName} must not exceed ${rule.max} characters`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldName} must be a valid number`;
        }
        if (rule.min !== undefined && value < rule.min) {
          return `${fieldName} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
          return `${fieldName} must not exceed ${rule.max}`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${fieldName} must be true or false`;
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${fieldName} must be a valid email address`;
        }
        break;

      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return `${fieldName} must be a valid phone number`;
        }
        break;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }

    return null;
  }
}

export const dataValidationService = new DataValidationService();
