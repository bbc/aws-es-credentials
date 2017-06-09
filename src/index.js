import "babel-polyfill";
import AWS from "aws-sdk";
import httpAWSES from "http-aws-es";
import elasticsearch from "elasticsearch";
import { getCredentials } from "./getCredentials";

const clientProxyFunctions = {};
const REFRESH_INTERVAL = 3600000;
let REVALIDATE_OPTIONS = {}; // these options are used when we recreate the client after the credentials expire
let client = null;
let intervalId = null;

const setOptions = options => {
  REVALIDATE_OPTIONS = options;
};

const getOptions = () => REVALIDATE_OPTIONS;

const awsEsCredentials = async (options = {}) => {
  const region = options.region || process.env.AWS_REGION || "eu-west-1";
  const credentials = await resolveCredentials(options);

  const defaultOptions = {
    hosts: options.hosts,
    connectionClass: httpAWSES,
    amazonES: {
      region: region,
      credentials: credentials
    }
  };

  const optionsToUse = {
    ...defaultOptions,
    ...options
  };

  setOptions(optionsToUse);
  client = elasticsearch.Client(optionsToUse);
  mapProxy(client);

  if (optionsToUse.useMetadataService === true) {
    startCredentialRefreshInterval(intervalId);
  }

  return clientProxyFunctions;
  //return client;
};

/**
 * Attempts to set the credentials using the three different options
 * Unless explicilty set to false the metadata service is used.
 * If set to false check for supplied credentials.
 * If no credentials are found try to use environment variables.
 * @param {Object} options 
 */

const resolveCredentials = async options => {
  if (options.useMetadataService !== false) {
    const credentialsJSON = await getCredentials();
    return new AWS.Credentials(
      credentialsJSON.AccessKeyId,
      credentialsJSON.SecretAccessKey,
      credentialsJSON.Token
    );
  }

  if (options.credentials) {
    return options.credentials;
  }

  return new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
    process.env.AWS_SESSION_TOKEN
  );
};

const clientProxyCaller = (parameters, functionName) => {
  return client[functionName].apply(client, parameters);
};

/**
 * Proxy the actual clients functions and add to the clientProxyFunctions array
 * @param {Object} client 
 */

const mapProxy = client => {
  for (let fn in client) {
    const partialApplication = (fn => (...parameters) =>
      clientProxyCaller(parameters, fn))(fn);
    clientProxyFunctions[fn] = partialApplication;
  }
};

/**
 * Started the refresh interval on first intialisation.
 * Sets the supplied ID after intialisation, in order to not start multiple intervals.
 * @param {Integer} intervalId 
 */

const startCredentialRefreshInterval = intervalId => {
  if (intervalId === null) {
    intervalId = setInterval(async () => {
      client = await awsEsCredentials(getOptions());
      //client.search({});
    }, REFRESH_INTERVAL);
  }
};

export { awsEsCredentials as default };
