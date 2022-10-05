#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoRexPipelineStack } from './Pipeline';

export const serviceName = 'dynamo-rex';

const app = new cdk.App();

new DynamoRexPipelineStack(app, 'DynamoRexPipelineStack', {
	env: {
		region: process.env.CDK_DEFAULT_REGION,
		account: process.env.CDK_DEFAULT_ACCOUNT
	}
});
