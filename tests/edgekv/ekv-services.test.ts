import * as httpEdge from '../../src/cli-httpRequest';
import * as ekvService from '../../src/edgekv/ekv-service';
import { ekvMetrics } from '../../src/edgekv/ekv-metricFactory';

describe('ekv-services tests', () => {
  // Test variables
  const initTimeout = 120000;
  const defaultTimeout = 60000;
  const mockNetwork = 'mockNetwork';
  const mockNamespace = 'mockNamespace';
  const mockGroupId = 'mockGroupId';
  const mockAuthGroupId = 123;
  const mockItemId = 'mockItemId';
  const mockSandboxId = 'mockSandboxId';
  const mockError = {
    status: 400,
    detail: 'no permission to access',
    traceId: 123456,
  };
  const mockTokenName = 'mockTokenName';
  const mockPermissionList = ['abc', 'efg', 'hij'];
  const mockEwids = ['123', '456', '789'];
  const mockExpiry = 3600;

  describe('testing getNameSpaceList', () => {
    const mockResBody = ['space1', 'space2', 'space3'];

    test('URL path should not include query parameter when details parameter is false', async () => {
      const details = false;

      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?details');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.listNameSpaces);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const nsListSpy = jest.spyOn(ekvService, 'getNameSpaceList');
      const res = await ekvService.getNameSpaceList(mockNetwork, details);

      expect(nsListSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('URL path should contain query parameter when details parameter is true', async () => {
      const details = true;

      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain('?details');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.listNameSpaces);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const nsListSpy = jest.spyOn(ekvService, 'getNameSpaceList');
      const res = await ekvService.getNameSpaceList(mockNetwork, details);

      expect(nsListSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('function should handle errors properly', async () => {
      const details = true;

      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const nsListSpy = jest.spyOn(ekvService, 'getNameSpaceList');
      const error = await ekvService.getNameSpaceList(mockNetwork, details);

      expect(nsListSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getGroupsList', () => {
    const mockResBody = ['group1', 'group2', 'group3'];

    test('response should return groups list', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.listGroups);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const groupsListSpy = jest.spyOn(ekvService, 'getGroupsList');
      const res = await ekvService.getGroupsList(mockNetwork, mockNamespace);

      expect(groupsListSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const groupsListSpy = jest.spyOn(ekvService, 'getGroupsList');
      const error = await ekvService.getGroupsList(mockNetwork, mockNamespace);

      expect(groupsListSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing createNameSpace', () => {
    const retention = 1000;
    const groupId = 'mockGroup';
    const geoLocation = 'mocklocation';
    const mockReqBody = {
      namespace: mockNamespace,
      retentionInSeconds: retention,
      groupId: groupId,
      geoLocation: geoLocation,
    };
    const mockResBody = { mesaage: 'success' };

    test('response should return created namespace', async () => {
      // Mock postJson() method
      const postJsonSpy = jest.spyOn(httpEdge, 'postJson');
      postJsonSpy.mockImplementation((path, body, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces`
        );
        expect(body).toEqual(mockReqBody);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.createNamespace);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const createNsSpy = jest.spyOn(ekvService, 'createNameSpace');
      const res = await ekvService.createNameSpace(
        mockNetwork,
        mockNamespace,
        retention,
        groupId,
        geoLocation
      );

      expect(createNsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('function should handle errors properly', async () => {
      // Mock postJson() method
      const postJsonSpy = jest.spyOn(httpEdge, 'postJson');
      postJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const createNsSpy = jest.spyOn(ekvService, 'createNameSpace');
      const error = await ekvService.createNameSpace(
        mockNetwork,
        mockNamespace,
        retention,
        groupId,
        geoLocation
      );

      expect(createNsSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getNameSpace', () => {
    const mockResBody = { message: 'success' };

    test('response should return namespace info', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.showNamespace);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const getNsSpy = jest.spyOn(ekvService, 'getNameSpace');
      const res = await ekvService.getNameSpace(mockNetwork, mockNamespace);

      expect(getNsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method

      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const getNsSpy = jest.spyOn(ekvService, 'getNameSpace');
      const error = await ekvService.getNameSpace(mockNetwork, mockNamespace);

      expect(getNsSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing updateNameSpace', () => {
    const retention = 1000;
    const geoLocation = 'mockLocation';
    const groupId = 0;
    const mockReqBody = {
      namespace: mockNamespace,
      retentionInSeconds: retention,
      groupId: groupId,
      geoLocation: geoLocation,
    };
    const mockResBody = { message: 'success' };

    test('response should return changed namespace info', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation((path, body, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}`
        );
        expect(body).toEqual(mockReqBody);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.updateNamespace);

        return Promise.resolve({
          body: mockResBody,
        });
      });

      const updateNsSpy = jest.spyOn(ekvService, 'updateNameSpace');
      const res = await ekvService.updateNameSpace(
        mockNetwork,
        mockNamespace,
        retention,
        groupId,
        geoLocation
      );

      expect(updateNsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResBody);
    });

    test('function should handle errors properly', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const updateNsSpy = jest.spyOn(ekvService, 'updateNameSpace');
      const error = await ekvService.updateNameSpace(
        mockNetwork,
        mockNamespace,
        retention,
        groupId,
        geoLocation
      );

      expect(updateNsSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing initializeEdgeKV', () => {
    const mockReqBody = '';
    const mockResponse = {
      statusCode: 200,
      body: 'success',
    };

    test('response should return initialization success', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation((path, body, timeout, metricType) => {
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/initialize`);
        expect(body).toEqual(mockReqBody);
        expect(timeout).toEqual(initTimeout);
        expect(metricType).toEqual(ekvMetrics.initialize);

        return Promise.resolve({
          response: mockResponse,
        });
      });

      const initializeSpy = jest.spyOn(ekvService, 'initializeEdgeKV');
      const res = await ekvService.initializeEdgeKV();

      expect(initializeSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const initializeSpy = jest.spyOn(ekvService, 'initializeEdgeKV');
      const error = await ekvService.initializeEdgeKV();

      expect(initializeSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getInitializeEdgeKV', () => {
    const mockResponse = {
      statusCode: 200,
      body: 'success',
    };

    test('response should return initialization success', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/initialize`);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.showInitStatus);

        return Promise.resolve({
          response: mockResponse,
        });
      });

      const initializeSpy = jest.spyOn(ekvService, 'getInitializedEdgeKV');
      const res = await ekvService.getInitializedEdgeKV();

      expect(initializeSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const initializeSpy = jest.spyOn(ekvService, 'getInitializedEdgeKV');
      const error = await ekvService.getInitializedEdgeKV();

      expect(initializeSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing wrtieItems', () => {
    const textItem = 'mockItem';
    const jsonItems = {
      item1: 'item1',
      item2: 'item2',
      item3: 'item3',
    };
    const expectedHeaders = {
      'Content-Type': 'text/plain',
    };
    const mockResponse = {
      statusCode: 201,
      body: 'upsert success',
    };

    test('URL path should not contain sandboxId if the query parameter is not provided', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(
        (path, method, body, headers, timeout, metricType) => {
          expect(path).not.toContain('?sandboxId=');
          expect(path).toContain(
            `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
          );
          expect(method).toEqual('PUT');
          expect(body).toEqual(textItem);
          expect(headers).toEqual(expectedHeaders);
          expect(timeout).toEqual(defaultTimeout);
          expect(metricType).toEqual(ekvMetrics.writeItem);

          return Promise.resolve({
            body: mockResponse,
          });
        }
      );

      const writeItemsSpy = jest.spyOn(ekvService, 'writeItems');
      const res = await ekvService.writeItems(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        textItem,
        ''
      );

      expect(writeItemsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain sandboxId if the query parameter is provided', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(
        (path, method, body, headers, timeout, metricType) => {
          expect(path).toContain(`?sandboxId=${mockSandboxId}`);
          expect(path).toContain(
            `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
          );
          expect(method).toEqual('PUT');
          expect(body).toEqual(textItem);
          expect(headers).toEqual(expectedHeaders);
          expect(timeout).toEqual(defaultTimeout);
          expect(metricType).toEqual(ekvMetrics.writeItem);

          return Promise.resolve({
            body: mockResponse,
          });
        }
      );

      const writeItemsSpy = jest.spyOn(ekvService, 'writeItems');
      const res = await ekvService.writeItems(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        textItem,
        mockSandboxId
      );

      expect(writeItemsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('response should return writeItems success when body is a JSON object string', async () => {
      // Mock putJson() method
      const putJson = jest.spyOn(httpEdge, 'putJson');
      putJson.mockImplementation((path, body, timeout, metricType) => {
        expect(path).not.toContain(`?sandboxId=${mockSandboxId}`);
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
        );
        expect(body).toEqual(jsonItems);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.writeItem);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const writeItemsSpy = jest.spyOn(ekvService, 'writeItems');
      const res = await ekvService.writeItems(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        jsonItems,
        ''
      );

      expect(writeItemsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const writeItemsSpy = jest.spyOn(ekvService, 'writeItems');
      const error = await ekvService.writeItems(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        textItem,
        ''
      );

      expect(writeItemsSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing wrtieItemsFromFile', () => {
    const itemFilePath = __dirname + '/items.json';
    const jsonItems = JSON.stringify({
      item1: 'item1',
      item2: 'item2',
      item3: 'item3',
    });
    const expectedHeaders = {
      'Content-Type': 'application/json',
    };
    const mockResponse = {
      statusCode: 201,
      body: 'upsert success',
    };

    test('URL path should not contain sandboxId if the query parameter is not provided', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(
        (path, method, body, headers, timeout, metricType) => {
          expect(path).not.toContain('?sandboxId=');
          expect(path).toContain(
            `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
          );
          expect(method).toEqual('PUT');
          expect(JSON.stringify(JSON.parse(body))).toEqual(jsonItems);
          expect(headers).toEqual(expectedHeaders);
          expect(timeout).toEqual(defaultTimeout);
          expect(metricType).toEqual(ekvMetrics.writeItem);

          return Promise.resolve({
            body: mockResponse,
          });
        }
      );

      const writeItemsFromFileSpy = jest.spyOn(
        ekvService,
        'writeItemsFromFile'
      );
      const res = await ekvService.writeItemsFromFile(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        itemFilePath,
        ''
      );

      expect(writeItemsFromFileSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain sandboxId if the query parameter is provided', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(
        (path, method, body, headers, timeout, metricType) => {
          expect(path).toContain(`?sandboxId=${mockSandboxId}`);
          expect(path).toContain(
            `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
          );
          expect(method).toEqual('PUT');
          expect(JSON.stringify(JSON.parse(body))).toEqual(jsonItems);
          expect(headers).toEqual(expectedHeaders);
          expect(timeout).toEqual(defaultTimeout);
          expect(metricType).toEqual(ekvMetrics.writeItem);

          return Promise.resolve({
            body: mockResponse,
          });
        }
      );

      const writeItemsFromFileSpy = jest.spyOn(
        ekvService,
        'writeItemsFromFile'
      );
      const res = await ekvService.writeItemsFromFile(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        itemFilePath,
        mockSandboxId
      );

      expect(writeItemsFromFileSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock sendEdgeRequest() method
      const sendEdgeRequestSpy = jest.spyOn(httpEdge, 'sendEdgeRequest');
      sendEdgeRequestSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const writeItemsFromFileSpy = jest.spyOn(
        ekvService,
        'writeItemsFromFile'
      );
      const error = await ekvService.writeItemsFromFile(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        itemFilePath,
        ''
      );

      expect(writeItemsFromFileSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing readItem', () => {
    const mockResponse = {
      item1: 'item1',
      item2: 'item2',
      item3: 'item3',
    };

    test('URL path should not contain sandboxId if the query parameter is not provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItem);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const readitemSpy = jest.spyOn(ekvService, 'readItem');
      const res = await ekvService.readItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        ''
      );

      expect(readitemSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain sandboxId if the query parameter is provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItem);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const readItemSpy = jest.spyOn(ekvService, 'readItem');
      const res = await ekvService.readItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        mockSandboxId
      );

      expect(readItemSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const readItemSpy = jest.spyOn(ekvService, 'readItem');
      const error = await ekvService.readItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        ''
      );

      expect(readItemSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing deleteItem', () => {
    const mockResponse = {
      statusCode: 204,
    };

    test('URL path should not contain sandboxId if the query parameter is not provided', async () => {
      // Mock deleteReq() method
      const deleteReqSpy = jest.spyOn(httpEdge, 'deleteReq');
      deleteReqSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.deleteItem);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const deleteItemSpy = jest.spyOn(ekvService, 'deleteItem');
      const res = await ekvService.deleteItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        ''
      );

      expect(deleteItemSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain sandboxId if the query parameter is provided', async () => {
      // Mock deleteReq() method
      const deleteReqSpy = jest.spyOn(httpEdge, 'deleteReq');
      deleteReqSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}/items/${mockItemId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.deleteItem);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const deleteItemSpy = jest.spyOn(ekvService, 'deleteItem');
      const res = await ekvService.deleteItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        mockSandboxId
      );

      expect(deleteItemSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock deleteReq() method
      const deleteReqSpy = jest.spyOn(httpEdge, 'deleteReq');
      deleteReqSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const deleteItemSpy = jest.spyOn(ekvService, 'deleteItem');
      const error = await ekvService.deleteItem(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        mockItemId,
        ''
      );

      expect(deleteItemSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getItemsFromGroup', () => {
    const maxItems = 3;
    const mockResponse = {
      item1: 'item1',
      item2: 'item2',
      item3: 'item3',
    };

    test('URL path should not contain maxItems if the query parameter is not provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?maxItems=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItemsFromGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const res = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        undefined,
        ''
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain maxItems if the query parameter is provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(`?maxItems=${maxItems}`);
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItemsFromGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const res = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        maxItems,
        ''
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should not contain sandboxId if the query parameter is not provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItemsFromGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const res = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        undefined,
        undefined
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain sandboxId if the query parameter is provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain('?sandboxId=');
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItemsFromGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const res = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        undefined,
        mockSandboxId
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should contain maxItems and sandboxId if both query parameters are provided', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `?maxItems=${maxItems}&sandboxId=${mockSandboxId}`
        );
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/networks/${mockNetwork}/namespaces/${mockNamespace}/groups/${mockGroupId}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readItemsFromGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const res = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        maxItems,
        mockSandboxId
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const getItemsFromGroupSpy = jest.spyOn(ekvService, 'getItemsFromGroup');
      const error = await ekvService.getItemsFromGroup(
        mockNetwork,
        mockNamespace,
        mockGroupId,
        undefined,
        ''
      );

      expect(getItemsFromGroupSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing createEdgeKVToken', () => {
    const mockReqBody = {
      name: mockTokenName,
      allowOnStaging: true,
      allowOnProduction: false,
      restrictToEwids: mockEwids,
      expiry: mockExpiry,
      namespacePermissions: mockPermissionList,
    };
    const mockResponse = {
      statusCode: 201,
      message: 'created',
    };

    test('response should return creation success', async () => {
      // Mock postJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'postJson');
      getJsonSpy.mockImplementation((path, body, timeout, metricType) => {
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/tokens`);
        expect(body).toEqual(mockReqBody);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.createToken);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const creationSpy = jest.spyOn(ekvService, 'createEdgeKVToken');
      const res = await ekvService.createEdgeKVToken(
        mockTokenName,
        mockPermissionList,
        true,
        false,
        mockEwids,
        mockExpiry
      );

      expect(creationSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock postJson() method
      const postJsonSpy = jest.spyOn(httpEdge, 'postJson');
      postJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const createEdgeKVTokenSpy = jest.spyOn(ekvService, 'createEdgeKVToken');
      const error = await ekvService.createEdgeKVToken(
        mockTokenName,
        mockPermissionList,
        true,
        false,
        mockEwids,
        mockExpiry
      );

      expect(createEdgeKVTokenSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getSingleToken', () => {
    const mockResponse = {
      statusCode: 200,
      mockToken: 'mocktoken',
    };

    test('response should return single token success', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/tokens/${mockTokenName}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readToken);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getSingleTokenSpy = jest.spyOn(ekvService, 'getSingleToken');
      const res = await ekvService.getSingleToken(mockTokenName);

      expect(getSingleTokenSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const getSingleTokenSpy = jest.spyOn(ekvService, 'getSingleToken');
      const error = await ekvService.getSingleToken(mockTokenName);

      expect(getSingleTokenSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing getTokenList', () => {
    const mockResponse = {
      statusCode: 200,
      mockTokens: ['token1', 'token2', 'token3'],
    };

    test('URL path should not include includeExpired query parameter if passing false', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('?includeExpired');
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/tokens`);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readTokenList);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getTokenListSpy = jest.spyOn(ekvService, 'getTokenList');
      const res = await ekvService.getTokenList(false);

      expect(getTokenListSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should include includeExpired query parameter if passing true', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/tokens?includeExpired=true`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.readTokenList);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const getTokenListSpy = jest.spyOn(ekvService, 'getTokenList');
      const res = await ekvService.getTokenList(true);

      expect(getTokenListSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const getTokenListSpy = jest.spyOn(ekvService, 'getTokenList');
      const error = await ekvService.getTokenList(false);

      expect(getTokenListSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing revokeToken', () => {
    const mockResponse = {
      statusCode: 204,
    };

    test('response should revoke token success', async () => {
      // Mock deleteReq() method
      const deleteReqSpy = jest.spyOn(httpEdge, 'deleteReq');
      deleteReqSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/tokens/${mockTokenName}`
        );
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.deleteToken);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const revokeTokenSpy = jest.spyOn(ekvService, 'revokeToken');
      const res = await ekvService.revokeToken(mockTokenName);

      expect(revokeTokenSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock deleteReq() method
      const deleteReqSpy = jest.spyOn(httpEdge, 'deleteReq');
      deleteReqSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const revokeTokenSpy = jest.spyOn(ekvService, 'revokeToken');
      const error = await ekvService.revokeToken(mockTokenName);

      expect(revokeTokenSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing modifyAuthGroupPermission', () => {
    const mockReqBody = {
      groupId: mockAuthGroupId,
    };
    const mockResponse = {
      statusCode: 200,
      permissions: ['abc', 'def'],
    };

    test('response should modify permissions successfully', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation((path, body, timeout, metricType) => {
        expect(path).toContain(
          `${ekvService.EDGEKV_API_BASE}/auth/namespaces/${mockNamespace}`
        );
        expect(body).toEqual(mockReqBody);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.modifyAuthGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const modifyAuthGroupPermissionSpy = jest.spyOn(
        ekvService,
        'modifyAuthGroupPermission'
      );
      const res = await ekvService.modifyAuthGroupPermission(
        mockNamespace,
        mockAuthGroupId
      );

      expect(modifyAuthGroupPermissionSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock putJson() method
      const putJsonSpy = jest.spyOn(httpEdge, 'putJson');
      putJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const modifyAuthGroupPermissionSpy = jest.spyOn(
        ekvService,
        'modifyAuthGroupPermission'
      );
      const error = await ekvService.modifyAuthGroupPermission(
        mockNamespace,
        mockAuthGroupId
      );

      expect(modifyAuthGroupPermissionSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });

  describe('testing listAuthGroups', () => {
    const mockResponse = {
      statusCode: 200,
      authGroups: ['group1', 'group2', 'group3'],
    };

    test('URL path should not include groupId when passing 0', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).not.toContain('/groups/0');
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/auth/groups`);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.listAuthGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const listAuthGroupsSpy = jest.spyOn(ekvService, 'listAuthGroups');
      const res = await ekvService.listAuthGroups(0);

      expect(listAuthGroupsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('URL path should include include groupId when passing non-zero value', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation((path, timeout, metricType) => {
        expect(path).toContain(`${ekvService.EDGEKV_API_BASE}/auth/groups/2`);
        expect(timeout).toEqual(defaultTimeout);
        expect(metricType).toEqual(ekvMetrics.listAuthGroup);

        return Promise.resolve({
          body: mockResponse,
        });
      });

      const listAuthGroupsSpy = jest.spyOn(ekvService, 'listAuthGroups');
      const res = await ekvService.listAuthGroups(2);

      expect(listAuthGroupsSpy).toHaveBeenCalled();
      expect(res).toEqual(mockResponse);
    });

    test('function should handle errors properly', async () => {
      // Mock getJson() method
      const getJsonSpy = jest.spyOn(httpEdge, 'getJson');
      getJsonSpy.mockImplementation(() => {
        // The normal error object will be returned as a string
        return Promise.reject(JSON.stringify(mockError));
      });

      const listAuthGroupsSpy = jest.spyOn(ekvService, 'listAuthGroups');
      const error = await ekvService.listAuthGroups(mockAuthGroupId);

      expect(listAuthGroupsSpy).toHaveBeenCalled();
      // Check the details of error object
      expect(error).not.toBeUndefined;
      expect(error.isError).toEqual(true);
      expect(error.status).toEqual(mockError.status);
      expect(error.error_reason).toEqual(mockError.detail);
      expect(error.traceId).toEqual(mockError.traceId);
    });
  });
});
