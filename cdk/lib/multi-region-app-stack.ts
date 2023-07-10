import {
  CfnOutput, Duration, RemovalPolicy, Stack, StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  UserPool, VerificationEmailStyle, UserPoolClient, AccountRecovery,
} from 'aws-cdk-lib/aws-cognito';
import * as CustomResources from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { staticSite } from './static-site';
// import path = require('path');

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

interface MultiRegionAppStackProps extends StackProps {
  regionCodesToReplicate: string[],
  primaryRegion: string,
  siteDomain: string,
  hostedZoneId: string,
}

export class MultiRegionAppStack extends Stack {
  constructor(scope: Construct, id: string, props: MultiRegionAppStackProps) {
    super(scope, id, props);

    const { env, regionCodesToReplicate, primaryRegion, siteDomain, hostedZoneId } = props;
    const region = env?.region;

    // Static Site
    staticSite(this, `StaticSite-${region}`, {
      env,
      siteDomain,
      siteSubDomain: region ?? '',
      hostedZoneId,
    });
    // TODO: Add Cognito region parameters

    // Cognito User Pool
    const userPool = new UserPool(this, 'example-multi-region-app-user-pool', {
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.PHONE_AND_EMAIL,
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
    });

    // TODO: Add Cognito test users in each region
    // TODO: Smarts to trigger Lambda pre-register

    userPool.addDomain('MultiRegionAppCognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'multi-region-app',
      },
    });

    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
    });

    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    // Add pre-signup Lambda Handler
    const preAuthHandlerLambda = new SimpleLambda(this, 'PreAuthHandler', {
      entryFilename: 'pre-auth-handler.ts',
      handler: 'handleEvent',
      name: 'PreAuthHandler',
      description: 'Handles Amazon Cognito pre sign-up Lambda trigger',
    });

    // Add Cognito Lambda Triggers
    new CustomResources.AwsCustomResource(this, 'UpdateUserPool', {
      resourceType: 'Custom::UpdateUserPool',
      onCreate: {
        region: this.region,
        service: 'CognitoIdentityServiceProvider',
        action: 'updateUserPool',
        parameters: {
          UserPoolId: userPool.userPoolId,
          LambdaConfig: {
            PreAuth: preAuthHandlerLambda.fn.functionArn,
            // TODO: Pre-Sign Up Lambda
          },
        },
        physicalResourceId: CustomResources.PhysicalResourceId.of(userPool.userPoolId),
      },
      policy: CustomResources.AwsCustomResourcePolicy.fromSdkCalls({ resources: CustomResources.AwsCustomResourcePolicy.ANY_RESOURCE }),
    });

    const invokeCognitoTriggerPermission = {
      principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
      sourceArn: userPool.userPoolArn,
    };

    preAuthHandlerLambda.fn.addPermission('InvokePreSignUpHandlerPermission', invokeCognitoTriggerPermission);

    // DynamoDB table to store user residency on the AWS region
    const tableName = 'UserResidency';
    if (region === primaryRegion) {
      new Table(this, tableName, {
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
        tableName,
        partitionKey: {
          name: 'userId',
          type: AttributeType.STRING,
        },
        sortKey: {
          name: 'region',
          type: AttributeType.STRING,
        },
        replicationRegions: regionCodesToReplicate,
      });
    } else {
      Table.fromTableName(this, tableName, tableName);
    }
  }
}
