import nock from 'nock';
import proxyquire from 'proxyquire';

import profile from "../fixture/metadata-response-one.js";
import credentials from "../fixture/metadata-response-two.json";

const requireStub = sinon.stub();

requireStub.onCall(0).resolves(profile);
requireStub.onCall(1).resolves(JSON.stringify(credentials));

requireStub.onCall(2).resolves(profile);
requireStub.onCall(3).resolves(JSON.stringify(credentials));

const metadataService = proxyquire('../../src/getCredentials', {
    'request-promise': requireStub
});

const HOST = "http://169.254.169.254/latest/meta-data/iam/security-credentials";

const scope = nock(
  HOST
);

scope.get("/").reply(200, profile);

scope.get(`/${profile}`).reply(200, JSON.stringify(credentials));

describe('getCredentials', () => {
    beforeEach(() => {
        requireStub.reset();
    });

    it('it queries for the instance role', async () => {
        await metadataService.getCredentials()
        expect(requireStub.callCount).to.equal(2);
        expect(requireStub.getCall(0).args[0].url).to.equal(`${HOST}/`);
    });

    it('it queries for the instance roles credentials', async () => {
        await metadataService.getCredentials();
        expect(requireStub.callCount).to.equal(2);
        expect(requireStub.getCall(1).args[0].url).to.equal(`${HOST}/${profile}`);

        await metadataService.getCredentials();
        expect(requireStub.callCount).to.equal(4);
        expect(requireStub.getCall(3).args[0].url).to.equal(`${HOST}/${profile}`);
    });
});
