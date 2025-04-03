import { isNumExp, isBoolExp, isVarRef, isPrimOp, isProgram, isDefineExp, isVarDecl,
    isAppExp, isStrExp, isIfExp, isProcExp, isLetExp, isLitExp, isLetrecExp, isSetExp,
    parseL5Exp, unparse, Exp, parseL5, Program } from "../src/L5/L5-ast";
import { Result, bind, isOkT, makeOk, mapv, isFailure } from "../src/shared/result";
import { parse as parseSexp } from "../src/shared/parser";
import { TExp, parseTExp, unparseTExp, makeDiffTExp, isSubType } from "../src/L5/TExp";

const p = (x: string): Result<Exp> => bind(parseSexp(x), parseL5Exp);
const pt = (x: string): Result<TExp> => bind(parseSexp(x), (p) => parseTExp(p));

// L52 Tests Begin
describe('L52 Test of makeDiffTExp', () => {
    it('Basic type predicate test', () => {
        const te1 = `any`;
        const te2 = `number`;
        const diffTExp = bind(pt(te1), 
            (te1 : TExp) => bind(pt(te2), 
            (te2 : TExp) => 
                unparseTExp(makeDiffTExp(te1, te2))))
        expect(diffTExp).toEqual(makeOk("any"));
    });

    it('Basic type predicate test', () => {
        const te1 = `number`;
        const te2 = `boolean`;
        const diffTExp = bind(pt(te1), 
            (te1 : TExp) => bind(pt(te2), 
            (te2 : TExp) => 
                unparseTExp(makeDiffTExp(te1, te2))))
        expect(diffTExp).toEqual(makeOk("number"));
    });

    it('Basic type predicate test', () => {
        const te1 = `(union number string)`;
        const te2 = `number`;
        const diffTExp = bind(pt(te1), 
            (te1 : TExp) => bind(pt(te2), 
            (te2 : TExp) => 
                unparseTExp(makeDiffTExp(te1, te2))))
        expect(diffTExp).toEqual(makeOk("string"));
    });

    it('Basic type predicate test', () => {
        const te1 = `(union number string)`;
        const te2 = `(inter number boolean)`;
        const diffTExp = bind(pt(te1), 
            (te1 : TExp) => bind(pt(te2), 
            (te2 : TExp) => 
                unparseTExp(makeDiffTExp(te1, te2))))
        expect(diffTExp).toEqual(makeOk("(union number string)"));
    });

    it('Basic type predicate test', () => {
        const te1 = `(union number string boolean)`;
        const te2 = `(union number boolean)`;
        const diffTExp = bind(pt(te1), 
            (te1 : TExp) => bind(pt(te2), 
            (te2 : TExp) => 
                unparseTExp(makeDiffTExp(te1, te2))))
        expect(diffTExp).toEqual(makeOk("string"));
    });
});

describe('L52 Test of isSubType', () => {
    it('Basic type predicate test', () => {
        const te1 = `any`;
        const te2 = `number`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(false));
    });

    it('Basic type predicate test', () => {
        const te1 = `number`;
        const te2 = `any`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(true));
    });

    it('Basic type predicate test', () => {
        const te1 = `number`;
        const te2 = `number`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(true));
    });

    it('Basic type predicate test', () => {
        const te1 = `number`;
        const te2 = `(union string number)`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(true));
    });

    it('Basic type predicate test', () => {
        const te1 = `(union string number)`;
        const te2 = `(union string number boolean)`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(true));
    });

    it('Basic type predicate test', () => {
        const te1 = `(inter any number)`;
        const te2 = `(union string number boolean)`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(true));
    });

    it('Basic type predicate test', () => {
        const te1 = `(inter (union string boolean) string)`;
        const te2 = `boolean`;
        const isSub = bind(pt(te1), (te1 : TExp) => bind(pt(te2), (te2 : TExp) => makeOk(isSubType(te1, te2))))
        expect(isSub).toEqual(makeOk(false));
    });
});
// L52 Tests End