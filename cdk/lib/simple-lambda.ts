import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SimpleLambdaProps {
    memorySize?: number;
    reservedConcurrentExecutions?: number;
    runtime?: Runtime;
    name: string;
    description: string;
    entryFilename: string;
    handler?: string;
    timeout?: Duration;
    envVariables?: any;
}

export class SimpleLambda extends Construct {
  public fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: SimpleLambdaProps) {
    super(scope, id);

    this.fn = new NodejsFunction(this, id, {
      entry: `../src/lambda/${props.entryFilename}`,
      handler: props.handler ?? 'handler',
      runtime: props.runtime ?? Runtime.NODEJS_18_X,
      timeout: props.timeout ?? Duration.seconds(5),
      memorySize: props.memorySize ?? 1024,
      tracing: Tracing.ACTIVE,
      functionName: props.name,
      description: props.description,
      // depsLockFilePath: path.join(__dirname, '..', '..', 'src', 'package-lock.json'),
      environment: props.envVariables ?? {},
    });
  }
}
