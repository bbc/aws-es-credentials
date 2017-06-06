import AWS from "aws-sdk";
import httpAWSES from "http-aws-es";
import elasticsearch from "elasticsearch";
import { getCredentials } from "./getCredentials";

const clientProxyFunctions = {};
const REFRESH_INTERVAL = 3600000;
let REVALIDATE_OPTIONS = {}; // these options are used when we recreate the client after the credentials expire
let client = null;
let intervalId = null;

// query metadata service
// set the credentials
// update the credentials
// see you if you update the credentials through updating the config
// local no polling mode
const setOptions = options => {
  REVALIDATE_OPTIONS = options;
};

const getOptions = () => REVALIDATE_OPTIONS;

const elastipasty = async options => {
  const region = options.region || process.env.AWS_REGION || "eu-west-1";
  const credentials = await resolveCredentials(options);

  // how to do credentials
  // pick from options, pick from process, use token

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

  return client;
};

const resolveCredentials = async options => {
  if (options.useMetadataService === true) {
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
  client[functionName].apply(client, parameters);
};

const mapProxy = client => {
  for (let fn in client) {
    const partialApplication = (fn => (...parameters) =>
      clientProxyCaller(parameters, fn))(fn);
    clientProxyFunctions[fn] = partialApplication;
  }
};

const startCredentialRefreshInterval = intervalId => {
  if (intervalId === null) {
    intervalId = setInterval(async () => {
      client = await elastipasty(getOptions());
      client.search({});
    }, REFRESH_INTERVAL);
  }
};

export { elastipasty as default };
