import { App, Stack, StackProps, aws_cloudwatch, Duration } from "aws-cdk-lib";

type Props = StackProps & {};

export class Dashboard extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    new aws_cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: "plantor",
      start: "-P1W",
      widgets: [
        [
          new aws_cloudwatch.GraphWidget({
            title: "Moisture",
            width: 24,
            left: [
              new aws_cloudwatch.Metric({
                metricName: "001",
                namespace: "CUSTOM-IoT/Moisture",
                period: Duration.hours(1),
                statistic: "Average",
              }),
            ],
          }),
        ],
      ],
    });
  }
}
