import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { IotThing } from "./IotThing";

test("snapshot test", () => {
  const app = new App();

  const target = new IotThing(app, "Target", {
    clientCertArn: "test-clientCertArn",
  });

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
