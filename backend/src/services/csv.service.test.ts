import { describe, it, expect } from 'vitest';
import { hasContactInfo } from './csv.service';

describe('CSV Service', () => {
  describe('hasContactInfo', () => {
    it('should return true for a row with a valid email', () => {
      const row = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };
      expect(hasContactInfo(row)).toBe(true);
    });

    it('should return true for a row with a valid mobile number in a vaguely named column', () => {
      const row = {
        name: 'Jane Doe',
        contact_info: '+1 (555) 123-4567',
      };
      expect(hasContactInfo(row)).toBe(true);
    });

    it('should return false for a row with neither email nor mobile', () => {
      const row = {
        name: 'No Contact',
        company: 'GrowEasy',
        city: 'Mumbai',
        email: '',
        phone: '  ',
      };
      expect(hasContactInfo(row)).toBe(false);
    });

    it('should detect email even if column name is completely unrelated', () => {
      const row = {
        field1: 'Some data',
        field2: 'hidden.email@test.com',
      };
      expect(hasContactInfo(row)).toBe(true);
    });
    
    it('should detect phone even if column name is completely unrelated', () => {
      const row = {
        field1: 'Some data',
        field2: '+91 98765 43210',
      };
      expect(hasContactInfo(row)).toBe(true);
    });
  });
});
