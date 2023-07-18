import {
  CfnOutput, CfnResource, Fn, RemovalPolicy, Stack, StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  UserPool, VerificationEmailStyle, UserPoolClient, AccountRecovery, StringAttribute, ClientAttributes,
} from 'aws-cdk-lib/aws-cognito';
import * as CustomResources from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ARecord, CfnRecordSet, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Cors, DomainName, EndpointType, LambdaIntegration, RestApi, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import { SimpleLambda } from './simple-lambda';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
// import path = require('path');

interface MultiRegionAppStackProps extends StackProps {
  regionCodesToReplicate: string[],
  primaryRegion: string,
  siteDomain?: string,
  siteSubDomain?: string,
  certificate?: Certificate,
  hostedZoneId?: string,
}

export default class MultiRegionAppStack extends Stack {
  constructor(scope: Construct, id: string, props: MultiRegionAppStackProps) {
    super(scope, id, props);

    const {
      regionCodesToReplicate,
      primaryRegion,
      siteDomain,
      siteSubDomain,
      hostedZoneId,
    } = props;

    const { region, account } = Stack.of(this);
    const siteHost = `${siteSubDomain}.${siteDomain}`;
    const globalSiteHost = `app.${siteDomain}`;
    const frontendSiteHost = `frontend.${siteDomain}`;
    const tableName = 'UserResidency';

    // Cognito User Pool
    const userPool = new UserPool(this, 'AppUserPool', {
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
      customAttributes: {
        country: new StringAttribute({ mutable: true }),
      },
    });

    // TODO: Add Cognito test users in each region (https://github.com/awesome-cdk/cdk-userpool-user)
    // TODO: Smarts to trigger Lambda pre-register

    const cognitoDomainPrefix = `app-${account}-${region}`;
    userPool.addDomain('AppCognitoDomain', {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });

    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      address: true,
      birthdate: true,
      gender: true,
      locale: true,
      middleName: true,
      fullname: true,
      nickname: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      profilePicture: true,
      preferredUsername: true,
      profilePage: true,
      timezone: true,
      lastUpdateTime: true,
      website: true,
    };

    const clientReadAttributes = new ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['country']);

    const clientWriteAttributes = new ClientAttributes()
      .withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      })
      .withCustomAttributes(...['country']);

    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      oAuth: {
        callbackUrls: [
          `https://${frontendSiteHost}`,
          'http://localhost:3000/',
        ],
      },
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });

    new CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      exportName: 'CognitoUserPoolId',
    });

    new StringParameter(this, 'ParamUserPoolId', {
      parameterName: 'CognitoUserPoolId',
      stringValue: userPool.userPoolId,
    });

    new CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'CognitoUserPoolClientId',
    });

    new StringParameter(this, 'ParamUserPoolClientId', {
      parameterName: 'CognitoUserPoolClientId',
      stringValue: userPoolClient.userPoolClientId,
    });

    // Add pre-signup Lambda Handler
    const preAuthHandlerLambda = new SimpleLambda(this, 'PreAuthHandler', {
      entryFilename: 'pre-auth-handler.ts',
      handler: 'handleEvent',
      name: 'PreAuthHandler',
      description: 'Handles Amazon Cognito pre auth Lambda trigger',
      envVariables: {
        USER_RESIDENCY_TABLE: tableName,
      },
    });

    // Add pre-signup Lambda Handler
    const preSignUpHandlerLambda = new SimpleLambda(this, 'PreSignUpHandler', {
      entryFilename: 'pre-sign-up-handler.ts',
      handler: 'handleEvent',
      name: 'PreSignUpHandler',
      description: 'Handles Amazon Cognito pre sign-up Lambda trigger',
      envVariables: {
        USER_RESIDENCY_TABLE: tableName,
      },
    });

    // Add DynamoDB PutItem IAM Role to preSignUpHandlerLambda.fn Service Role
    preSignUpHandlerLambda.fn.addToRolePolicy(new iam.PolicyStatement(
      {
        actions: ['dynamodb:PutItem'],
        resources: [
          `arn:aws:dynamodb:${region}:${account}:table/${tableName}`,
          `arn:aws:dynamodb:${region}:${account}:table/${tableName}/*`,
        ],
      },
    ));

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
            PreAuthentication: preAuthHandlerLambda.fn.functionArn,
            PreSignUp: preSignUpHandlerLambda.fn.functionArn,
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

    preSignUpHandlerLambda.fn.addPermission('InvokePreSignUpHandlerPermission', invokeCognitoTriggerPermission);
    preAuthHandlerLambda.fn.addPermission('InvokePreSignUpHandlerPermission', invokeCognitoTriggerPermission);

    // DynamoDB table to store user residency on the AWS region
    if (region === primaryRegion) {
      const ddbGlobalTableRemovalPolicy = RemovalPolicy.RETAIN;

      const globalTable = new Table(this, tableName, {
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: ddbGlobalTableRemovalPolicy, // Retain DynamoDB table
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

      const customReplicaResource = globalTable.node.children.find((child) => (child as any).resource?.cfnResourceType === 'Custom::DynamoDBReplica') as CfnResource;

      customReplicaResource.applyRemovalPolicy(ddbGlobalTableRemovalPolicy);
    } else {
      Table.fromTableName(this, tableName, tableName);
    }

    // Add an API Gateway and Lambda backend stack
    const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      zoneName: siteDomain as string,
      hostedZoneId: hostedZoneId as string,
    });

    const regionCertificate = new Certificate(this, 'AppCertificate', {
      domainName: `*.${siteDomain}`,
      validation: CertificateValidation.fromDns(zone),
    });

    const restApi = new RestApi(this, `Api-${region}`, {
      restApiName: `Api-${region}`,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
      deployOptions: {
        variables: {
          REGION: region,
        },
      },
    });

    // Add front-end config Lambda Handler
    const frontendConfigHandlerLambda = new SimpleLambda(this, 'ConfigHandler', {
      entryFilename: 'config-handler.ts',
      handler: 'handleEvent',
      name: 'ConfigHandler',
      description: 'Handles config metadata for frontend consumption',
    });

    // Add SSM access to frontendConfigHandlerLambda.fn Service Role
    frontendConfigHandlerLambda.fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: ['*'],
    }));

    const frontendConfig = restApi.root.addResource('config');

    frontendConfig.addMethod(
      'GET',
      new LambdaIntegration(frontendConfigHandlerLambda.fn, { proxy: true }),
    );

    const apigwGlobalDomainName = new DomainName(this, `${region}DomainName`, {
      domainName: globalSiteHost,
      certificate: regionCertificate,
      securityPolicy: SecurityPolicy.TLS_1_2,
    });

    const apigwRegionalDomainName = new DomainName(this, `${region}DomainName-Regional`, {
      domainName: siteHost,
      certificate: regionCertificate,
      securityPolicy: SecurityPolicy.TLS_1_2,
    });

    apigwGlobalDomainName.addBasePathMapping(restApi);
    apigwRegionalDomainName.addBasePathMapping(restApi);

    /*
    TODO:Route53 Health Checks

    const executeApiDomainName = Fn.join('.', [
      restApi.restApiId,
      'execute-api',
      region,
      Fn.ref('AWS::URLSuffix'),
    ]);

    const healthCheck = new CfnHealthCheck(this, `${region}HealthCheck`, {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: executeApiDomainName,
        port: 443,
        resourcePath: `/${restApi.deploymentStage.stageName}/health`,
      },
    });
    */
    const dnsRecord = new ARecord(this, `Api-${region}-Global`, {
      zone,
      recordName: globalSiteHost,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apigwGlobalDomainName)),
    });

    const recordSet = dnsRecord.node.defaultChild as CfnRecordSet;
    recordSet.region = region;
    // recordSet.healthCheckId = healthCheck.attrHealthCheckId;
    recordSet.setIdentifier = `Api-${region}`;

    // Add the regional domain name for direct access without latency routing
    new ARecord(this, `Api-${region}-Region`, {
      zone,
      recordName: siteHost,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apigwGlobalDomainName)),
    });
  }
}
