import 'babel-polyfill';
import Bluebird from 'bluebird';
import sinon from 'sinon';
import chai, {should, expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonAsPromised from 'sinon-as-promised';
import sinonChai from 'sinon-chai';

process.env.NODE_ENV = 'test';

sinonAsPromised(Bluebird);

chai.use(sinonChai);
chai.use(chaiAsPromised);

global.Promise = Bluebird;
global.sinon = sinon;
global.chai = chai;
global.should = should();
global.expect = expect;