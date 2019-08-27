// Copyright 2014 Akamai Technologies, Inc. All Rights Reserved
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var assert = require('assert'),
    path = require('path'),
    edgerc = require('../../src/edgerc');

describe('edgerc', function() {
  describe('the parsed edgrc file it returns', function() {
    describe('when it is not passed a second argument indicating config section', function() {
      beforeEach(function() {
        this.config = edgerc(path.resolve(__dirname, '../test_edgerc'));
      });

      it('reports the default host', function() {
        assert.equal(this.config.host, 'https://example.luna.akamaiapis.net');
      });

      it('reports the default client_token', function() {
        assert.equal(this.config.client_token, 'clientToken');
      });

      it('reports the default client_secret', function() {
        assert.equal(this.config.client_secret, 'clientSecret');
      });

      it('reports the default access_token', function() {
        assert.equal(this.config.access_token, 'accessToken');
      });
    });

    describe('when it is passed a second argument indicating config section', function() {
      beforeEach(function() {
        this.config = edgerc(path.resolve(__dirname, '../test_edgerc'), 'section');
      });

      it('reports the host associated with the section', function() {
        assert.equal(this.config.host, 'https://sectionexample.luna.akamaiapis.net');
      });

      it('reports the client_token associated with the section', function() {
        assert.equal(this.config.client_token, 'sectionClientToken');
      });

      it('reports the client_secret associated with the section', function() {
        assert.equal(this.config.client_secret, 'sectionClientSecret');
      });

      it('reports the access_token associated with the section', function() {
        assert.equal(this.config.access_token, 'sectionAccessToken');
      });
    });

    describe('when the section contains a host with the "https://" protocal specified', function() {
      beforeEach(function() {
        this.config = edgerc(path.resolve(__dirname, '../test_edgerc'), 'https');
      });

      it('reports a host with a valid URI string', function() {
        assert.equal(this.config.host, 'https://example.luna.akamaiapis.net');
      });
    });

    describe('when the section passed does not exist', function() {
      it('throws the proper error', function() {
        assert.throws(
          function() {
            return edgerc(path.resolve(__dirname, '../test_edgerc'), 'blah');
          },
          /An error occurred parsing the .edgerc file. You probably specified an invalid section name./
        );
      });
    });

    describe('when the section has comments', function() {
      beforeEach(function() {
        this.config = edgerc(path.resolve(__dirname, '../test_edgerc'), 'comment-test');
      });

      it('has six configuration items', function() {
        assert.equal(Object.keys(this.config).length, 6);
      });

      it('parses a value with a semicolon properly', function() {
        assert.equal(this.config.client_secret, "client;secret");
      });

      it('parses a complex value properly', function() {
        assert.equal(this.config.other, 'The "most" \\\'interesting\\\' ; value in the \\";world\\"');
      });
    })
  });
});
