import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const configuration = { region: "ap-northeast-1" };
const secretsManagerClient = new SecretsManagerClient(configuration);

export async function getNatureRemoToken(secretId: string): Promise<string> {
  const value = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  const natureRemoToken = value.SecretString;
  if (!natureRemoToken) {
    throw new Error("nature remo tokenがemptyでは実行できない");
  }

  return natureRemoToken;
}
