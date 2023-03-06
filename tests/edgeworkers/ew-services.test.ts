import * as httpEdge from '../../src/cli-httpRequest';
import * as ewService from '../../src/edgeworkers/ew-service';
import { ErrorMessage } from '../../src/utils/http-error-message';

describe('ew service tests', () => {
  // Test variables
  const defaultTimeout = 120000;

  // http spies
  let getJsonSpy;

  beforeEach(() => {
    getJsonSpy = jest.spyOn(httpEdge, 'getJson');
  });

  describe('getLimits', () => {
    const mockResponse = [{ limitId: 1 }, { limitId: 2 }];
    let getLimitsSpy;
    
    beforeEach(() => {
      getLimitsSpy = jest.spyOn(ewService, 'getLimits');
    });

    it('should return the limits list', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/limits`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getLimits();

      expect(getLimitsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
      const mockError = {
        status: 500,
        detail: 'something went wrong',
      };
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/limits`);
        expect(timeout).toEqual(defaultTimeout);
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const error = await ewService.getLimits();

      expect(getLimitsSpy).toHaveBeenCalled();
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.error_reason).toEqual(
        `${ErrorMessage['GET_LIMITS_ERROR']} ${mockError.detail}`
      );
    });
  });

  describe('getAvailableReports', () => {
    const mockResponse = [{ reportId: 1 }, { reportId: 2 }];
    let getAvailableReportsSpy;
    beforeEach(() => {
      getAvailableReportsSpy = jest.spyOn(ewService, 'getAvailableReports');
    });

    it('should return the list of available reports', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/reports`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getAvailableReports();

      expect(getAvailableReportsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
      const mockError = {
        status: 404,
        detail: 'Unable to fetch EdgeWorker ID "558591"',
      };
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/reports`);
        expect(timeout).toEqual(defaultTimeout);
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const error = await ewService.getAvailableReports();

      expect(getAvailableReportsSpy).toHaveBeenCalled();
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.error_reason).toEqual(
        `${ErrorMessage['GET_AVAILABLE_REPORTS_ERROR']} ${mockError.detail}`
      );
    });
  });

  describe('getReport', () => {
    const reportId = 1;
    const start = 'startDate';
    const end = 'endDate';
    const ewid = '123';
    const mockResponse = { report: 'someData' };

    let getReportSpy;
    beforeEach(() => {
      getReportSpy = jest.spyOn(ewService, 'getReport');
    });

    it('should return the report and set query params for the ewid and start date', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toContain(
          `${ewService.EDGEWORKERS_API_BASE}/reports/${reportId}`
        );
        expect(path).toContain(`?start=${start}&edgeWorker=${ewid}`);
        expect(path).not.toContain('&end=');
        expect(path).not.toContain('&status=');
        expect(path).not.toContain('&eventHandler=');
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getReport(reportId, ewid, start, [], []);

      expect(getReportSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should return the report and set query params for the ewid, start, and end', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toContain(
          `${ewService.EDGEWORKERS_API_BASE}/reports/${reportId}`
        );
        expect(path).toContain(`?start=${start}&edgeWorker=${ewid}`);
        expect(path).toContain(`&end=${end}`);
        expect(path).not.toContain('&status=');
        expect(path).not.toContain('&eventHandler=');
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getReport(reportId, ewid, start, [], [], end);

      expect(getReportSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should return the report and set query params for the ewid, start, end, and status', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toContain(
          `${ewService.EDGEWORKERS_API_BASE}/reports/${reportId}`
        );
        expect(path).toContain(`?start=${start}&edgeWorker=${ewid}`);
        expect(path).toContain(`&end=${end}`);
        expect(path).toContain('&status=stat1&status=stat2');
        expect(path).not.toContain('&eventHandler=');
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getReport(
        reportId,
        ewid,
        start,
        ['stat1', 'stat2'],
        [],
        end
      );

      expect(getReportSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should return the report and set query params for the ewid, start, end, status, and eventHandler', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toContain(
          `${ewService.EDGEWORKERS_API_BASE}/reports/${reportId}`
        );
        expect(path).toContain(`?start=${start}&edgeWorker=${ewid}`);
        expect(path).toContain(`&end=${end}`);
        expect(path).toContain('&status=stat1&status=stat2');
        expect(path).toContain('&eventHandler=ev1&eventHandler=ev2');
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getReport(
        reportId,
        ewid,
        start,
        ['stat1', 'stat2'],
        ['ev1', 'ev2'],
        end
      );

      expect(getReportSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should handle errors correctly', async () => {
      const mockError = {
        status: 404,
        detail: 'Unable to fetch EdgeWorker ID "558591"',
      };

      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toContain(
          `${ewService.EDGEWORKERS_API_BASE}/reports/${reportId}`
        );
        expect(path).toContain(`?start=${start}&edgeWorker=${ewid}`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.reject(JSON.stringify(mockError));
      });

      const error = await ewService.getReport(reportId, ewid, start, [], []);

      expect(getReportSpy).toHaveBeenCalled();
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.error_reason).toEqual(
        `${ErrorMessage['GET_REPORT_ERROR']} ${mockError.detail}`
      );
    });
  });

  describe('getActivations', () => {
    const mockResponse = { activations: [ {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 30,
      'accountId': 'B-C-BR0JK9',
      'network': 'STAGING',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-22T20:36:34Z'
    },
    {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 31,
      'accountId': 'B-C-BR0JK9',
      'network': 'PRODUCTION',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-22T20:36:54Z'
    }, 
    {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 29,
      'accountId': 'B-C-BR0JK9',
      'network': 'PRODUCTION',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-20T20:36:54Z'
    } ] };

    const mockResponseActive = { activations: [ {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 30,
      'accountId': 'B-C-BR0JK9',
      'network': 'STAGING',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-22T20:36:34Z'
    },
    {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 31,
      'accountId': 'B-C-BR0JK9',
      'network': 'PRODUCTION',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-22T20:36:54Z'
    }] };

    const mockResponseActiveStaging = { activations: [ {
      'edgeWorkerId': 558591,
      'version': 'abc123',
      'activationId': 30,
      'accountId': 'B-C-BR0JK9',
      'network': 'STAGING',
      'createdBy': 'bmatthew',
      'createdTime': '2022-12-22T20:36:34Z'
    }] };

    let getActivationsSpy;
    beforeEach(() => {
      getActivationsSpy = jest.spyOn(ewService, 'getActivations');
    });

    const ewId = '558591';

    it('should return the list of activations', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/activations`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getActivations(ewId);

      expect(getActivationsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    it('should return the active version', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/activations?activeOnNetwork=true`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponseActive,
        });
      });

      const res = await ewService.getActivations(ewId, undefined, undefined, true);

      expect(getActivationsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponseActive);
    });

    it('should return the active version on staging only', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/activations?activeOnNetwork=true&network=STAGING`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponseActiveStaging,
        });
      });

      const res = await ewService.getActivations(ewId, undefined, 'STAGING', true);

      expect(getActivationsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponseActiveStaging);
    });

    it('should handle errors properly', async () => {
      const mockError = {
        status: 404,
        detail: 'Unable to fetch EdgeWorker ID "558591"',
      };
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/activations`);
        expect(timeout).toEqual(defaultTimeout);
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });
      
      const error = await ewService.getActivations(ewId);

      expect(getActivationsSpy).toHaveBeenCalled();
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.error_reason).toEqual(
        `${ErrorMessage['GET_ACTIVATIONS_ERROR']} ${mockError.detail}`
      );
    });
  });
});
