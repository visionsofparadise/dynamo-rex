type LogFunction = (message: unknown) => void;

export interface ILogger {
	warn: LogFunction;
	error: LogFunction;
	info: LogFunction;
	log: LogFunction;
}

export const constructObject = <K extends PropertyKey, V>(keys: K[], values: V[]) => {
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [P in K]: V };
};

export type RequiredAttribtues<Data extends object, Attribtues extends keyof Data> = Pick<Data, Attribtues> &
	Partial<Omit<Data, Attribtues>>;
export type OptionalAttribtues<Data extends object, Attribtues extends keyof Data> = Omit<Data, Attribtues> &
	Partial<Pick<Data, Attribtues>>;
