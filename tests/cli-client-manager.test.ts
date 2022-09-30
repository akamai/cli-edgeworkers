import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { buildTarball, validateTarballLocally } from '../src/edgeworkers/client-manager';

const TAR_TEMP_DIR = __dirname + '/tmp_tar/';
const TAR_1234_CHECKSUM = '21246f0ed8d1ccf8577ecf5bb575cfb8401cfd6d5cc265fb00eaddfc61ac3dfe';

describe('client-manager tests', () => {

    beforeAll(() => {
        if (!existsSync(TAR_TEMP_DIR)) {
            mkdirSync(TAR_TEMP_DIR);
        }
    });

    afterAll(() => {
        if (existsSync(TAR_TEMP_DIR)) {
            rmdirSync(TAR_TEMP_DIR, { recursive: true });
        }
    });

    describe('test creating a tarball with --codeDir', () => {
        test('test absolute path', () => {
            const tarball = buildTarball('1234', __dirname + '/testbundles/1234/', TAR_TEMP_DIR);
            expect(existsSync(tarball.tarballPath)).toBe(true);
            expect(tarball.tarballChecksum).toBe(TAR_1234_CHECKSUM);
            validateTarballLocally(tarball.tarballPath);
        });

        test('test relative path', () => {
            //assuming this is run from the workspace directory, this will resolve correctly
            const tarball = buildTarball('1234', './tests/testbundles/1234/', TAR_TEMP_DIR);
            expect(existsSync(tarball.tarballPath)).toBe(true);
            expect(tarball.tarballChecksum).toBe(TAR_1234_CHECKSUM);
            validateTarballLocally(tarball.tarballPath);
        });
    });

});