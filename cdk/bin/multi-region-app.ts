#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import MultiRegionAppStack from '../lib/multi-region-app-stack';
import CertificateStack from '../lib/certificate-stack';
import StaticSiteStack from '../lib/static-site-stack';

const app = new cdk.App();

const REGIONS = process.env.REGIONS || 'ap-southeast-2, us-east-2, eu-west-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const siteDomain = process.env.SITEDOMAIN || '';
const hostedZoneId = process.env.HOSTEDZONEID || '';

const regionsToDeploy = REGIONS.split(',').map((r) => r.trim());

// Global stack
const certStack = new CertificateStack(app, 'CertStack-us-east-1', {
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
    hostedZoneId,
  });
});

// Deploy the static front-end only in the primary region
// Note Cloudfront has global Points-of-Presence (PoP) to reduce latency globally
const { certificate } = certStack;

new StaticSiteStack(app, `App-Frontend-${primaryRegion}`, {
  env: {
    account,
    region: primaryRegion,
  },
  crossRegionReferences: true,
  siteDomain,
  hostedZoneId,
  certificate,
});
