import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { NatureRemo } from "../lib/NatureRemo";

test("snapshot test", () => {
  const app = new App();

  const target = new NatureRemo(app, "Target", {});

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
