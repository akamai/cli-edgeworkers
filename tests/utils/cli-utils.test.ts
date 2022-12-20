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
});