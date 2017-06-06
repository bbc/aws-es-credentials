import "babel-polyfill";
import nock from "nock";
import awsEsCredentials from "./index";

import profile from "../test/fixture/metadata-response-one.js";
import credentials from "../test/fixture/metadata-response-two.json";

const scope = nock(
  "http://169.254.169.254/latest/meta-data/iam/security-credentials"
);

scope.get("/").reply(200, profile);

scope.get(`/${profile}`).reply(200, JSON.stringify(credentials));

const hostUrl =
  "https://search-stories-test-wkoglssk2kmuyet2vz5se3cyr4.eu-west-1.es.amazonaws.com";

(async () => {
  try {
    const options = {
      hosts: hostUrl,
      useMetadataService: true
    };

    let client = await awsEsCredentials(options);

    client
      .search({})
      .then(res => {
        console.log(res);
      })
      .catch(e => {
        console.log(e);
      });
  } catch (e) {
    console.log(e.stack);
  }
})();
