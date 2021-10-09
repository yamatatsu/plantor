import { App, Stack, StackProps, aws_iot } from "aws-cdk-lib";

type Props = StackProps & {
  clientCertArn: string;
};

export class IotThing extends Stack {
  constructor(parent: App, id: string, props: Props) {
    super(parent, id, props);

    const { clientCertArn } = props;

    const thingName = "wio_terminal";
    const thing = new aws_iot.CfnThing(this, "Thing", {
      thingName,
      attributePayload: {},
    });
    const policyName = "wio_terminal_policy";
    const policy = new aws_iot.CfnPolicy(this, "Policy", {
      policyName,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Connect",
              "iot:Receive",
              "iot:Publish",
              "iot:Subscribe",
            ],
            /**
             * You can get higher security if you set Client ARNs instead of `*`.
             * @see https://docs.aws.amazon.com/iot/latest/developerguide/create-iot-resources.html#create-iot-policy
             */
            Resource: "*",
          },
        ],
      },
    });

    /**
     * これにより、証明書が権限を持つ。（認可）
     * この設定がないと、証明書があってもmqttとかは認証エラーとなる。
     */
    const policyPrincipalAtt = new aws_iot.CfnPolicyPrincipalAttachment(
      this,
      "PPA",
      {
        policyName,
        principal: clientCertArn,
      },
    );

    /**
     * これにより、証明書が thing とマッピングする。
     * この設定がないと AWS IoT は mqtt を受け取っても各機能に紐付けられない。
     */
    const thingPrincipalAtt = new aws_iot.CfnThingPrincipalAttachment(
      this,
      "TPA",
      {
        thingName,
        principal: clientCertArn,
      },
    );

    policyPrincipalAtt.addDependsOn(policy);
    thingPrincipalAtt.addDependsOn(thing);
  }
}
