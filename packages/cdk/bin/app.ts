import { App } from "aws-cdk-lib";
import { IotThing } from "../lib/IotThing";
import { IotRule } from "../lib/IotRule";
import { Dashboard } from "../lib/Dashboard";

const CLIENT_CERT_ARN = process.env.CLIENT_CERT_ARN!;

const app = new App();
new IotThing(app, "IotThing", {
  clientCertArn: CLIENT_CERT_ARN,
});

new IotRule(app, "IotRule", {});

new Dashboard(app, "Plantor-Dashboard", {});
