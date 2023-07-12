import {
  CfnOutput, RemovalPolicy, Stack, StackProps, Fn,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  ARecord, RecordTarget, CfnRecordSet, HostedZone,
} from 'aws-cdk-lib/aws-route53';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AllowedMethods, Distribution, IDistribution, SecurityPolicyProtocol, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { BlockPublicAccess, Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { IUserPool, IUserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */

interface StaticSiteProps extends StackProps {
  siteDomain: string,
  siteSubDomain: string,
  certificate: Certificate,
  hostedZoneId: string,
  userPool?: IUserPool,
  userPoolClient?: IUserPoolClient,
  userPoolId?: string,
  userPoolClientId?: string,
}

export default class StaticSiteStack extends Stack {
  public readonly bucket : IBucket;

  public readonly distribution : IDistribution;

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id, props);

    const {
      siteDomain,
      siteSubDomain,
      hostedZoneId,
      certificate,
    } = props;

    const { account, region } = Stack.of(this);

    const siteHost = `${siteSubDomain}.${siteDomain}`;
    new CfnOutput(this, 'Site', { value: `https://${siteHost}` });

    // Content bucket
    const bucket = new Bucket(this, 'StaticSiteBucket', {
      bucketName: `app-static-${account}-${region}`,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
    });
    new CfnOutput(this, 'StaticSiteBucketArn', { value: bucket.bucketArn });

    // CloudFront distribution
    const distribution = new Distribution(this, 'SiteDistribution', {
      certificate,
      domainNames: [siteHost],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucket),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // TODO: Add geolocation routing

    // Route53 alias record for the CloudFront distribution
    const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      zoneName: siteDomain,
      hostedZoneId,
    });

    const dnsRecord = new ARecord(this, `SiteAliasRecord-${region}`, {
      zone,
      recordName: siteHost,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    const recordSet = dnsRecord.node.defaultChild as CfnRecordSet;
    recordSet.region = region;
    recordSet.setIdentifier = `Site-${region}`;

    // Get cognito parameters
    const userPoolId = StringParameter.valueForStringParameter(this, 'CognitoUserPoolId');
    const userPoolClientId = StringParameter.valueForStringParameter(this, 'CognitoUserPoolClientId');

    // Create a config metadata
    const config = {
      region: Stack.of(this).region,
      userPoolId,
      userPoolClientId,
    };

    // Deploy site contents to S3 bucket
    new BucketDeployment(this, 'DeployS3', {
      sources: [Source.asset('../src/app/build'), Source.jsonData('config.json', config)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    this.bucket = bucket;
    this.distribution = distribution;
  }
}