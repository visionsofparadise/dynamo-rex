import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Table, BillingMode, AttributeType, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export class DynamoRexStack extends Stack {
	public readonly tableName: CfnOutput;

	constructor(scope: Construct, id: string, props: StackProps & { stage: string; deploymentName: string }) {
		super(scope, id, props);

		const database = new Table(this, 'database', {
			tableName: `${props.deploymentName}-database`,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'pk', type: AttributeType.STRING },
			sortKey: { name: 'sk', type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY
		});

		for (let i = 0; i < 10; i++) {
			database.addGlobalSecondaryIndex({
				indexName: `gsi${i}`,
				partitionKey: { name: `gsi${i}Pk`, type: AttributeType.STRING },
				sortKey: { name: `gsi${i}Sk`, type: AttributeType.STRING },
				projectionType: ProjectionType.ALL
			});
		}

		this.tableName = new CfnOutput(this, `${props.deploymentName}-tableName`, {
			value: database.tableName,
			exportName: `${props.deploymentName}-tableName`
		});
	}
}
