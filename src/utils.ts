export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export interface Constructor<T> {
	new (...params: any[]): T;
}

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

export type RA<D extends object, K extends keyof D> = Pick<D, K> & Partial<Omit<D, K>>;
export type OA<D extends object, K extends keyof D> = Omit<D, K> & Partial<Pick<D, K>>;

export const randomNumber = () => Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

export type Assign<A, B> = Omit<A, keyof B> & B;

export type NoTN<T> = Omit<T, 'TableName'>;

export const chunk = <T>(array: Array<T>, chunkSize: number) => {
	const chunks = [];

	let i = 0;

	while (i < array.length) {
		chunks.push(array.slice(i, (i += chunkSize)));
	}

	return chunks;
};
