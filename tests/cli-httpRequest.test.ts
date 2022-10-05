import * as envUtils from '../src/utils/env-utils';

import {
  accountKey,
  setAccountKey,
  sendEdgeRequest,
  postJson,
  putJson,
  getJson,
  deleteReq,
  isOkStatus,
} from '../src/cli-httpRequest';

// Test constants
const PATH = '/edgeworkers/v1/mock/test';
const TIMEOUT = 1000;
const BODY = '';
const HEADERS = {};
const GET_METHOD = 'GET';

// Status code constants
const SUCCESS_CODE = 200;
const BAD_REQUEST_ERROR_CODE = 400;
const SERVER_ERROR_CODE = 500;

let edgeGrid;

beforeEach(() => {
  edgeGrid = {
    auth: jest.fn(),
    send: jest.fn(),
  };
  jest.spyOn(envUtils, 'getEdgeGrid')
  .mockImplementation(() => edgeGrid);
});

describe('cli-httpRequest tests', () => {
  beforeEach(() => {
    // Mock auth() and send() functions in EdgeGrid library
    edgeGrid.auth.mockReturnThis();
    edgeGrid.send = jest.fn().mockImplementation((callback) => {
      callback(null, { status: SUCCESS_CODE }, '');
    });
  });

  afterAll(async () => {
    await new Promise((resolve) =>
      setTimeout(() => resolve('Tests finished'), 2000)
    );
  });

  describe('testing setAccountKey', () => {
    test('accountKey should be null by default', () => {
      expect(accountKey).toBeNull();
    });

    test('string should be set successfully', () => {
      const key = 'testKey';
      setAccountKey(key);
      expect(accountKey).toBe('testKey');
    });

    afterAll(() => {
      setAccountKey('');
    });
  });

  describe('testing sendEdgeRequest', () => {
    test('successful response should return 200 series status', async () => {
      const authSpy = edgeGrid.auth;
      const sendSpy = edgeGrid.send;

      const result = await sendEdgeRequest(
        PATH,
        GET_METHOD,
        BODY,
        HEADERS,
        TIMEOUT
      ).catch((err) => {
        console.error(err);
      });

      expect(authSpy).toHaveBeenCalledWith({
        path: PATH,
        method: GET_METHOD,
        body: BODY,
        headers: HEADERS,
      });
      expect(sendSpy).toHaveBeenCalled();
      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });

    test('should call edge.auth with the optional requestConfig', async () => {
      const authSpy = edgeGrid.auth;
      const sendSpy = edgeGrid.send;

      const metricType = 'myMetric';
      const requestConfig = { key1: 'requestValue1', key2: 'requestValue2'};

      const result = await sendEdgeRequest(
        PATH,
        GET_METHOD,
        BODY,
        HEADERS,
        TIMEOUT,
        metricType,
        requestConfig
      ).catch((err) => {
        console.error(err);
      });

      expect(authSpy).toHaveBeenCalledWith({
        path: PATH,
        method: GET_METHOD,
        body: BODY,
        headers: HEADERS,
        ...requestConfig,
      });
      expect(sendSpy).toHaveBeenCalled();
      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });

    test('response should return constructed error object when the error response exists', async () => {
      edgeGrid.send.mockImplementation((callback) => {
        callback(
          {
            response: {
              data: { message: 'mockErrorMessage' },
              status: BAD_REQUEST_ERROR_CODE,
              headers: { 'x-trace-id': 'test123' },
            },
          },
          { status: BAD_REQUEST_ERROR_CODE },
          ''
        );
      });

      await sendEdgeRequest(PATH, GET_METHOD, BODY, HEADERS, TIMEOUT).catch(
        (error) => {
          const err = JSON.parse(error);

          expect(err).not.toBeUndefined();
          expect(err.status).toEqual(BAD_REQUEST_ERROR_CODE);
          expect(err.traceId).toEqual('test123');
          expect(err.message).toEqual('mockErrorMessage');
        }
      );
    });

    test('response should return the original error message when the error response does not exist', async () => {
      const expectedError = {
        other: {
          data: { message: 'mockErrorMessage' },
          status: SERVER_ERROR_CODE,
          headers: { 'x-trace-id': 'test123' },
        },
      };

      edgeGrid.send.mockImplementation((callback) => {
        callback(expectedError, { status: SERVER_ERROR_CODE }, '');
      });

      await sendEdgeRequest(PATH, GET_METHOD, BODY, HEADERS, TIMEOUT).catch(
        (error) => {
          expect(error).not.toBeUndefined();
          expect(error).toEqual(expectedError);
        }
      );
    });

    test('response should return the response status when the error is undefined', async () => {
      edgeGrid.send.mockImplementation((callback) => {
        callback(undefined, { status: SERVER_ERROR_CODE }, '');
      });

      await sendEdgeRequest(PATH, GET_METHOD, BODY, HEADERS, TIMEOUT).catch(
        (error) => {
          expect(error).not.toBeUndefined();
          expect(error.status).toEqual(SERVER_ERROR_CODE);
        }
      );
    });
  });

  describe('testing putJson', () => {
    test('request method is PUT', async () => {
      edgeGrid.auth.mockImplementation((req) => {
        expect(req.method).toEqual('PUT');
        return this;
      });

      const result = await putJson(PATH, '', TIMEOUT);

      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });
  });

  describe('testing getJson', () => {
    test('request method is GET', async () => {
      edgeGrid.auth.mockImplementation((req) => {
        expect(req.method).toEqual('GET');
        return this;
      });

      const result = await getJson(PATH, TIMEOUT);

      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });
  });

  describe('testing postJson', () => {
    test('request method is POST', async () => {
      edgeGrid.auth.mockImplementation((req) => {
        expect(req.method).toEqual('POST');
        return this;
      });

      const result = await postJson(PATH, { mock: 'test' }, TIMEOUT);

      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });
  });

  describe('testing deleteReq', () => {
    test('request method is DELETE', async () => {
      edgeGrid.auth.mockImplementation((req) => {
        expect(req.method).toEqual('DELETE');
        return this;
      });

      const result = await deleteReq(PATH, TIMEOUT);

      expect(result.err).toBeUndefined();
      expect(result.response.status).toEqual(SUCCESS_CODE);
    });
  });

  describe('testing isOkStatus', () => {
    test('200 series status code should return true', () => {
      expect(isOkStatus(SUCCESS_CODE)).toBe(true);
    });

    test('non 200 series status code should return false', () => {
      expect(isOkStatus(BAD_REQUEST_ERROR_CODE)).toBe(false);
    });
  });
});
