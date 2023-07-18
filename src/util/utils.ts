import { createHash } from 'crypto';

type Log = (message: unknown) => void;

export interface ILogger {
	warn: Log;
	error: Log;
	info: Log;
	log: Log;
}

export const zipObject = <K extends PropertyKey, V>(keys: K[], values: V[]) => {
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [P in K]: V };
};

export const hash = (values: Array<any>) => {
	const hash = createHash('sha256');

	for (const value of values) {
		hash.update(value);
	}

	const hashValue = hash.end().read();

	return hashValue.toString('base64url').slice(0, 21) || '';
};

export const randomNumber = () => Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
export const randomString = () => hash([randomNumber().toString()]);

export const run = <T>(fn: () => T): T => fn();

export const arrayOfLength = (length: number) =>
	Array.apply(null, Array(Math.max(Math.round(length), 0))).map(() => {});
