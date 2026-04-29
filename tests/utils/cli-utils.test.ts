import * as cliUtils from '../../src/utils/cli-utils';

describe('cli utils tests', () => {
  describe('isValidEwId', () => {
    it('should return true for valid ewId', () => {
      expect(cliUtils.isValidEwId('123456')).toBe(true);
    });

    it('should return false for invalid ewId', () => {
      expect(cliUtils.isValidEwId('wrongEwId')).toBe(false);
    });

    it('should return false for ewId starting with zero', () => {
      expect(cliUtils.isValidEwId('0123456')).toBe(false);
    });
  });

  describe('askYesNoQuestion', () => {
    let setRawModeMock, resumeMock, pauseMock, setEncodingMock, removeListenerMock, writeMock, exitMock;

    beforeEach(() => {
      if (typeof (process.stdin as any).setRawMode !== 'function') {
        (process.stdin as any).setRawMode = () => process.stdin;
      }
      setRawModeMock = jest.spyOn(process.stdin, 'setRawMode').mockImplementation(() => process.stdin);
      resumeMock = jest.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin);
      pauseMock = jest.spyOn(process.stdin, 'pause').mockImplementation(() => process.stdin);
      setEncodingMock = jest.spyOn(process.stdin, 'setEncoding').mockImplementation(() => process.stdin);
      removeListenerMock = jest.spyOn(process.stdin, 'removeListener').mockImplementation(() => process.stdin);
      writeMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      exitMock = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function emitKey(key: string) {
      (process.stdin as any).emit('data', key);
    }

    it('resolves true for y', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      emitKey('y');
      await expect(promise).resolves.toBe(true);
    });

    it('resolves true for Y', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      emitKey('Y');
      await expect(promise).resolves.toBe(true);
    });

    it('resolves false for n', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      emitKey('n');
      await expect(promise).resolves.toBe(false);
    });

    it('resolves false for N', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      emitKey('p');
      await expect(promise).resolves.toBe(false);
    });

    it('resolves false for N', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      emitKey('N');
      await expect(promise).resolves.toBe(false);
    });

    it('calls process.exit on Ctrl+C', async () => {
      const promise = cliUtils.askYesNoQuestion('Continue?');
      expect(() => emitKey('\u0003')).toThrow('process.exit');
      // No need to await promise, as process.exit is called
    });
  });
});
