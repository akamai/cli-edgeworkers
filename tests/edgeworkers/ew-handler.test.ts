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
});
