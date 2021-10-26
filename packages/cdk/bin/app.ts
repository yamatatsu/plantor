import { App } from "aws-cdk-lib";
import { IotThing } from "../lib/IotThing";
import { IotRule } from "../lib/IotRule";
import { NatureRemo } from "../lib/NatureRemo";
import { Dashboard } from "../lib/Dashboard";

const CLIENT_CERT_ARN = process.env.CLIENT_CERT_ARN!;

const app = new App();
new IotThing(app, "Plantor-IotThing", {
  clientCertArn: CLIENT_CERT_ARN,
});

new IotRule(app, "Plantor-IotRule", {});

new NatureRemo(app, "Plantor-NatureRemo", {});

new Dashboard(app, "Plantor-Dashboard", {});
