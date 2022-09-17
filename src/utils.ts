type LogFunction = (message: any) => void;

export interface ILogger {
	warn: LogFunction;
	error: LogFunction;
	info: LogFunction;
	log: LogFunction;
}

export const constructObject = <K extends PropertyKey, V>(keys: K[], values: V[]) => {
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [P in K]: V };
};
