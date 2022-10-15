#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoXPipelineStack } from './Pipeline';

export const serviceName = 'dynamox';

const app = new cdk.App();

new DynamoXPipelineStack(app, 'DynamoXPipelineStack', {
	env: {
		region: process.env.CDK_DEFAULT_REGION,
		account: process.env.CDK_DEFAULT_ACCOUNT
	}
});
