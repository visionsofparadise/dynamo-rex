export type IdxALiteral = 'S' | 'N';

export class Index<
	IdxN extends PropertyKey,
	HKA extends PropertyKey,
	RKA extends PropertyKey,
	HKLiteral extends IdxALiteral,
	RKLiteral extends IdxALiteral,
	HKType = HKLiteral extends 'S' ? string : HKLiteral extends 'N' ? number : string | number,
	RKType = RKLiteral extends 'S' ? string : RKLiteral extends 'N' ? number : string | number
> {
	name: IdxN;

	hashKey: HKA;
	rangeKey: RKA;

	key!: Record<HKA, HKType> & Record<RKA, RKType>;

	constructor(
		name: IdxN,
		config: { hashKey: { attribute: HKA; type: HKLiteral }; rangeKey: { attribute: RKA; type: RKLiteral } }
	) {
		this.name = name;

		(this.hashKey = config.hashKey.attribute), (this.rangeKey = config.rangeKey.attribute);
	}
}
