import {formatMemory, formatRate, getCustomerLabel} from '../../src/edgeworkers/report-builder';

describe('report builder helpers', () => {
  describe('formatRate', () => {
    it('returns 0.00 % when total is zero', () => {
      expect(formatRate(10, 0)).toBe('0.00 %');
    });

    it('formats percentages to two decimal places', () => {
      expect(formatRate(37, 158)).toBe('23.42 %');
      expect(formatRate(45, 158)).toBe('28.48 %');
    });
  });

  describe('getCustomerLabel', () => {
    it('returns the customer name when no VCDs are present', () => {
      expect(getCustomerLabel({customerName: 'IPQA Akamai Alta-WAA'})).toBe('IPQA Akamai Alta-WAA');
    });

    it('appends one or more VCDs in parentheses', () => {
      expect(getCustomerLabel({customerName: 'Tiktok.com', vcds: [{vcd: 112232}]})).toBe('Tiktok.com (112232)');
      expect(getCustomerLabel({customerName: 'Microsoft INC', vcds: [{vcd: 235433}, {vcd: 123434}]})).toBe('Microsoft INC (235433,123434)');
    });
  });

  describe('formatMemory', () => {
    it('returns N/A for undefined values', () => {
      expect(formatMemory(undefined)).toBe('N/A');
    });

    it('formats byte values without converting units', () => {
      expect(formatMemory(999)).toBe('999 B');
      expect(formatMemory(1023)).toBe('1023 B');
    });

    it('formats kilobyte values using base-1024 units', () => {
      expect(formatMemory(1024)).toBe('1.00 KB');
      expect(formatMemory(53701.9876)).toBe('52.44 KB');
      expect(formatMemory(132432)).toBe('129.33 KB');
    });

    it('formats megabyte values using base-1024 units', () => {
      expect(formatMemory(1024 * 1024)).toBe('1.00 MB');
      expect(formatMemory(3.32 * 1024 * 1024)).toBe('3.32 MB');
    });
  });
});

