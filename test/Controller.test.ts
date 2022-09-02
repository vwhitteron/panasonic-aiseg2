import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');

import { AiSEG2Controller } from '../src/controller';
import Server = require('./fixtures/server');


chai.use(chaiAsPromised);
const expect = chai.expect;


describe('AiSEG2Controller', () => {

  describe('#constructor()', () => {
    it('should instantiate class object with requested host', () => {
      const ctlr = new AiSEG2Controller({host: '127.0.0.1', port: 80, password: 'secret'});
      expect(ctlr).to.exist;
      expect(ctlr.config.host).to.equal('127.0.0.1');
      expect(ctlr.config.port).to.equal(80);
    });

    // it('discovered host should be 127.0.0.01', () => {
    //   const ctlr = new AiSEG2Controller({password: 'secret'});
    //   expect(ctlr.host).to.equal('127.0.0.1');
    // });
  });

  describe('#getProperties', () => {
    before(() => {
      Server.listen(8190);
    });

    after(() => {
      setTimeout(() => {
        Server.close();
      }, 1000);
    });

    it('should have expected controller version data', () => {
      const ctlr = new AiSEG2Controller({host: '127.0.0.1', port: 8190, password: 'secret'});
      ctlr.getProperties()
        .then( properties => {
          return Promise.all([
            expect(properties).to.eventually.be.fulfilled,
            expect(properties).to.eventually.have.property('name', 'AiSEG2(A)'),
            expect(properties).to.eventually.have.property('firmwareMain', 'Ver.1.23A-00'),
            expect(properties).to.eventually.have.property('firmwareOutput', 'Ver.1.45B-01'),
            expect(properties).to.eventually.have.property('supportCode', '1234-5678-9012-3456-0770-0880-9009-0000-0000-0000-00'),
            expect(properties).to.eventually.have.property('macAddress', '00-50-40-ab-12-c3'),
          ]);
        });
    });
  });

});