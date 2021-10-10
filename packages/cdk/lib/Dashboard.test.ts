import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { Dashboard } from "./Dashboard";

test("snapshot test", () => {
  const app = new App();

  const target = new Dashboard(app, "Target", {});

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
