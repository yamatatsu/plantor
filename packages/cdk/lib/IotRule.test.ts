import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { IotRule } from "./IotRule";

test("snapshot test", () => {
  const app = new App();

  const target = new IotRule(app, "Target", {});

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
