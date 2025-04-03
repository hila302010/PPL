import { isNumExp, isBoolExp, isVarRef, isPrimOp, isProgram, isDefineExp, isVarDecl,
         isAppExp, isStrExp, isIfExp, isProcExp, isLetExp, isLitExp, isLetrecExp, isSetExp,
         parseL5Exp, unparse, Exp, parseL5, Program } from "../src/L5/L5-ast";
import { Result, bind, isOkT, makeOk, mapv, isFailure } from "../src/shared/result";
import { parse as parseSexp } from "../src/shared/parser";
import { TExp, isNumTExp, isProcTExp, isUnionTExp, parseTExp, isAnyTExp, isNeverTExp, isInterTExp, unparseTExp, makeDiffTExp, parseTE, makeAnyTExp, isSubType } from "../src/L5/TExp";

const p = (x: string): Result<Exp> => bind(parseSexp(x), parseL5Exp);
const pt = (x: string): Result<TExp> => bind(parseSexp(x), (p) => parseTExp(p));

describe('L5 Parser', () => {
    it('parses atomic expressions', () => {
        expect(p("1")).toSatisfy(isOkT(isNumExp));
        expect(p("#t")).toSatisfy(isOkT(isBoolExp));
        expect(p("x")).toSatisfy(isOkT(isVarRef));
        expect(p('"a"')).toSatisfy(isOkT(isStrExp));
        expect(p(">")).toSatisfy(isOkT(isPrimOp));
        expect(p("=")).toSatisfy(isOkT(isPrimOp));
        expect(p("string=?")).toSatisfy(isOkT(isPrimOp));
        expect(p("eq?")).toSatisfy(isOkT(isPrimOp));
        expect(p("cons")).toSatisfy(isOkT(isPrimOp));
    });

    it('parses programs', () => {
        expect(parseL5("(L5 (define x 1) (> (+ x 1) (* x x)))")).toSatisfy(isOkT(isProgram));
    });

    it('parses "define" expressions', () => {
        const def = p("(define x 1)");
        expect(def).toSatisfy(isOkT(isDefineExp));
        if (isOkT(isDefineExp)(def)) {
            expect(def.value.var).toSatisfy(isVarDecl);
            expect(def.value.val).toSatisfy(isNumExp);
        }
    });

    it('parses "define" expressions with type annotations', () => {
        const define = "(define (a : number) 1)";
        expect(p(define)).toSatisfy(isOkT(isDefineExp));
    });

    it('parses applications', () => {
        expect(p("(> x 1)")).toSatisfy(isOkT(isAppExp));
        expect(p("(> (+ x x) (* x x))")).toSatisfy(isOkT(isAppExp));
    });

    it('parses "if" expressions', () => {
        expect(p("(if #t 1 2)")).toSatisfy(isOkT(isIfExp));
        expect(p("(if (< x 2) x 2)")).toSatisfy(isOkT(isIfExp));
    });

    it('parses procedures', () => {
        expect(p("(lambda () 1)")).toSatisfy(isOkT(isProcExp));
        expect(p("(lambda (x) x x)")).toSatisfy(isOkT(isProcExp));
    });

    it('parses procedures with type annotations', () => {
        expect(p("(lambda ((x : number)) : number (* x x))")).toSatisfy(isOkT(isProcExp));
    });

    it('parses "let" expressions', () => {
        expect(p("(let ((a 1) (b #t)) (if b a (+ a 1)))")).toSatisfy(isOkT(isLetExp));
    });

    it('parses "let" expressions with type annotations', () => {
        expect(p("(let (((a : boolean) #t) ((b : number) 2)) (if a b (+ b b)))")).toSatisfy(isOkT(isLetExp));
    });

    it('parses literal expressions', () => {
        expect(p("'a")).toSatisfy(isOkT(isLitExp));
        expect(p("'()")).toSatisfy(isOkT(isLitExp));
        expect(p("'(1)")).toSatisfy(isOkT(isLitExp));
    });

    it('parses "letrec" expressions', () => {
        expect(p("(letrec ((e (lambda (x) x))) (e 2))")).toSatisfy(isOkT(isLetrecExp));
    });

    it('parses "letrec" expressions with type annotations', () => {
        expect(p("(letrec (((p : (number * number -> number)) (lambda ((x : number) (y : number)) (+ x y)))) (p 1 2))")).toSatisfy(isOkT(isLetrecExp));
    });

    it('parses "set!" expressions', () => {
        expect(p("(set! x 1)")).toSatisfy(isOkT(isSetExp));
    });
});

describe('L5 Unparse', () => {
    const roundTrip = (x: string): Result<string> => bind(p(x), unparse);

    it('unparses "define" expressions with type annotations', () => {
        const define = "(define (a : number) 1)";
        expect(roundTrip(define)).toEqual(makeOk(define));
    });

    it('unparses procedures with type annotations', () => {
        const lambda = "(lambda (x : number) : number (* x x))";
        expect(roundTrip(lambda)).toEqual(makeOk(lambda));
    });

    it('unparses "let" expressions with type annotations', () => {
        const let1 = "(let (((a : boolean) #t) ((b : number) 2)) (if a b (+ b b)))";
        expect(roundTrip(let1)).toEqual(makeOk(let1));
    });

    it('unparses "letrec" expressions', () => {
        const letrec = "(letrec (((p : (number * number -> number)) (lambda ((x : number) (y : number)) (+ x y)))) (p 1 2))";
        expect(roundTrip(letrec)).toEqual(makeOk(letrec));
    });
});

describe('L51 parse with unions', () => {
    // parse, unparse, remove-whitespace
    const roundTrip = (x: string): Result<string> => 
        bind(parseL5(x), (p: Program) =>
            mapv(unparse(p), (s: string) => 
                s.replace(/\s/g, "")));

    // Compare original string with round-trip (neutralizes white spaces)
    const testProgram = (x: string): Result<void> =>
            mapv(roundTrip(x), (rt: string) => {
                // console.log(`roundTrip success`);
                expect(x.replace(/\s/g, "")).toEqual(rt);
            });
    
    it('unparses union of atomic types in different positions: define, let, param, return types', () => {
        const dt1 = `
        (L5 
            (define (x : (union boolean number)) 1)
            (define (f : (number -> (union boolean number))) (lambda ((x : number)) : (union boolean number) 
                (if (> x 0) #f x))
            (let (((y : (union boolean number)) 0))
                (f y))
        )
        `;
        testProgram(dt1);
    });

});

describe('L51 parseTExp Union Parser', () => {
    it('parseTExp parses simple union expressions', () => {
        expect(pt("(union number string)")).toSatisfy(isOkT(isUnionTExp));
        mapv(pt("(union number string)"), (te: TExp) => 
            isUnionTExp(te) ? expect(te.components).toHaveLength(2) :
            te);
    });

    it('parseTExp parses embedded union expressions', () => {
        expect(pt("(union number (union boolean string))")).toSatisfy(isOkT(isUnionTExp));
        mapv(pt("(union number (union boolean string))"), (te: TExp) => 
            isUnionTExp(te) ? expect(te.components).toHaveLength(3) :
            te);
    });

    it('parseTExp parses embedded union expressions removes duplicates', () => {
        expect(pt("(union number (union number string))")).toSatisfy(isOkT(isUnionTExp));
        mapv(pt("(union number (union number string))"), (te: TExp) => 
            isUnionTExp(te) ? expect(te.components).toHaveLength(2) :
            te);
    });

    it('parseTExp parses embedded union expressions removes duplicates and normalizes', () => {
        expect(pt("(union number (union number number))")).toSatisfy(isOkT(isNumTExp));
    });

    it('parseTExp parses union types in return type argument position', () => {
        const te = "(number * number -> (union boolean number))";
        mapv(pt(te), (te: TExp) => {
            expect(te).toSatisfy(isProcTExp);
            if (isProcTExp(te)) {
                expect(te.returnTE).toSatisfy(isUnionTExp);
                if (isUnionTExp(te.returnTE)) {
                    expect(te.returnTE.components).toHaveLength(2);
                }
            }
        })
    });

    it('parseTExp parses union types in proc argument position', () => {
        const te = "((union number boolean) * number -> (union boolean number))";
        mapv(pt(te), (te: TExp) => {
            expect(te).toSatisfy(isProcTExp);
            if (isProcTExp(te)) {
                expect(te.paramTEs[0]).toSatisfy(isUnionTExp);
                if (isUnionTExp(te.paramTEs[0])) {
                    expect(te.paramTEs[0].components).toHaveLength(2);
                }
            }
        })
    });

    it('parseTExp fails to parse union of bad type expressions', () => {
        const bte = "(union (string * string))";
        expect(bind(pt(bte), (te: TExp) => makeOk(te))).toSatisfy(isFailure);
    });
});

// L52 Tests Begin
describe('L52 parse TExp extended and complex types', () => {
    it('Parse basic any expression', () => {
        expect(pt("any")).toSatisfy(isOkT(isAnyTExp));
    });

    it('Parse basic never expression', () => {
        expect(pt("never")).toSatisfy(isOkT(isNeverTExp));
    });

    it('parseTExp parses simple inter expressions', () => {
        expect(pt("(inter number string)")).toSatisfy(isOkT(isInterTExp));
        mapv(pt("(inter number string)"), (te: TExp) => 
            isInterTExp(te) ? expect(te.components).toHaveLength(2) :
            te);
    });

    it('parseTExp parses embedded inter expressions', () => {
        expect(pt("(inter number (inter boolean string))")).toSatisfy(isOkT(isInterTExp));
        mapv(pt("(inter number (inter boolean string))"), (te: TExp) => 
            isInterTExp(te) ? expect(te.components).toHaveLength(3) :
            te);
    });

    it('parseTExp parses inter expressions with unions in DNF 2', () => {
        // n x (s + b) = ns + bn
        const te = "(inter number (union string boolean))";
        mapv(pt(te), (te: TExp) => {
            expect(te).toSatisfy(isUnionTExp);
            if (isUnionTExp(te)) {
                expect(te.components).toHaveLength(2);
                expect(te.components[0]).toSatisfy(isInterTExp);
                expect(te.components[1]).toSatisfy(isInterTExp);
            }
        });
    });

    it('parseTExp fails to parse inter of bad type expressions', () => {
        const bte = "(inter (string * string))";
        expect(bind(pt(bte), (te: TExp) => makeOk(te))).toSatisfy(isFailure);
    });
});

describe('L52 parse Type predicates', () => {
    const roundTrip = (x: string): Result<string> => 
        bind(parseL5(x), (p: Program) =>
            mapv(unparse(p), (s: string) => 
                s.replace(/\s/g, "")));

    // Compare original string with round-trip (neutralizes white spaces)
    const testProgram = (x: string): Result<void> =>
            mapv(roundTrip(x), (rt: string) => {
                // console.log(`roundTrip success`);
                expect(x.replace(/\s/g, "")).toEqual(rt);
            });
    
    it('Basic type predicate test', () => {
        const dt1 = `
        (L5 
            (define (number_pred : (any -> is? number)) (lambda ((x : any)) : is? number (number? x))
        )
        `;
        testProgram(dt1);
    });
});

// L52 Tests End