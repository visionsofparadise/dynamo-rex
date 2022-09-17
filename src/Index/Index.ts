export type IdxAType = 'S' | 'N';

export class Index<
	IdxN extends PropertyKey,
	HKA extends PropertyKey,
	RKA extends PropertyKey,
	HKLiteral extends IdxAType,
	RKLiteral extends IdxAType,
	HKType = HKLiteral extends 'S' ? string : HKLiteral extends 'N' ? number : string | number,
	RKType = RKLiteral extends 'S' ? string : RKLiteral extends 'N' ? number : string | number
> {
	name: IdxN;

	attributes: {
		hashKey: HKA;
		rangeKey: RKA;
	};

	types!: {
		key: Record<HKA, HKType> & Record<RKA, RKType>;
		hashKey: HKType;
		rangeKey: RKType;
	};

	constructor(
		name: IdxN,
		config: { hashKey: { attribute: HKA; type: HKLiteral }; rangeKey: { attribute: RKA; type: RKLiteral } }
	) {
		this.name = name;

		this.attributes = {
			hashKey: config.hashKey.attribute,
			rangeKey: config.rangeKey.attribute
		};
	}
}
