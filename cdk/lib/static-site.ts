import {
  CfnOutput, Duration, RemovalPolicy, StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  ARecord, HostedZone, RecordTarget, CfnRecordSet,
} from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */

export interface StaticSiteProps extends StackProps {
  siteDomain: string;
  siteSubDomain: string;
  hostedZoneId: string;
}

export function staticSite(scope: Construct, id: string, props: StaticSiteProps) {
  const { env, siteDomain, siteSubDomain, hostedZoneId } = props;
  const region = env?.region;

  const zone = HostedZone.fromHostedZoneAttributes(scope, 'Zone', {
    zoneName: siteDomain,
    hostedZoneId,
  });
  const siteHost = `${siteSubDomain}.${siteDomain}`;
  const cloudfrontOAI = new cloudfront.OriginAccessIdentity(scope, 'cloudfront-OAI', {
    comment: `OAI for ${siteHost}`,
  });

  new CfnOutput(scope, 'Site', { value: `https://${siteHost}` });

  // Content bucket
  const siteBucket = new s3.Bucket(scope, `StaticSiteBucket-${region}`, {
    bucketName: `example-multi-region-static-${region}`,
    publicReadAccess: false,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    /**
     * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
     * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
     * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
     */
    removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    /**
     * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
     * setting will enable full cleanup of the demo.
     */
    autoDeleteObjects: true, // NOT recommended for production code
  });

  // Grant access to cloudfront
  siteBucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [siteBucket.arnForObjects('*')],
    principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
  }));

  new CfnOutput(scope, 'Bucket', { value: siteBucket.bucketName });

  // TLS certificate
  const certificate = new acm.Certificate(scope, 'SiteCertificate', {
    domainName: siteDomain,
    validation: acm.CertificateValidation.fromDns(zone),
    region: 'us-east-1',
  });

  new CfnOutput(scope, 'Certificate', { value: certificate.certificateArn });

  // CloudFront distribution
  const distribution = new cloudfront.Distribution(scope, 'SiteDistribution', {
    certificate,
    defaultRootObject: 'index.html',
    domainNames: [siteDomain],
    minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 403,
        responsePagePath: '/error.html',
        ttl: Duration.minutes(30),
      },
    ],
    defaultBehavior: {
      origin: new cloudfrontOrigins.S3Origin(siteBucket, { originAccessIdentity: cloudfrontOAI }),
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
  });

  new CfnOutput(scope, 'DistributionId', { value: distribution.distributionId });

  // Route53 alias record for the CloudFront distribution
  const dnsRecord = new ARecord(scope, `SiteAliasRecord-${region}`, {
    recordName: siteDomain,
    target: RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    zone,
  });

  const recordSet = dnsRecord.node.defaultChild as CfnRecordSet;
  recordSet.region = region;
  recordSet.setIdentifier = `Site-${region}`;

  // Deploy site contents to S3 bucket
  new s3deploy.BucketDeployment(scope, 'DeployWithInvalidation', {
    sources: [s3deploy.Source.asset('../src/app')],
    destinationBucket: siteBucket,
    distribution,
    distributionPaths: ['/*'],
  });
}
