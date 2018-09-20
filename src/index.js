import "babel-polyfill";
import AWS from "aws-sdk";
import httpAWSES from "http-aws-es";
import elasticsearch from "elasticsearch";
import { getCredentials } from "./getCredentials";

const REFRESH_INTERVAL = 3600000;
let clientProxyFunctions = {};
let REVALIDATE_OPTIONS = {}; // these options are used when we recreate the client after the credentials expire
let client = null;
let intervalId = null;

const setOptions = options => {
  /* https://github.com/elasticsearch/elasticsearch-js/issues/33 */
  REVALIDATE_OPTIONS = JSON.parse(JSON.stringify(options));
};

const getOptions = () => REVALIDATE_OPTIONS;

const awsEsCredentials = async (options = {}) => {
  const credentials = await resolveCredentials(options);

  const defaultOptions = {
    hosts: options.hosts,
    connectionClass: httpAWSES,
    awsConfig: credentials
  };

  const optionsToUse = {
    ...defaultOptions,
    ...options
  };

  setOptions(optionsToUse);
  client = elasticsearch.Client(optionsToUse);
  mapProxy(client);

  if (optionsToUse.useMetadataService === true) {
    startCredentialRefreshInterval();
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
  const region = options.region || process.env.AWS_REGION || 'eu-west-1';
  if (options.useMetadataService !== false) {
    const credentialsJSON = await getCredentials();
    return new AWS.Config({
      accessKeyId: credentialsJSON.AccessKeyId,
      secretAccessKey: credentialsJSON.SecretAccessKey,
      sessionToken: credentialsJSON.Token,
      region
    });
  }

  if (options.credentials) {
    return options.credentials;
  }

  return new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region
  });
};

const clientProxyCaller = (parameters, functionName, newClient) => {
  return newClient[functionName].apply(newClient, parameters);
};

/**
 * Proxy the actual clients functions and add to the clientProxyFunctions array
 * @param {Object} client 
 */

const mapProxy = newClient => {
  clientProxyFunctions = {};
  for (let fn in newClient) {
    const partialApplication = (fn => (...parameters) =>
      clientProxyCaller(parameters, fn, newClient))(fn);
    clientProxyFunctions[fn] = partialApplication;
  }
};

/**
 * Started the refresh interval on first intialisation.
 * Sets the supplied ID after intialisation, in order to not start multiple intervals.
 * @param {Integer} intervalId 
 */

const startCredentialRefreshInterval = () => {
  if (intervalId === null) {
    intervalId = setInterval(async () => {
      client = await awsEsCredentials(getOptions());
      //client.search({});
    }, REFRESH_INTERVAL);
  }
};

export { awsEsCredentials as default };
