/* integration test script */
import nock from "nock";
import awsEsCredentials from "./index";

import profile from "../test/fixture/metadata-response-one.js";
import credentials from "../test/fixture/metadata-response-two.json";

const scope = nock(
  "elasticsearc-endpoint-goes-here"
);

scope.get("/").reply(200, profile);

scope.get(`/${profile}`).reply(200, JSON.stringify(credentials));

const hostUrl =
  "elasticsearc-endpoint-goes-here";

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
        console.log(e, e.stack);
      });
  } catch (e) {
    console.log(e, e.stack);
  }
})();
