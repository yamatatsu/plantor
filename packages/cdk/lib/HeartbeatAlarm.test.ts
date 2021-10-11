import { SynthUtils } from "@aws-cdk/assert";
import { App } from "aws-cdk-lib";
import { HeartbeatAlarm } from "./HeartbeatAlarm";

test("snapshot test", () => {
  const app = new App();

  const target = new HeartbeatAlarm(app, "Target", {});

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
