module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	rootDir: 'src/',
	globalSetup: process.env.INTEGRATION_TEST !== 'true' ? '../node_modules/@shelf/jest-dynamodb/setup.js' : undefined,
	globalTeardown:
		process.env.INTEGRATION_TEST !== 'true' ? '../node_modules/@shelf/jest-dynamodb/teardown.js' : undefined
};

process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'test';
