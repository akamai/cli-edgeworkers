import {
  aggregateExactStatisticsRows,
  aggregateReportTenRows,
  formatClassPercentiles,
  formatCountShort,
  formatMemory,
  formatResponseBodySize,
  formatRate,
  getCustomerLabel,
  sortSubRequestRows
} from '../../src/edgeworkers/report-builder';

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
      expect(formatMemory(0)).toBe('0.00 B');
      expect(formatMemory(999)).toBe('999.00 B');
      expect(formatMemory(1023)).toBe('1023.00 B');
    });

    it('formats kilobyte values using base-1024 units', () => {
      expect(formatMemory(1024)).toBe('1.00 kB');
      expect(formatMemory(53701.9876)).toBe('52.44 kB');
      expect(formatMemory(132432)).toBe('129.33 kB');
    });

    it('formats megabyte values using base-1024 units', () => {
      expect(formatMemory(1024 * 1024)).toBe('1.00 MB');
      expect(formatMemory(3.32 * 1024 * 1024)).toBe('3.32 MB');
    });
  });

  describe('response body size formatting', () => {
    it('uses decimal UI units', () => {
      expect(formatResponseBodySize(50000)).toBe('50.00 kB');
      expect(formatResponseBodySize(500)).toBe('500.00 B');
    });
  });

  describe('sub-request report helpers', () => {
    it('formats counts using compact UI-compatible units', () => {
      expect(formatCountShort(0)).toBe('0');
      expect(formatCountShort(999)).toBe('999');
      expect(formatCountShort(1250)).toBe('1.25 k');
      expect(formatCountShort(6774740)).toBe('6.77 M');
      expect(formatCountShort(221620169)).toBe('221.62 M');
      expect(formatCountShort(1000000000)).toBe('1 B');
      expect(formatCountShort(1250000000)).toBe('1.25 B');
      expect(formatCountShort(9876543210000)).toBe('9.88 T');
    });

    it('aggregates report 10 counts by hostname and status', () => {
      expect(aggregateReportTenRows([
        {Hostname: 'api.example.com', 'HTTP Status': 404, Invocations: 3, 'Error Count': 1, 'Timeout Count': 0},
        {Hostname: 'api.example.com', 'HTTP Status': 404, Invocations: 7, 'Error Count': 2, 'Timeout Count': 1},
        {Hostname: 'cdn.example.com', 'HTTP Status': 404, Invocations: 4, 'Error Count': 4, 'Timeout Count': 0}
      ])).toEqual([
        {Hostname: 'api.example.com', 'HTTP Status': 404, Invocations: 10, 'Error Count': 3, 'Timeout Count': 1},
        {Hostname: 'cdn.example.com', 'HTTP Status': 404, Invocations: 4, 'Error Count': 4, 'Timeout Count': 0}
      ]);
    });

    it('calculates weighted averages and extrema for exact statuses', () => {
      expect(aggregateExactStatisticsRows([
        {Hostname: 'api.example.com', 'HTTP Status': 200, invocations: 2, statistics: {avg: 10, min: 5, max: 20}},
        {Hostname: 'api.example.com', 'HTTP Status': 200, invocations: 8, statistics: {avg: 30, min: 3, max: 40}},
        {Hostname: 'api.example.com', 'HTTP Status': 404, invocations: 1, statistics: {avg: 50, min: 50, max: 50}}
      ])).toEqual([
        {Hostname: 'api.example.com', 'HTTP Status': 200, avg: 26, min: 3, max: 40},
        {Hostname: 'api.example.com', 'HTTP Status': 404, avg: 50, min: 50, max: 50}
      ]);
    });

    it('sorts by hostname and numeric status', () => {
      expect(sortSubRequestRows([
        {Hostname: 'b.example.com', 'HTTP Status': 500},
        {Hostname: 'a.example.com', 'HTTP Status': 404},
        {Hostname: 'a.example.com', 'HTTP Status': 200}
      ])).toEqual([
        {Hostname: 'a.example.com', 'HTTP Status': 200},
        {Hostname: 'a.example.com', 'HTTP Status': 404},
        {Hostname: 'b.example.com', 'HTTP Status': 500}
      ]);
    });

    it('formats class percentiles without adding average or extrema', () => {
      expect(formatClassPercentiles({
        avg: 10,
        min: 1,
        max: 20,
        twentyFivePercentile: 2,
        fiftyPercentile: 5,
        seventyFivePercentile: 8,
        ninetyFivePercentile: 12,
        ninetyNinePercentile: 15
      }, (value) => `${value} ms`)).toEqual({
        p25: '2 ms',
        p50: '5 ms',
        p75: '8 ms',
        p95: '12 ms',
        p99: '15 ms'
      });
    });
  });
});
