import * as ewHandler from '../../src/edgeworkers/ew-handler';
import * as cliUtils from '../../src/utils/cli-utils';
import * as ewJsonOutput from '../../src/edgeworkers/client-manager';

jest.mock('../../src/edgeworkers/ew-service');
jest.mock('../../src/utils/cli-utils', () => ({
  ...jest.requireActual('../../src/utils/cli-utils'),
  logAndExit: jest.fn(),
  spinner: jest.fn(),
  logWithBorder: jest.fn(),
}));
jest.mock('../../src/edgeworkers/client-manager');

describe('ew handler tests', () => {
  describe('showEdgeWorkerIdOverview', () => {
    const mockSpinner = cliUtils.spinner as jest.Mock;
    const mockLogWithBorder = cliUtils.logWithBorder as jest.Mock;
    const mockLogAndExit = cliUtils.logAndExit as jest.Mock;
    const mockIsJSONOutputMode = ewJsonOutput.ewJsonOutput.isJSONOutputMode as jest.Mock;
    const mockWriteJSONOutput = ewJsonOutput.ewJsonOutput.writeJSONOutput as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockIsJSONOutputMode.mockReturnValue(false);
      console.table = jest.fn();
    });

    it('should fetch and display all EdgeWorker IDs', async () => {
      const ids = [
        { edgeWorkerId: 1, name: 'A', groupId: 10, resourceTierId: 100, isPartner: true, accountId: 'acc1' },
        { edgeWorkerId: 2, name: 'B', groupId: 20, resourceTierId: 200, isPartner: false, accountId: 'acc1' }
      ];
      mockSpinner.mockResolvedValue({ edgeWorkerIds: ids });

      await ewHandler.showEdgeWorkerIdOverview(null, 'groupX', 'tierY', false);

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Fetching EdgeWorker Ids...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        expect.stringContaining('EdgeWorker Ids are currently registered')
      );
      expect(console.table).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should fetch and display a single EdgeWorker ID', async () => {
      const id = { edgeWorkerId: 3, name: 'EW1', groupId: 30, resourceTierId: 100, isPartner: true, accountId: 'acc2' };
      mockSpinner.mockResolvedValue(id);

      await ewHandler.showEdgeWorkerIdOverview('3', 'groupY', '200', true);

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Fetching info for EdgeWorker Id 3'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        expect.stringContaining('EdgeWorker Ids are currently registered')
      );
      expect(console.table).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should output JSON if JSON mode is enabled', async () => {
      mockIsJSONOutputMode.mockReturnValue(true);
      const ids = [
        { edgeWorkerId: 4, name: 'EW2', groupId: 40, resourceTierId: 280, isPartner: false, accountId: 'acc3' }
      ];
      mockSpinner.mockResolvedValue({ edgeWorkerIds: ids });

      await ewHandler.showEdgeWorkerIdOverview(null, null, null, false);

      expect(mockWriteJSONOutput).toHaveBeenCalledWith(
        0,
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should handle empty result', async () => {
      mockSpinner.mockResolvedValue({ edgeWorkerIds: [] });

      await ewHandler.showEdgeWorkerIdOverview(null, '50', '100', false);

      expect(mockLogAndExit).toHaveBeenCalledWith(
        0,
        expect.stringContaining('no EdgeWorker Id info')
      );
    });
  });

  describe('getProperties', () => {
    const mockSpinner = cliUtils.spinner as jest.Mock;
    const mockLogWithBorder = cliUtils.logWithBorder as jest.Mock;
    const mockLogAndExit = cliUtils.logAndExit as jest.Mock;
    const mockIsJSONOutputMode = ewJsonOutput.ewJsonOutput.isJSONOutputMode as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockIsJSONOutputMode.mockReturnValue(false);
      console.table = jest.fn();
      console.log = jest.fn();
    });

    it('should display property summary when details is false', async () => {
      const properties = [
        {
          propertyId: 101,
          propertyName: 'prop-101',
          stagingVersion: 7,
          productionVersion: 7,
          latestVersion: 7,
          productionVersionLink: '/papi/v1/properties/101/versions/7/rules',
          stagingVersionLink: '/papi/v1/properties/101/versions/7/rules'
        }
      ];
      mockSpinner.mockResolvedValue({
        properties,
        limitedAccessToProperties: false
      });

      await ewHandler.getProperties('101', true, false);

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Retrieving properties for EdgeWorker Id 101...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        expect.stringContaining('EdgeWorker Id 101')
      );
      expect(mockLogWithBorder).toHaveBeenCalledTimes(1);
      expect(console.table).toHaveBeenCalledTimes(1);
      expect(console.table).toHaveBeenCalledWith(properties);
      expect(console.log).toHaveBeenCalledWith('limitedAccessToProperties: false');
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should display detailed property info when details is true', async () => {
      const properties = [
        {
          propertyId: 55,
          propertyName: 'prop-55',
          stagingVersion: 7,
          productionVersion: 7,
          latestVersion: 7,
          productionVersionLink: '/papi/v1/properties/55/versions/7/rules',
          stagingVersionLink: '/papi/v1/properties/55/versions/7/rules',
          stagingEdgeWorkersBehaviorLocations: [
            { location: 'stage-loc', continueOnError: true },
            { location: 'stage-loc2', continueOnError: false },
          ],
          productionEdgeWorkersBehaviorLocations: [
            { location: 'prod-loc', continueOnError: false }
          ]
        }
      ];
      mockSpinner.mockResolvedValue({
        properties,
        limitedAccessToProperties: true
      });

      await ewHandler.getProperties('55', false, true);

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Retrieving properties for EdgeWorker Id 55...'
      );
      expect(mockLogWithBorder).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('EdgeWorker Id 55')
      );
      expect(mockLogWithBorder).toHaveBeenNthCalledWith(
        2,
        'Staging EdgeWorkers Behavior Locations'
      );
      expect(mockLogWithBorder).toHaveBeenNthCalledWith(
        3,
        'Production EdgeWorkers Behavior Locations'
      );
      expect(console.table).toHaveBeenCalledTimes(3);
      expect(console.table).toHaveBeenNthCalledWith(1, [
        { propertyId: 55, propertyName: 'prop-55', stagingVersion: 7,
          productionVersion: 7,
          latestVersion: 7, }
      ]);
      expect(console.table).toHaveBeenNthCalledWith(2, [
        { propertyId: 55, location: 'stage-loc', continueOnError: true, versionLink: '/papi/v1/properties/55/versions/7/rules' },
        { propertyId: 55, location: 'stage-loc2', continueOnError: false, versionLink: '/papi/v1/properties/55/versions/7/rules' }
      ]);
      expect(console.table).toHaveBeenNthCalledWith(3, [
        { propertyId: 55, location: 'prod-loc', continueOnError: false, versionLink: '/papi/v1/properties/55/versions/7/rules' }
      ]);
      expect(console.log).toHaveBeenCalledWith('limitedAccessToProperties: true');
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });
  });

  describe('getReport', () => {
    const mockSpinner = cliUtils.spinner as jest.Mock;
    const mockLogWithBorder = cliUtils.logWithBorder as jest.Mock;
    const mockLogAndExit = cliUtils.logAndExit as jest.Mock;
    const mockIsJSONOutputMode = ewJsonOutput.ewJsonOutput.isJSONOutputMode as jest.Mock;
    const mockWriteJSONOutput = ewJsonOutput.ewJsonOutput.writeJSONOutput as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockIsJSONOutputMode.mockReturnValue(false);
      console.table = jest.fn();
    });

    it('should display wall time durations for report 1 when wall time data is present', async () => {
      const reportResponse = {
        isError: false,
        reportId: 1,
        name: 'Execution Summary',
        start: '2025-09-19T20:54:57Z',
        end: '2025-12-19T21:41:38Z',
        data: {
          memory: { avg: 18.5, min: 5, max: 120 },
          successes: { total: 50 },
          initDuration: { avg: 5.123, min: 4.5, max: 6.8 },
          execDuration: { avg: 2.456, min: 1.2, max: 5.9 },
          wallTimeInitDuration: { avg: 8.234, min: 7.1, max: 10.5 },
          wallTimeExecDuration: { avg: 3.789, min: 2.3, max: 8.1 },
          errors: { total: 5 },
          invocations: { total: 55 }
        }
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(1, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '9999', [], [], false, [], [], 'STAGING');

      expect(console.table).toHaveBeenCalledTimes(4);
      expect(console.table).toHaveBeenNthCalledWith(1, {
        successes: {total: 50},
        errors: {total: 5},
        invocations: {total: 55}
      });
      expect(console.table).toHaveBeenNthCalledWith(2, {
        initDuration: {avg: '5.1230', min: '4.5000', max: '6.8000'},
        execDuration: {avg: '2.4560', min: '1.2000', max: '5.9000'}
      });
      expect(console.table).toHaveBeenNthCalledWith(3, {
        wallTimeInitDuration: {avg: '8.2340', min: '7.1000', max: '10.5000'},
        wallTimeExecDuration: {avg: '3.7890', min: '2.3000', max: '8.1000'}
      });
      expect(console.table).toHaveBeenNthCalledWith(4, {
        memory: {avg: '18.5000', min: '5.0000', max: '120.0000'}
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should print summary tables for report 1 when continueOnErrorOnly is false', async () => {
      const reportResponse = {
        isError: false,
        reportId: 1,
        name: 'Execution Summary',
        start: '2025-09-19T20:54:57Z',
        end: '2025-12-19T21:41:38Z',
        data: {
          memory: { avg: 24.923076923076923, min: 6, max: 241 },
          successes: { total: 12 },
          initDuration: { avg: 4.874, min: 4.703, max: 4.997 },
          execDuration: { avg: 0.5621538461538461, min: 0.309, max: 1.27 },
          errors: { total: 13},
          invocations: { total: 13 }
        }
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(1, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '1234', [], [], false, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Execution Summary from 2025-09-19T20:54:57Z to 2025-12-19T21:41:38Z'
      );
      expect(console.table).toHaveBeenCalledTimes(4);
      expect(console.table).toHaveBeenNthCalledWith(1, {
        successes: {total: 12},
        errors: {total: 13},
        invocations: {total: 13}
      });
      expect(console.table).toHaveBeenNthCalledWith(2, {
        initDuration: {avg: '4.8740', min: '4.7030', max: '4.9970'},
        execDuration: {avg: '0.5622', min: '0.3090', max: '1.2700'}
      });
      expect(console.table).toHaveBeenNthCalledWith(3, {
        wallTimeInitDuration: {avg: 'N/A', min: 'N/A', max: 'N/A'},
        wallTimeExecDuration: {avg: 'N/A', min: 'N/A', max: 'N/A'}
      });
      expect(console.table).toHaveBeenNthCalledWith(4, {
        memory: {avg: '24.9231', min: '6.0000', max: '241.0000'}
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should include continue on error breakdown for report 1 when continueOnErrorOnly is true', async () => {
      const reportResponse = {
        isError: false,
        reportId: 1,
        name: 'Execution Summary',
        start: '2025-09-19T20:54:57Z',
        end: '2025-12-19T21:41:38Z',
        data: {
          memory: { avg: 24.923076923076923, min: 6, max: 241 },
          successes: { total: 13 },
          initDuration: { avg: 4.874, min: 4.703, max: 4.997 },
          execDuration: { avg: 0.5621538461538461, min: 0.309, max: 1.27 },
          errors: { total: 13, continueOnErrorApplied: 7, continueOnErrorNotApplied: 3 },
          invocations: { total: 13 }
        }
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(1, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '4321', [], [], true, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Execution Summary from 2025-09-19T20:54:57Z to 2025-12-19T21:41:38Z'
      );
      expect(console.table).toHaveBeenCalledTimes(5);
      expect(console.table).toHaveBeenNthCalledWith(1, {
        successes: {total: 13},
        invocations: {total: 13}
      });
      expect(console.table).toHaveBeenNthCalledWith(2, {
        errors: {
          total: 13,
          continueOnErrorApplied: 7,
          continueOnErrorNotApplied: 3
        }
      });
      expect(console.table).toHaveBeenNthCalledWith(3, {
        initDuration: {avg: '4.8740', min: '4.7030', max: '4.9970'},
        execDuration: {avg: '0.5622', min: '0.3090', max: '1.2700'}
      });
      expect(console.table).toHaveBeenNthCalledWith(4, {
        wallTimeInitDuration: {avg: 'N/A', min: 'N/A', max: 'N/A'},
        wallTimeExecDuration: {avg: 'N/A', min: 'N/A', max: 'N/A'}
      });
      expect(console.table).toHaveBeenNthCalledWith(5, {
        memory: {avg: '24.9231', min: '6.0000', max: '241.0000'}
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should aggregate status counts for report 3 when continueOnErrorOnly is false', async () => {
      const reportResponse = {
        isError: false,
        reportId: 3,
        name: 'Execution Status',
        start: '2025-09-19T20:54:57Z',
        end: '2025-12-19T21:41:38Z',
        data: [
          {
            data: {
              onOriginRequest: [
                {
                  startDateTime: '2025-12-09T04:35:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 1,
                  status: 'unimplementedEventHandler'
                }
              ],
              onClientResponse: [
                {
                  startDateTime: '2025-12-09T04:45:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 2,
                  status: 'executionError'
                }
              ],
              onClientRequest: [
                {
                  startDateTime: '2025-12-09T04:30:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 5,
                  status: 'success'
                },
                {
                  startDateTime: '2025-12-09T04:35:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 2,
                  status: 'timeout'
                }
              ]
            }
          }
        ]
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(3, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '5678', [], [], false, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Execution Status from 2025-09-19T20:54:57Z to 2025-12-19T21:41:38Z'
      );
      expect(console.table).toHaveBeenCalledTimes(1);
      expect(console.table).toHaveBeenCalledWith({
        errors: 4,
        success: 5,
        timeout: 2,
        unimplementedEventHandler: 1,
        executionError: 2
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should surface continue on error metrics for report 3 when continueOnErrorOnly is true', async () => {
      const reportResponse = {
        isError: false,
        reportId: 3,
        name: 'Execution Status',
        start: '2025-09-19T20:54:57Z',
        end: '2025-12-19T21:41:38Z',
        data: [
          {
            data: {
              onOriginRequest: [
                {
                  startDateTime: '2025-12-09T04:35:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 1,
                  status: 'unimplementedEventHandler'
                }
              ],
              onClientResponse: [
                {
                  startDateTime: '2025-12-09T04:45:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 2,
                  status: 'executionError',
                  continueOnErrorApplied: 1,
                  continueOnErrorNotApplied: 1
                }
              ],
              onClientRequest: [
                {
                  startDateTime: '2025-12-09T04:30:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 5,
                  status: 'success'
                },
                {
                  startDateTime: '2025-12-09T04:35:00Z',
                  edgeWorkerVersion: '0.2',
                  revisionId: '1-0',
                  invocations: 2,
                  status: 'timeout',
                  continueOnErrorApplied: 1,
                  continueOnErrorNotApplied: 0
                }
              ]
            }
          }
        ]
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(3, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '8765', [], [], true, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Execution Status from 2025-09-19T20:54:57Z to 2025-12-19T21:41:38Z'
      );
      expect(console.table).toHaveBeenCalledTimes(2);
      expect(console.table).toHaveBeenNthCalledWith(1, {
        success: 5,
        timeout: 2,
        unimplementedEventHandler: 1,
        executionError: 2
      });
      expect(console.table).toHaveBeenNthCalledWith(2, {
        errors: {
          invocations: 4,
          continueOnErrorApplied: 2,
          continueOnErrorNotApplied: 1
        }
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should print customer summary and performance tables for report 8', async () => {
      const reportResponse = {
        isError: false,
        reportId: 8,
        name: 'Customers',
        start: '2026-02-25T00:00:00Z',
        end: '2026-02-25T20:00:00Z',
        data: [
          {
            customerName: 'Tiktok.com',
            vcds: [{vcd: 112232}],
            errors: {continueOnErrorApplied: 12, continueOnErrorNotApplied: 5, total: 37},
            execDuration: {avg: 95.432, max: 156, min: 42},
            initDuration: {avg: 24.237, max: 31, min: 14},
            invocations: {total: 158},
            memory: {avg: 53701.9876, max: 132432, min: 22567},
            successes: {total: 121},
            subRequests: {total: 0}
          },
          {
            customerName: 'Microsoft INC',
            vcds: [{vcd: 235433}, {vcd: 123434}],
            errors: {continueOnErrorApplied: 45, continueOnErrorNotApplied: 0, total: 45},
            execDuration: {avg: 32.123, max: 56, min: 21},
            initDuration: {avg: 24.237, max: 31, min: 14},
            invocations: {total: 158},
            memory: {avg: 53701.9876, max: 132432, min: 22567},
            successes: {total: 324},
            subRequests: {total: 12}
          }
        ]
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(8, '2026-02-25T00:00:00Z', '2026-02-25T20:00:00Z', '1234', [], [], false, [], [], 'STAGING');

      expect(console.table).toHaveBeenCalledTimes(2);
      expect(console.table).toHaveBeenNthCalledWith(1, [
        {
          'Customer Name (VCDs)': 'Microsoft INC (235433,123434)',
          'Success Count': '324',
          'Error Count': '45',
          'Error Rate': '28.48 %',
          'COE Applied': '45',
          'COE Not Applied': '0',
          'Sub-request Count': '12'
        },
        {
          'Customer Name (VCDs)': 'Tiktok.com (112232)',
          'Success Count': '121',
          'Error Count': '37',
          'Error Rate': '23.42 %',
          'COE Applied': '12',
          'COE Not Applied': '5',
          'Sub-request Count': '0'
        }
      ]);
      expect(console.table).toHaveBeenNthCalledWith(2, [
        {
          'Customer Name (VCDs)': 'Microsoft INC (235433,123434)',
          'Avg CPU Time': '32.12 ms',
          'Max CPU Time': '56.00 ms',
          'Avg Init Time': '24.24 ms',
          'Max Init Time': '31.00 ms',
          'Avg Mem Usage': '52.44 KB',
          'Max Mem Usage': '129.33 KB'
        },
        {
          'Customer Name (VCDs)': 'Tiktok.com (112232)',
          'Avg CPU Time': '95.43 ms',
          'Max CPU Time': '156.00 ms',
          'Avg Init Time': '24.24 ms',
          'Max Init Time': '31.00 ms',
          'Avg Mem Usage': '52.44 KB',
          'Max Mem Usage': '129.33 KB'
        }
      ]);
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should write report 8 output as JSON when JSON mode is enabled', async () => {
      mockIsJSONOutputMode.mockReturnValue(true);
      const reportResponse = {
        isError: false,
        reportId: 8,
        name: 'Customers',
        start: '2026-02-25T00:00:00Z',
        end: '2026-02-25T20:00:00Z',
        data: [
          {
            customerName: 'IPQA Akamai Alta-WAA',
            vcds: [{vcd: 1234}],
            errors: {continueOnErrorApplied: 0, continueOnErrorNotApplied: 0, total: 0},
            execDuration: {avg: 10, max: 12, min: 8},
            initDuration: {avg: 2, max: 3, min: 1},
            invocations: {total: 5},
            memory: {avg: 2048, max: 4096, min: 1024},
            successes: {total: 5},
            subRequests: {total: 1}
          }
        ]
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(8, '2026-02-25T00:00:00Z', '2026-02-25T20:00:00Z', '1234', [], [], false, [], [], 'STAGING');

      expect(console.table).not.toHaveBeenCalled();
      expect(mockWriteJSONOutput).toHaveBeenCalledWith(
        0,
        'Printing Customers from 2026-02-25T00:00:00Z to 2026-02-25T20:00:00Z',
        [
          [
            {
              'Customer Name (VCDs)': 'IPQA Akamai Alta-WAA (1234)',
              'Success Count': '5',
              'Error Count': '0',
              'Error Rate': '0.00 %',
              'COE Applied': '0',
              'COE Not Applied': '0',
              'Sub-request Count': '1'
            }
          ],
          [
            {
              'Customer Name (VCDs)': 'IPQA Akamai Alta-WAA (1234)',
              'Avg CPU Time': '10.00 ms',
              'Max CPU Time': '12.00 ms',
              'Avg Init Time': '2.00 ms',
              'Max Init Time': '3.00 ms',
              'Avg Mem Usage': '2.00 KB',
              'Max Mem Usage': '4.00 KB'
            }
          ]
        ]
      );
    });
    
    it('should display wall time execution data for report 9', async () => {
      const reportResponse = {
        reportId: 9,
        name: 'Initialization and execution wall times with percentiles by EdgeWorker ID and event handler',
        description: 'This report lists execution and initialization wall times with percentiles, grouped by EdgeWorker ID and event handler.',
        start: '2026-06-01T20:36:08Z',
        end: '2026-06-04T20:36:08Z',
        data: [
          {
            edgeWorkerId: 54321,
            data: {
              init: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.149,
                    min: 0.149,
                    max: 0.149,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.134,
                    min: 0.134,
                    max: 0.134,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                }
              ],
              onOriginRequest: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.10616666666666667,
                    min: 0.069,
                    max: 0.186,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.08483333333333333,
                    min: 0.056,
                    max: 0.199,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onClientResponse: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.13066666666666665,
                    min: 0.106,
                    max: 0.206,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.1185,
                    min: 0.096,
                    max: 0.186,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onOriginResponse: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.1035,
                    min: 0.077,
                    max: 0.171,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.09816666666666667,
                    min: 0.08,
                    max: 0.168,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onClientRequest: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.12483333333333332,
                    min: 0.101,
                    max: 0.162,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.11733333333333333,
                    min: 0.106,
                    max: 0.158,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ]
            },
            summaryStatistics: {
              init: {
                twentyFivePercentile: 1.0,
                fiftyPercentile: 1.0,
                seventyFivePercentile: 1.0,
                ninetyFivePercentile: 1.0,
                ninetyNinePercentile: 1.0
              },
              responseProvider: {
                twentyFivePercentile: 0.0,
                fiftyPercentile: 0.0,
                seventyFivePercentile: 0.0,
                ninetyFivePercentile: 0.0,
                ninetyNinePercentile: 0.0
              },
              onOriginRequest: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onBotSegmentAvailable: {
                twentyFivePercentile: 0.0,
                fiftyPercentile: 0.0,
                seventyFivePercentile: 0.0,
                ninetyFivePercentile: 0.0,
                ninetyNinePercentile: 0.0
              },
              onClientResponse: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              totalWallTime: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onOriginResponse: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onClientRequest: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              }
            }
          }
        ],
        summaryStatistics: {
          init: {
            twentyFivePercentile: 1.0,
            fiftyPercentile: 1.0,
            seventyFivePercentile: 1.0,
            ninetyFivePercentile: 1.0,
            ninetyNinePercentile: 1.0
          },
          responseProvider: {
            twentyFivePercentile: 0.0,
            fiftyPercentile: 0.0,
            seventyFivePercentile: 0.0,
            ninetyFivePercentile: 0.0,
            ninetyNinePercentile: 0.0
          },
          onOriginRequest: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onBotSegmentAvailable: {
            twentyFivePercentile: 0.0,
            fiftyPercentile: 0.0,
            seventyFivePercentile: 0.0,
            ninetyFivePercentile: 0.0,
            ninetyNinePercentile: 0.0
          },
          onClientResponse: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          totalWallTime: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onOriginResponse: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onClientRequest: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          }
        }
      };
      mockSpinner.mockResolvedValue(reportResponse);

        await ewHandler.getReport(9, '2026-03-05T20:36:08Z', '2026-06-04T20:36:08Z', '54321', [], ['onOriginRequest', 'onClientResponse', 'onClientRequest'], false, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Initialization and execution wall times with percentiles by EdgeWorker ID and event handler from 2026-06-01T20:36:08Z to 2026-06-04T20:36:08Z'
      );
      expect(console.table).toHaveBeenCalledTimes(1);
      expect(console.table).toHaveBeenCalledWith({
        onOriginRequest: { avg: '0.0955', min: '0.06', max: '0.20' },
        onClientResponse: { avg: '0.1246', min: '0.10', max: '0.21' },
        onClientRequest: { avg: '0.1211', min: '0.10', max: '0.16' },
        init: { avg: '0.1415', min: '0.13', max: '0.15' }
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should handle multiple EdgeWorker data entries for report 9', async () => {
      const reportResponse = {
        reportId: 9,
        name: 'Initialization and execution wall times with percentiles by EdgeWorker ID and event handler',
        description: 'This report lists execution and initialization wall times with percentiles, grouped by EdgeWorker ID and event handler.',
        start: '2026-06-01T20:36:08Z',
        end: '2026-06-04T20:36:08Z',
        data: [
          {
            edgeWorkerId: 89456,
            data: {
              init: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.149,
                    min: 0.149,
                    max: 0.149,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.134,
                    min: 0.134,
                    max: 0.134,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                }
              ],
              onOriginRequest: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.10616666666666667,
                    min: 0.069,
                    max: 0.186,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.08483333333333333,
                    min: 0.056,
                    max: 0.199,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onClientResponse: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.13066666666666665,
                    min: 0.106,
                    max: 0.206,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.1185,
                    min: 0.096,
                    max: 0.186,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onOriginResponse: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.1035,
                    min: 0.077,
                    max: 0.171,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.09816666666666667,
                    min: 0.08,
                    max: 0.168,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onClientRequest: [
                {
                  startDateTime: '2026-06-02T17:15:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.12483333333333332,
                    min: 0.101,
                    max: 0.162,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-06-03T17:25:00Z',
                  edgeWorkerVersion: 'pm-modify-v1.19',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.11733333333333333,
                    min: 0.106,
                    max: 0.158,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ]
            },
            summaryStatistics: {
              init: {
                twentyFivePercentile: 1.0,
                fiftyPercentile: 1.0,
                seventyFivePercentile: 1.0,
                ninetyFivePercentile: 1.0,
                ninetyNinePercentile: 1.0
              },
              responseProvider: {
                twentyFivePercentile: 0.0,
                fiftyPercentile: 0.0,
                seventyFivePercentile: 0.0,
                ninetyFivePercentile: 0.0,
                ninetyNinePercentile: 0.0
              },
              onOriginRequest: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onBotSegmentAvailable: {
                twentyFivePercentile: 0.0,
                fiftyPercentile: 0.0,
                seventyFivePercentile: 0.0,
                ninetyFivePercentile: 0.0,
                ninetyNinePercentile: 0.0
              },
              onClientResponse: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              totalWallTime: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onOriginResponse: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              },
              onClientRequest: {
                twentyFivePercentile: 0.05,
                fiftyPercentile: 0.05,
                seventyFivePercentile: 0.05,
                ninetyFivePercentile: 0.05,
                ninetyNinePercentile: 0.05
              }
            }
          }
        ],
        summaryStatistics: {
          init: {
            twentyFivePercentile: 1.0,
            fiftyPercentile: 1.0,
            seventyFivePercentile: 1.0,
            ninetyFivePercentile: 1.0,
            ninetyNinePercentile: 1.0
          },
          responseProvider: {
            twentyFivePercentile: 0.0,
            fiftyPercentile: 0.0,
            seventyFivePercentile: 0.0,
            ninetyFivePercentile: 0.0,
            ninetyNinePercentile: 0.0
          },
          onOriginRequest: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onBotSegmentAvailable: {
            twentyFivePercentile: 0.0,
            fiftyPercentile: 0.0,
            seventyFivePercentile: 0.0,
            ninetyFivePercentile: 0.0,
            ninetyNinePercentile: 0.0
          },
          onClientResponse: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          totalWallTime: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onOriginResponse: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          },
          onClientRequest: {
            twentyFivePercentile: 0.05,
            fiftyPercentile: 0.05,
            seventyFivePercentile: 0.05,
            ninetyFivePercentile: 0.05,
            ninetyNinePercentile: 0.05
          }
        }
      };
      mockSpinner.mockResolvedValue(reportResponse);

        await ewHandler.getReport(9, '2026-06-01T20:36:08Z', '2026-06-04T20:36:08Z', '89456', [], ['onOriginRequest', 'onClientResponse', 'onClientRequest'], false, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith(
        'Printing Initialization and execution wall times with percentiles by EdgeWorker ID and event handler from 2026-06-01T20:36:08Z to 2026-06-04T20:36:08Z'
      );
      expect(console.table).toHaveBeenCalledTimes(1);
      expect(console.table).toHaveBeenCalledWith({
        onOriginRequest: { avg: '0.0955', min: '0.06', max: '0.20' },
        onClientResponse: { avg: '0.1246', min: '0.10', max: '0.21' },
        onClientRequest: { avg: '0.1211', min: '0.10', max: '0.16' },
        init: { avg: '0.1415', min: '0.13', max: '0.15' }
      });
      expect(mockLogAndExit).not.toHaveBeenCalled();
    });

    it('should exit with info message when report is unavailable', async () => {
      const reportResponse = {
        unavailable: true
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(4, '2025-09-19T20:54:57Z', '2025-12-19T21:41:38Z', '1234', [], [], false, [], [], 'STAGING');

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting report...'
      );
      expect(mockLogAndExit).toHaveBeenCalledWith(
        0,
        'INFO: This report is currently unavailable.'
      );
      expect(mockLogWithBorder).not.toHaveBeenCalled();
      expect(console.table).not.toHaveBeenCalled();
    });

    it('should write report 9 output as JSON when JSON mode is enabled', async () => {
      mockIsJSONOutputMode.mockReturnValue(true);
      const reportResponse = {
        reportId: 9,
        name: 'Initialization and execution wall times with percentiles by EdgeWorker ID and event handler',
        description: 'This report lists execution and initialization wall times with percentiles, grouped by EdgeWorker ID and event handler.',
        start: '2026-05-20T07:30:00Z',
        end: '2026-05-20T10:40:00Z',
        data: [
          {
            edgeWorkerId: 67113,
            data: {
              init: [
                {
                  startDateTime: '2026-05-20T07:30:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.218,
                    min: 0.218,
                    max: 0.218,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                },
                {
                  startDateTime: '2026-05-20T10:40:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 1,
                  wallTimeInitDuration: {
                    avg: 0.138,
                    min: 0.138,
                    max: 0.138,
                    twentyFivePercentile: 1.0,
                    fiftyPercentile: 1.0,
                    seventyFivePercentile: 1.0,
                    ninetyFivePercentile: 1.0,
                    ninetyNinePercentile: 1.0
                  }
                }
              ],
              onOriginRequest: [
                {
                  startDateTime: '2026-05-20T07:30:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.097,
                    min: 0.069,
                    max: 0.167,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-05-20T10:40:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.09933333333333333,
                    min: 0.058,
                    max: 0.221,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
              ],
              onClientResponse: [
                {
                  startDateTime: '2026-05-20T07:30:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.16566666666666666,
                    min: 0.12,
                    max: 0.234,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                },
                {
                  startDateTime: '2026-05-20T10:40:00Z',
                  edgeWorkerVersion: 'cache-control-v2.5',
                  invocations: 6,
                  wallTimeExecDuration: {
                    avg: 0.14283333333333334,
                    min: 0.097,
                    max: 0.254,
                    twentyFivePercentile: 0.05,
                    fiftyPercentile: 0.05,
                    seventyFivePercentile: 0.05,
                    ninetyFivePercentile: 0.05,
                    ninetyNinePercentile: 0.05
                  }
                }
               ],
               onClientRequest: [
                 {
                   startDateTime: '2026-05-20T07:30:00Z',
                   edgeWorkerVersion: 'cache-control-v2.5',
                   invocations: 6,
                   wallTimeExecDuration: {
                     avg: 0.3601666666666667,
                     min: 0.149,
                     max: 1.225,
                     twentyFivePercentile: 0.05,
                     fiftyPercentile: 0.05,
                     seventyFivePercentile: 0.05,
                     ninetyFivePercentile: 0.09,
                     ninetyNinePercentile: 0.1
                   }
                 },
                 {
                   startDateTime: '2026-05-20T10:40:00Z',
                   edgeWorkerVersion: 'cache-control-v2.5',
                   invocations: 6,
                   wallTimeExecDuration: {
                     avg: 0.12433333333333332,
                     min: 0.101,
                     max: 0.192,
                     twentyFivePercentile: 0.05,
                     fiftyPercentile: 0.05,
                     seventyFivePercentile: 0.05,
                     ninetyFivePercentile: 0.05,
                     ninetyNinePercentile: 0.05
                   }
                 }
               ],
               onOriginResponse: [
                 {
                   startDateTime: '2026-05-20T07:30:00Z',
                   edgeWorkerVersion: 'cache-control-v2.5',
                   invocations: 6,
                   wallTimeExecDuration: {
                     avg: 0.1035,
                     min: 0.077,
                     max: 0.171,
                     twentyFivePercentile: 0.05,
                     fiftyPercentile: 0.05,
                     seventyFivePercentile: 0.05,
                     ninetyFivePercentile: 0.05,
                     ninetyNinePercentile: 0.05
                   }
                 },
                 {
                   startDateTime: '2026-05-20T10:40:00Z',
                   edgeWorkerVersion: 'cache-control-v2.5',
                   invocations: 6,
                   wallTimeExecDuration: {
                     avg: 0.09816666666666667,
                     min: 0.08,
                     max: 0.168,
                     twentyFivePercentile: 0.05,
                     fiftyPercentile: 0.05,
                     seventyFivePercentile: 0.05,
                     ninetyFivePercentile: 0.05,
                     ninetyNinePercentile: 0.05
                   }
                 }
               ]
             },
             summaryStatistics: {
               init: {
                 twentyFivePercentile: 1.0,
                 fiftyPercentile: 1.0,
                 seventyFivePercentile: 1.0,
                 ninetyFivePercentile: 1.0,
                 ninetyNinePercentile: 1.0
               },
               responseProvider: {
                 twentyFivePercentile: 0.0,
                 fiftyPercentile: 0.0,
                 seventyFivePercentile: 0.0,
                 ninetyFivePercentile: 0.0,
                 ninetyNinePercentile: 0.0
               },
               onOriginRequest: {
                 twentyFivePercentile: 0.05,
                 fiftyPercentile: 0.05,
                 seventyFivePercentile: 0.05,
                 ninetyFivePercentile: 0.05,
                 ninetyNinePercentile: 0.05
               },
               onBotSegmentAvailable: {
                 twentyFivePercentile: 0.0,
                 fiftyPercentile: 0.0,
                 seventyFivePercentile: 0.0,
                 ninetyFivePercentile: 0.0,
                 ninetyNinePercentile: 0.0
               },
               onClientResponse: {
                 twentyFivePercentile: 0.05,
                 fiftyPercentile: 0.05,
                 seventyFivePercentile: 0.05,
                 ninetyFivePercentile: 0.05,
                 ninetyNinePercentile: 0.05
               },
               totalWallTime: {
                 twentyFivePercentile: 0.05,
                 fiftyPercentile: 0.05,
                 seventyFivePercentile: 0.05,
                 ninetyFivePercentile: 0.05,
                 ninetyNinePercentile: 0.05
               },
               onOriginResponse: {
                 twentyFivePercentile: 0.05,
                 fiftyPercentile: 0.05,
                 seventyFivePercentile: 0.05,
                 ninetyFivePercentile: 0.05,
                 ninetyNinePercentile: 0.05
               },
               onClientRequest: {
                 twentyFivePercentile: 0.05,
                 fiftyPercentile: 0.05,
                 seventyFivePercentile: 0.05,
                 ninetyFivePercentile: 0.05,
                 ninetyNinePercentile: 0.05
               }
             }
           }
         ],
         summaryStatistics: {
           init: {
             twentyFivePercentile: 1.0,
             fiftyPercentile: 1.0,
             seventyFivePercentile: 1.0,
             ninetyFivePercentile: 1.0,
             ninetyNinePercentile: 1.0
           },
           responseProvider: {
             twentyFivePercentile: 0.0,
             fiftyPercentile: 0.0,
             seventyFivePercentile: 0.0,
             ninetyFivePercentile: 0.0,
             ninetyNinePercentile: 0.0
           },
           onOriginRequest: {
             twentyFivePercentile: 0.05,
             fiftyPercentile: 0.05,
             seventyFivePercentile: 0.05,
             ninetyFivePercentile: 0.05,
             ninetyNinePercentile: 0.05
           },
           onBotSegmentAvailable: {
             twentyFivePercentile: 0.0,
             fiftyPercentile: 0.0,
             seventyFivePercentile: 0.0,
             ninetyFivePercentile: 0.0,
             ninetyNinePercentile: 0.0
           },
           onClientResponse: {
             twentyFivePercentile: 0.05,
             fiftyPercentile: 0.05,
             seventyFivePercentile: 0.05,
             ninetyFivePercentile: 0.05,
             ninetyNinePercentile: 0.05
           },
           totalWallTime: {
             twentyFivePercentile: 0.05,
             fiftyPercentile: 0.05,
             seventyFivePercentile: 0.05,
             ninetyFivePercentile: 0.05,
             ninetyNinePercentile: 0.05
           },
           onOriginResponse: {
             twentyFivePercentile: 0.05,
             fiftyPercentile: 0.05,
             seventyFivePercentile: 0.05,
             ninetyFivePercentile: 0.05,
             ninetyNinePercentile: 0.05
           },
           onClientRequest: {
             twentyFivePercentile: 0.05,
             fiftyPercentile: 0.05,
             seventyFivePercentile: 0.05,
             ninetyFivePercentile: 0.05,
             ninetyNinePercentile: 0.05
           }
         }
      };
      mockSpinner.mockResolvedValue(reportResponse);

      await ewHandler.getReport(9, '2026-05-20T07:30:00Z', '2026-05-20T10:40:00Z', '67113', [], ['onOriginRequest', 'onClientRequest', 'onClientResponse'], false, [], [], 'STAGING');

      expect(console.table).not.toHaveBeenCalled();
      expect(mockWriteJSONOutput).toHaveBeenCalledWith(
        0,
        'Printing Initialization and execution wall times with percentiles by EdgeWorker ID and event handler from 2026-05-20T07:30:00Z to 2026-05-20T10:40:00Z',
        {
          onOriginRequest: { avg: '0.0982', min: '0.06', max: '0.22' },
          onClientRequest: { avg: '0.2422', min: '0.10', max: '1.23' },
          onClientResponse: { avg: '0.1542', min: '0.10', max: '0.25' },
          init: { avg: '0.1780', min: '0.14', max: '0.22' }
        }
      );
    });
  });

  // THIS TEST WAS GENERATED BY AN AI LANGUAGE MODEL (GitHub Copilot)
  describe('getActiveCustomersForEwId', () => {
    const mockSpinner = cliUtils.spinner as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      console.table = jest.fn();
      console.log = jest.fn();
    });

    it('should handle invalid ewId input gracefully', async () => {
      // THIS TEST WAS GENERATED BY AN AI LANGUAGE MODEL (GitHub Copilot)
      mockSpinner.mockRejectedValue(new Error('Invalid ewId'));
      await expect(ewHandler.getActiveCustomersForEwId(undefined)).rejects.toThrow('Invalid ewId');
    });

    it('should handle API error response', async () => {
      // THIS TEST WAS GENERATED BY AN AI LANGUAGE MODEL (GitHub Copilot)
      mockSpinner.mockRejectedValue(new Error('API error'));
      await expect(ewHandler.getActiveCustomersForEwId('bad-id')).rejects.toThrow('API error');
    });
  });

  describe('getAvailableReports', () => {
    const mockSpinner = cliUtils.spinner as jest.Mock;
    const mockLogWithBorder = cliUtils.logWithBorder as jest.Mock;
    const mockLogAndExit = cliUtils.logAndExit as jest.Mock;
    const mockIsJSONOutputMode = ewJsonOutput.ewJsonOutput.isJSONOutputMode as jest.Mock;
    const mockWriteJSONOutput = ewJsonOutput.ewJsonOutput.writeJSONOutput as jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockIsJSONOutputMode.mockReturnValue(false);
      console.table = jest.fn();
    });

    it('should filter out unavailable reports', async () => {
      const mockReports = {
        reports: [
          {reportId: 1, name: 'Report 1'},
          {reportId: 2, name: 'Report 2'},
          {reportId: 4, name: 'Memory usage by EdgeWorker ID and event handler', description: 'Report ID 4 is deprecated. Use report ID 6 for memory usage.', unavailable: true},
          {reportId: 6, name: 'Memory usage report'}
        ]
      };
      mockSpinner.mockResolvedValue(mockReports);

      await ewHandler.getAvailableReports();

      expect(mockSpinner).toHaveBeenCalledWith(
        undefined,
        'Getting list of available reports...'
      );
      expect(mockLogWithBorder).toHaveBeenCalledWith('The following reports are available:');
      expect(console.table).toHaveBeenCalledWith([
        {ReportId: 1, ReportType: 'Report 1'},
        {ReportId: 2, ReportType: 'Report 2'},
        {ReportId: 6, ReportType: 'Memory usage report'}
      ]);
    });

    it('should display all reports when none are unavailable', async () => {
      const mockReports = {
        reports: [
          {reportId: 1, name: 'Report 1'},
          {reportId: 2, name: 'Report 2'}
        ]
      };
      mockSpinner.mockResolvedValue(mockReports);

      await ewHandler.getAvailableReports();

      expect(console.table).toHaveBeenCalledWith([
        {ReportId: 1, ReportType: 'Report 1'},
        {ReportId: 2, ReportType: 'Report 2'}
      ]);
    });

    it('should output filtered reports in JSON mode', async () => {
      mockIsJSONOutputMode.mockReturnValue(true);
      const mockReports = {
        reports: [
          {reportId: 1, name: 'Report 1'},
          {reportId: 4, name: 'Deprecated report', unavailable: true},
          {reportId: 6, name: 'Report 6'}
        ]
      };
      mockSpinner.mockResolvedValue(mockReports);

      await ewHandler.getAvailableReports();

      expect(mockWriteJSONOutput).toHaveBeenCalledWith(
        0,
        'The following reports are available:',
        [
          {ReportId: 1, ReportType: 'Report 1'},
          {ReportId: 6, ReportType: 'Report 6'}
        ]
      );
    });

    it('should handle errors properly', async () => {
      const mockError = {
        isError: true,
        error_reason: 'Unable to fetch reports'
      };
      mockSpinner.mockResolvedValue(mockError);

      await ewHandler.getAvailableReports();

      expect(mockLogAndExit).toHaveBeenCalledWith(1, 'Unable to fetch reports');
    });
  });
});
