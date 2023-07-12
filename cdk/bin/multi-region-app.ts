#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import MultiRegionAppStack from '../lib/multi-region-app-stack';
import CertificateStack from '../lib/certificate-stack';
import StaticSiteStack from '../lib/static-site-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const REGIONS = process.env.REGIONS || 'ap-southeast-2, us-east-2, eu-west-1';
const regionsToDeploy = REGIONS.split(',').map((r) => r.trim());
const siteDomain = process.env.SITEDOMAIN || '';
const hostedZoneId = process.env.HOSTEDZONEID || '';

// Global stack
const certStack = new CertificateStack(app, 'AppCertStack', {
  env: {
    account,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
  siteDomain,
  hostedZoneId,
});

// Regional stacks
const primaryRegion = regionsToDeploy[0];
regionsToDeploy.forEach((region) => {
  const regionCodesToReplicate = regionsToDeploy.filter((r) => r !== region);
  const siteSubDomain = region;
  const { certificate } = certStack;

  new MultiRegionAppStack(app, `App-Backend-${region}`, {
    env: {
      account,
      region,
    },
    crossRegionReferences: true,
    primaryRegion,
    regionCodesToReplicate,
    siteDomain,
    siteSubDomain,
  });

  new StaticSiteStack(app, `App-Frontend-${region}`, {
    env: {
      account,
      region,
    },
    crossRegionReferences: true,
    siteDomain,
    siteSubDomain,
    hostedZoneId,
    certificate,
  });
});
