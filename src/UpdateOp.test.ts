import { dxOp, DxOp } from './UpdateOp';

it('instanceof works with abstract', () => {
	const o1 = dxOp.Value('x');

	expect((o1 as any) instanceof DxOp).toBe(true);
});
