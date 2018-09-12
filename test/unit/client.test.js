import elasticsearch from 'elasticsearch';
import AWS from 'aws-sdk';
import * as metadataService from '../../src/getCredentials';
import awsEsCredentials from '../../src/index';

describe('awsEsCredentials', () => {
    describe('makeClient', () => {
        beforeEach(() => {
            sinon.stub(metadataService, 'getCredentials');
            metadataService.getCredentials.resolves({});
        });

        afterEach(() => {
            metadataService.getCredentials.restore();
        });

        it('queries metadata service is useMetadataService option is true', () => {
            return awsEsCredentials({ useMetadataService: true })         
                .then(() => {
                    expect(metadataService.getCredentials.calledOnce).to.be.true;
                });
        });

        it('useMetadataService default is true', () => {
            return awsEsCredentials()         
                .then(() => {
                    expect(metadataService.getCredentials.calledOnce).to.be.true;
                });
        });

        it('does not query metadata service is useMetadataService option is false', () => {
            return awsEsCredentials({ useMetadataService: false })         
                .then(() => {
                    expect(metadataService.getCredentials.calledOnce).to.be.false;
                });
        });

        it('uses supplied credentials when passed via options', () => {
            const options = { credentials: { hello: 'world' } };
            sinon.stub(elasticsearch, 'Client');
            return awsEsCredentials(options)         
                .then(() => {
                    expect(elasticsearch.Client.calledOnce).to.be.true;
                    expect(elasticsearch.Client.getCall(0).args[0].credentials).to.deep.equal(options.credentials);
                    elasticsearch.Client.restore();
                });
        });

        it('attempts to use environment variables when no credentials are supplied', () => {
            process.env.AWS_ACCESS_KEY_ID = 'hello';
            process.env.AWS_SECRET_ACCESS_KEY = 'world';
            process.env.AWS_SESSION_TOKEN = 'Hi!'

            sinon.stub(AWS, 'Credentials');
            return awsEsCredentials({ useMetadataService: false })         
                .then(() => {
                    expect(AWS.Credentials.calledOnce).to.be.true;
                    expect(AWS.Credentials.getCall(0).args[0]).to.equal(process.env.AWS_ACCESS_KEY_ID);
                    expect(AWS.Credentials.getCall(0).args[1]).to.equal(process.env.AWS_SECRET_ACCESS_KEY);
                    expect(AWS.Credentials.getCall(0).args[2]).to.equal(process.env.AWS_SESSION_TOKEN);
                });
        });

        it('requests credentials every hour when useMetadataService option is true', () => {
            const clock = sinon.useFakeTimers();

            return awsEsCredentials({ useMetadataService: true })         
                .then(() => {
                    clock.tick(3600000);
                    expect(metadataService.getCredentials.callCount).to.equal(2);

                    clock.tick(3600000);
                    expect(metadataService.getCredentials.callCount).to.equal(3);
                });
        });
    });
});
