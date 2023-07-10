#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { MultiRegionAppStack } from '../lib/multi-region-app-stack';

const app = new cdk.App();

const regionsToDeploy = ['us-west-1', 'ap-southeast-2'];
const siteDomain = 'aws.wirjo.com';
const hostedZoneId = 'Z07981271ND50BK0E03QO';

// Regional stacks
regionsToDeploy.forEach((regionCode) => {
  const stack = new MultiRegionAppStack(app, `MultiRegionAppStack-${regionCode}`, {
    env: { region: regionCode },
    regionCodesToReplicate: regionsToDeploy.filter((replicationRegion) => replicationRegion !== regionCode),
    primaryRegion: regionsToDeploy[0],
    siteDomain,
    hostedZoneId,
  });
  Tags.of(stack).add('project', 'aws-multi-region-data-residency');
  Tags.of(stack).add('topic', 'multi-region-data-residency');
});
