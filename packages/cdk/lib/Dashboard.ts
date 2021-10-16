import { App, Stack, StackProps, aws_cloudwatch, Duration } from "aws-cdk-lib";

type Props = StackProps & {};

export class Dashboard extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    /**
     * calibration: ((val - min) / (max - min)) * 100
     * max: 380
     * min: 640
     */
    const moisture001 = new aws_cloudwatch.MathExpression({
      label: "moisture001",
      expression: "((m1 - 640) / (380 - 640)) * 100",
      period: Duration.hours(6),
      usingMetrics: {
        m1: new aws_cloudwatch.Metric({
          metricName: "moisture001",
          namespace: "CUSTOM-IoT/Moisture",
          period: Duration.hours(6),
          statistic: "Average",
        }),
      },
    });

    new aws_cloudwatch.Dashboard(this, "Dashboard", {
      // This name "CloudWatch-Default" is needed to show on Top page of CloudWatch as default dashboard
      dashboardName: "CloudWatch-Default",
      start: "-P1M",
      widgets: [
        [
          new aws_cloudwatch.SingleValueWidget({
            title: "moisture001",
            metrics: [moisture001],
          }),
        ],
        [
          new aws_cloudwatch.GraphWidget({
            title: "Moisture",
            width: 24,
            left: [moisture001],
          }),
        ],
      ],
    });
  }
}
