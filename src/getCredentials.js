import request from "request-promise";

let baseUrl =
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/";

const getCredentials = () => {
  return request({ url: baseUrl }).then(payload => {
    return request({ url: baseUrl + payload.split("\n")[0] }).then(credentialString => {
      return JSON.parse(credentialString);
    });
  });
};

export { getCredentials };
