import * as httpEdge from '../../src/cli-httpRequest';
import * as ewService from '../../src/edgeworkers/ew-service';
import {ErrorMessage} from '../../src/utils/http-error-message';
import * as error from '../../src/edgeworkers/ew-error';
import * as cliUtils from '../../src/utils/cli-utils';

describe('ew service tests', () => {
  // Test variables
  const defaultTimeout = 120000;

  // http spies
  let getJsonSpy;

  beforeEach(() => {
    getJsonSpy = jest.spyOn(httpEdge, 'getJson');
  });

  describe('getLimits', () => {
    const mockResponse = [{limitId: 1}, {limitId: 2}];
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
    const mockResponse = [{reportId: 1}, {reportId: 2}];
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
    const mockResponse = {report: 'someData'};

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
    const mockResponse = {
      activations: [{
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
      }]
    };

    const mockResponseActive = {
      activations: [{
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
      }]
    };

    const mockResponseActiveStaging = {
      activations: [{
        'edgeWorkerId': 558591,
        'version': 'abc123',
        'activationId': 30,
        'accountId': 'B-C-BR0JK9',
        'network': 'STAGING',
        'createdBy': 'bmatthew',
        'createdTime': '2022-12-22T20:36:34Z'
      }]
    };

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

  describe('listRevisions', () => {
    const mockResponse = {
      'revisions': [
        {
          'accountId': 'A-CCT5678',
          'activationId': 1,
          'checksum': 'db3697e7eb03c8fb4822fd763b840e1b915693ab03e02a583fecfcd55d07857d',
          'createdTime': '2023-08-10T15:32:22Z',
          'edgeWorkerId': 42,
          'lastModifiedTime': '2023-08-10T15:41:20Z',
          'network': 'PRODUCTION',
          'revisionActivationStatus': 'COMPLETE',
          'revisionId': '1-2',
          'version': '0.7'
        },
        {
          'accountId': 'A-CCT7890',
          'activationId': 1,
          'checksum': 'a89dfc162fa3d81d36f40805620cb21be6de5d869374e71feda1afff17dae2a7',
          'createdTime': '2023-08-10T15:22:45Z',
          'edgeWorkerId': 42,
          'lastModifiedTime': '2023-08-10T15:27:01Z',
          'network': 'PRODUCTION',
          'revisionActivationStatus': 'COMPLETE',
          'revisionId': '1-1',
          'version': '0.7'
        }
      ]
    };

    let listRevisionsSpy;
    beforeEach(() => {
      listRevisionsSpy = jest.spyOn(ewService, 'listRevisions');
    });

    const ewId = '42';

    it('should return the list of revisions', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/revisions`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.listRevisions(ewId);

      expect(listRevisionsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });
  });

  describe('getRevision', () => {
    const mockResponse = {
      'accountId': 'A-CCT9012',
      'activationId': 1,
      'checksum': 'db3697e7eb03c8fb4822fd763b840e1b915693ab03e02a583fecfcd55d07857d',
      'createdTime': '2023-08-10T15:32:22Z',
      'edgeWorkerId': 42,
      'lastModifiedTime': '2023-08-10T15:41:20Z',
      'network': 'PRODUCTION',
      'revisionActivationStatus': 'COMPLETE',
      'revisionId': '1-2',
      'version': '0.7'
    };

    let getRevisionSpy;
    beforeEach(() => {
      getRevisionSpy = jest.spyOn(ewService, 'getRevision');
    });

    const ewId = '42';
    const revId = '3-1';

    it('should return the revision', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId}`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getRevision(ewId, revId);

      expect(getRevisionSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });
  });

  describe('getRevisionBOM', () => {
    const mockResponse = {
      'dependencies': {
        'redirect-geo-query': {
          'activeVersion': '4.0',
          'dependencies': {
            'common-lib': {
              'activeVersion': '3.1',
              'currentRevisionPinNote': 'Disable dynamic reactivation during moratorium',
              'currentRevisionPinnedTime': '2023-01-01T00:00:00Z',
              'currentlyPinnedRevisionId': '2-2',
              'dependencies': {},
              'edgeWorkerId': 16,
              'version': '3.1'
            }
          },
          'edgeWorkerId': 23,
          'version': '4.0'
        }
      },
      'edgeWorkerId': 42,
      'version': '0.7'
    };

    let getRevisionSpy;
    beforeEach(() => {
      getRevisionSpy = jest.spyOn(ewService, 'getRevisionBOM');
    });

    const ewId = '42';
    const revId = '3-1';

    it('should return the revision', async () => {
      getJsonSpy.mockImplementation(async (path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId}/bom`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponse,
        });
      });

      const res = await ewService.getRevisionBOM(ewId, revId);
      expect(getRevisionSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });
  });

  describe('getLoglevel', () => {
    const ewId = 558591;
    const loggingId = '1';
    const mockResponseAll = [
      {
        'edgeWorkerId': ewId,
        'level': 'DEBUG',
        'schema': 'v2',
        'network': 'PRODUCTION',
        'loggingId': '1',
        'createdTime': '2024-01-31T20:30:00Z',
        'timeout': '2024-01-31T22:37:32Z',
        'lastModifiedBy': 'user2',
        'lastModifiedTime': '2024-01-31T20:30:00Z',
        'status': 'PRESUBMIT'
      },
      {
        'edgeWorkerId': ewId,
        'level': 'DEBUG',
        'schema': 'v2',
        'network': 'STAGING',
        'loggingId': '34',
        'createdTime': '2024-01-31T20:30:00Z',
        'timeout': '2024-01-31T22:37:32Z',
        'lastModifiedBy': 'user2',
        'lastModifiedTime': '2024-01-31T20:30:00Z',
        'status': 'PRESUBMIT'

      }];

    const mockResponseId1 = {
      'edgeWorkerId': ewId,
      'level': 'TRACE',
      'schema': 'v2',
      'network': 'STAGING',
      'loggingId': '1',
      'createdTime': '2024-01-31T20:30:00Z',
      'timeout': '2024-01-31T22:37:32Z',
      'lastModifiedBy': 'user2',
      'lastModifiedTime': '2024-01-31T20:30:00Z',
      'status': 'PRESUBMIT'
    };

    let getLogLevelSpy;
    beforeEach(() => {
      getLogLevelSpy = jest.spyOn(ewService, 'getLogLevel');
    });


    it('should return all logging level overrides for Edgeworker ID 558591', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/loggings`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponseAll,
        });
      });

      const res = await ewService.getLogLevel(ewId);

      expect(getLogLevelSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponseAll);
    });

    it('should return the logging level for Edgeworker ID 558591 for loggingId 1', async () => {
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/loggings`);
        expect(timeout).toEqual(defaultTimeout);
        return Promise.resolve({
          body: mockResponseId1,
        });
      });

      const res = await ewService.getLogLevel(ewId);

      expect(getLogLevelSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponseId1);
    });


    it('should properly handle fetching logging level error', async () => {
      const mockError = {
        status: 404,
        detail: `Unable to fetch logging level for EdgeWorker ID "${ewId}"`,
      };
      getJsonSpy.mockImplementation((path, timeout) => {
        expect(path).toEqual(`${ewService.EDGEWORKERS_API_BASE}/ids/${ewId}/loggings/${loggingId}`);
        expect(timeout).toEqual(defaultTimeout);
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const error = await ewService.getLogLevel(ewId, loggingId);

      expect(getLogLevelSpy).toHaveBeenCalled();
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.error_reason).toEqual(
        `${ErrorMessage['GET_LOG_LEVEL_ERROR']} ${mockError.detail}`
      );
    });
  });

  describe('getAllEdgeWorkerIds', () => {
    const mockGetJson = httpEdge.getJson as jest.Mock;
    let mockHandleError;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(cliUtils, 'getTimeout').mockReturnValue(1000);
      getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      mockHandleError = jest.spyOn(error, 'handleError');
    });

    it('returns body on success', async () => {
      getJsonSpy.mockResolvedValue({ body: [{ id: 1 }] });
      const result = await ewService.getAllEdgeWorkerIds('g1', 'r1', true);
      expect(result).toEqual([{ id: 1 }]);
      expect(getJsonSpy).toHaveBeenCalledWith(
        expect.stringContaining('/edgeworkers/v1/ids?groupId=g1&resourceTierId=r1&isPartner=true'),
        1000
      );
    });

    it('handles error and calls handleError', async () => {
      const err = new Error('fail');
      getJsonSpy.mockRejectedValue(err);
      mockHandleError.mockReturnValue('handled');
      const result = await ewService.getAllEdgeWorkerIds('g1');
      expect(mockHandleError).toHaveBeenCalledWith(err, 'LISTALL_EW');
      expect(result).toBe('handled');
    });

    it('builds query string with only groupId', async () => {
      getJsonSpy.mockResolvedValue({ body: [] });
      await ewService.getAllEdgeWorkerIds('g1');
      expect(getJsonSpy).toHaveBeenCalledWith(
        '/edgeworkers/v1/ids?groupId=g1',
        1000
      );
    });

    it('builds query string with only resourceTierId', async () => {
      getJsonSpy.mockResolvedValue({ body: [] });
      await ewService.getAllEdgeWorkerIds(undefined, 'r1');
      expect(getJsonSpy).toHaveBeenCalledWith(
        '/edgeworkers/v1/ids?resourceTierId=r1',
        1000
      );
    });

    it('builds query string with only isPartner', async () => {
      getJsonSpy.mockResolvedValue({ body: [] });
      await ewService.getAllEdgeWorkerIds(undefined, undefined, true);
      expect(getJsonSpy).toHaveBeenCalledWith(
        '/edgeworkers/v1/ids?isPartner=true',
        1000
      );
    });

    it('builds query string with no params', async () => {
      getJsonSpy.mockResolvedValue({ body: [] });
      await ewService.getAllEdgeWorkerIds();
      expect(getJsonSpy).toHaveBeenCalledWith(
        '/edgeworkers/v1/ids',
        1000
      );
    });
  });
});
