// L5-typecheck
// ========================================================
import { equals, map, zipWith } from 'ramda';
import { isAppExp, isBoolExp, isDefineExp, isIfExp, isLetrecExp, isLetExp, isNumExp,
         isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, parseL5Exp, unparse,
         AppExp, BoolExp, DefineExp, Exp, IfExp, LetrecExp, LetExp, NumExp,
         Parsed, PrimOp, ProcExp, Program, StrExp, parseL5Program, VarRef } from "./L5-ast";
import { applyTEnv, makeEmptyTEnv, makeExtendTEnv, TEnv } from "./TEnv";
import { isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeStrTExp, makeVoidTExp,
         parseTE, unparseTExp, makeUnionTExp,
         BoolTExp, NumTExp, StrTExp, TExp, VoidTExp, isSubType, 
         isPredicateTExp,
         isPredicateResultTExp,
         makePredicateTExp, isExtProcTExp, makeDiffTExp,
         parsePredExp} from "./TExp";
import { isEmpty, allT, first, rest, NonEmptyList, List, isNonEmptyList } from '../shared/list';
import { Result, makeFailure, bind, makeOk, zipWithResult, either } from '../shared/result';
import { parse as p } from "../shared/parser";
import { format } from '../shared/format';

// Purpose: Check that type expressions are compatible
// as part of a fully-annotated type check process of exp.
// Return an error if te1 is not compatible with te2 - true otherwise.
// Exp is only passed for documentation purposes.
// Cases to consider:
// TVar is compatible with itself or a union that contains it - any other fail
// Atomic is compatible with itself or a union that contains it - any other fail
// Union is compatible with any union that contains it 
// ProcTExp is compatible with other ProcTExp according to rules of (3.2.4)
// Union[TEs] contains TE if TE is compatible with one of the TEs
// Union[TEs1] contains Union[TEs2] if Union[TEs1] contains all elements of Union[TEs2]
export const checkCompatibleType = (te1: TExp, te2: TExp, exp: Exp): Result<true> =>
  isSubType(te1, te2) ? makeOk(true) :
  bind(unparseTExp(te1), (te1: string) =>
    bind(unparseTExp(te2), (te2: string) =>
        bind(unparse(exp), (exp: string) => 
            makeFailure<true>(`Incompatible types: ${te1} and ${te2} in ${exp}`))));

// Compute the type of L5 AST exps to TE
// ===============================================
// Compute a Typed-L5 AST exp to a Texp on the basis
// of its structure and the annotations it contains.

// Purpose: Compute the type of a concrete fully-typed expression
export const L5typeof = (concreteExp: string): Result<string> =>
    bind(p(concreteExp), (x) =>
        bind(parseL5Exp(x), (e: Exp) => 
            bind(typeofExp(e, makeEmptyTEnv()), unparseTExp)));

export const L5typeofProgram = (concreteExp: string): Result<string> =>
    bind(p(concreteExp), (x) =>
        bind(parseL5Program(x), (e: Program) => 
            bind(typeofProgram(e, makeEmptyTEnv()), unparseTExp)));

// Purpose: Compute the type of an expression
// Traverse the AST and check the type according to the exp type.
// We assume that all variables and procedures have been explicitly typed in the program.
export const typeofExp = (exp: Parsed, tenv: TEnv): Result<TExp> =>
    isNumExp(exp) ? makeOk(typeofNum(exp)) :
    isBoolExp(exp) ? makeOk(typeofBool(exp)) :
    isStrExp(exp) ? makeOk(typeofStr(exp)) :
    isPrimOp(exp) ? typeofPrim(exp) :
    isVarRef(exp) ? applyTEnv(tenv, exp.var) :
    isIfExp(exp) ? typeofIf(exp, tenv) :
    isProcExp(exp) ? typeofProc(exp, tenv) :
    isAppExp(exp) ? typeofApp(exp, tenv) :
    isLetExp(exp) ? typeofLet(exp, tenv) :
    isLetrecExp(exp) ? typeofLetrec(exp, tenv) :
    isDefineExp(exp) ? typeofDefine(exp, tenv) :
    isProgram(exp) ? typeofProgram(exp, tenv) :
    // TODO: isSetExp(exp) isLitExp(exp)
    makeFailure(`Unknown type: ${format(exp)}`);

// Purpose: Compute the type of a sequence of expressions
// Check all the exps in a sequence - return type of last.
// Pre-conditions: exps is not empty.
export const typeofExps = (exps: List<Exp>, tenv: TEnv): Result<TExp> =>
    isNonEmptyList<Exp>(exps) ? 
        isEmpty(rest(exps)) ? typeofExp(first(exps), tenv) :
        bind(typeofExp(first(exps), tenv), _ => typeofExps(rest(exps), tenv)) :
    makeFailure(`Unexpected empty list of expressions`);


// a number literal has type num-te
export const typeofNum = (n: NumExp): NumTExp => makeNumTExp();

// a boolean literal has type bool-te
export const typeofBool = (b: BoolExp): BoolTExp => makeBoolTExp();

// a string literal has type str-te
const typeofStr = (s: StrExp): StrTExp => makeStrTExp();

// primitive ops have known proc-te types
const numOpTExp = parseTE('(number * number -> number)');
const numCompTExp = parseTE('(number * number -> boolean)');
const boolOpTExp = parseTE('(boolean * boolean -> boolean)');

// Todo: cons, car, cdr, list
export const typeofPrim = (p: PrimOp): Result<TExp> =>
    (p.op === '+') ? numOpTExp :
    (p.op === '-') ? numOpTExp :
    (p.op === '*') ? numOpTExp :
    (p.op === '/') ? numOpTExp :
    (p.op === 'and') ? boolOpTExp :
    (p.op === 'or') ? boolOpTExp :
    (p.op === '>') ? numCompTExp :
    (p.op === '<') ? numCompTExp :
    (p.op === '=') ? numCompTExp :
    // Important to use a different signature for each op with a TVar to avoid capture
    // should be any or T?
    (p.op === 'number?') ? parsePredExp(["any", "->", "is?" ,"number"]) :
    (p.op === 'boolean?') ? parsePredExp(["any", "->", "is?" ,"boolean"]) :
    (p.op === 'string?') ? parsePredExp(["any", "->", "is?" ,"string"]) :
    (p.op === 'list?') ? parsePredExp(["any", "->", "is?" ,"list"]) :
    (p.op === 'pair?') ? parsePredExp(["any", "->", "is?" ,"pair"]) :
    (p.op === 'symbol?') ? parsePredExp(["any", "->", "is?" ,"symbol"]) :
    (p.op === 'not') ? parseTE('(boolean -> boolean)') :
    (p.op === 'eq?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'string=?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'display') ? parseTE('(T -> void)') :
    (p.op === 'newline') ? parseTE('(Empty -> void)') :
    makeFailure(`Primitive not yet implemented: ${p.op}`);

export const makeUnion = (te1: TExp, te2: TExp): TExp =>
    isSubType(te1, te2) ? te2 :
    isSubType(te2, te1) ? te1 : 
    makeUnionTExp([te1, te2]);

// Purpose: compute the type of an if-exp that is not a Type predicate
// Typing rule:
//   if type<test>(tenv) = boolean
//      type<then>(tenv) = t1
//      type<else>(tenv) = t1
// then type<(if test then else)>(tenv) = t1
export const typeofIfNormal = (ifExp: IfExp, tenv: TEnv): Result<TExp> => {
    const testTE = typeofExp(ifExp.test, tenv);
    const thenTE = typeofExp(ifExp.then, tenv);
    const altTE = typeofExp(ifExp.alt, tenv);
    const constraint1 = bind(testTE, testTE => checkCompatibleType(testTE, makeBoolTExp(), ifExp));
    // L51
    const constraint2 = bind(thenTE, (thenTE: TExp) =>
                            bind(altTE, (altTE: TExp) =>
                                makeOk(makeUnion(thenTE, altTE))));
    return bind(constraint1, (_c1: true) =>
                constraint2);
};


// /*
//   IF TEST PRED:
//         then - tenv = union (tenv , x:number)
//         alt -  tenv = makeDiff(tenv, x:number)
// */
// L52 Structured methods
/**
 * Check if the expression is a type predicate application.
 * @param e The expression to check.
 * @param tenv The type environment.
 * @returns A result containing the predicate, variable, and type expression if valid; otherwise, an error.
 */
export const isTypePredApp = (e: Exp, tenv: TEnv): Result<{ pred: AppExp, var: VarRef, texp: TExp }> => {
    if (isAppExp(e) && isVarRef(e.rator) && e.rands.length === 1 && isVarRef(e.rands[0])) {
        const pred = e.rator.var;
        const variable = e.rands[0];
        return bind(applyTEnv(tenv, pred), (texp: TExp) => {
            if (isPredicateTExp(texp)) {
                return makeOk({ pred: e, var: variable, texp: texp.predProc.returnTE });
            } else {
                return makeFailure<{ pred: AppExp, var: VarRef, texp: TExp }>(`Predicate application expected: ${JSON.stringify(e)}`);
            }
        });
    } else {
        return makeFailure<{ pred: AppExp, var: VarRef, texp: TExp }>(`Invalid predicate application: ${JSON.stringify(e)}`);
    }
};

// Purpose: compute the type of an if-exp that is a Type predicate or a normal if
export const typeofIf = (ifExp: IfExp, tenv: TEnv): Result<TExp> =>
    either(
        isTypePredApp(ifExp.test, tenv),
        ({ pred, var: variable, texp }) => {
            const extendedTEnvThen = makeExtendTEnv([variable.var], [texp], tenv);
            const constraint1 = typeofExp(ifExp.then, extendedTEnvThen);
            const extendedTEnvAlt = makeExtendTEnv([variable.var], [makeDiffTExp(texp, texp)], tenv);  // Ensure proper use of makeDiffTExp
            const constraint2 = typeofExp(ifExp.alt, extendedTEnvAlt);
            return bind(constraint1, (thenTE: TExp) =>
                bind(constraint2, (altTE: TExp) => {
                    return makeOk(makeUnion(thenTE, altTE))})
            );
        },
        () => {
            return typeofIfNormal(ifExp, tenv);  // Fallback to normal if expression type checking
        }
    );



// Purpose: compute the type of a proc-exp
// Typing rule:
// If   type<body>(extend-tenv(x1=t1,...,xn=tn; tenv)) = t
// then type<lambda (x1:t1,...,xn:tn) : t exp)>(tenv) = (t1 * ... * tn -> t)
export const typeofProc = (proc: ProcExp, tenv: TEnv): Result<TExp> => {
    const argsTEs = map((vd) => vd.texp, proc.args);
    const extTEnv = makeExtendTEnv(map((vd) => vd.var, proc.args), argsTEs, tenv);
    const constraint1 = bind(typeofExps(proc.body, extTEnv), (body: TExp) => 
                            checkCompatibleType(body, proc.returnTE, proc));
    return bind(constraint1, _ => makeOk(isPredicateResultTExp(proc.returnTE) ?  makePredicateTExp(makeProcTExp(argsTEs, proc.returnTE))
    : makeProcTExp(argsTEs, proc.returnTE)));
};

// Purpose: compute the type of an app-exp
// Typing rule:
// If   type<rator>(tenv) = (t1*..*tn -> t)
//      type<rand1>(tenv) = t1
//      ...
//      type<randn>(tenv) = tn
// then type<(rator rand1...randn)>(tenv) = t
// We also check the correct number of arguments is passed.
export const typeofApp = (app: AppExp, tenv: TEnv): Result<TExp> => {
    //console.log(`appexp is ${JSON.stringify(app)} env is ${JSON.stringify(tenv)}`)
    return bind(typeofExp(app.rator, tenv), (ratorTE: TExp) => {
        if (! isExtProcTExp(ratorTE)) {
            return bind(unparseTExp(ratorTE), (rator: string) =>
                        bind(unparse(app), (exp: string) =>
                            makeFailure<TExp>(`Application of non-procedure: ${rator} in ${exp}`)));
        }
        if(isPredicateTExp(ratorTE))
        {
            if (app.rands.length !== ratorTE.predProc.paramTEs.length) {
                return bind(unparse(app), (exp: string) => makeFailure<TExp>(`Wrong parameter numbers passed to proc: ${exp}`));
            }
            const constraints = zipWithResult((rand, trand) => bind(typeofExp(rand, tenv), (typeOfRand: TExp) => 
                checkCompatibleType(typeOfRand, trand, app)),
            app.rands, ratorTE.predProc.paramTEs);
            return bind(constraints, _ => makeOk(ratorTE.predProc.returnTE));
        }
        else
        {
            if (app.rands.length !== ratorTE.paramTEs.length) {
                return bind(unparse(app), (exp: string) => makeFailure<TExp>(`Wrong parameter numbers passed to proc: ${exp}`));
            }
            const constraints = zipWithResult((rand, trand) => bind(typeofExp(rand, tenv), (typeOfRand: TExp) => 
                            checkCompatibleType(typeOfRand, trand, app)),
            app.rands, ratorTE.paramTEs);
            return bind(constraints, _ => makeOk(ratorTE.returnTE));
        }
    });
}

// Purpose: compute the type of a let-exp
// Typing rule:
// If   type<val1>(tenv) = t1
//      ...
//      type<valn>(tenv) = tn
//      type<body>(extend-tenv(var1=t1,..,varn=tn; tenv)) = t
// then type<let ((var1 val1) .. (varn valn)) body>(tenv) = t
export const typeofLet = (exp: LetExp, tenv: TEnv): Result<TExp> => {
    const vars = map((b) => b.var.var, exp.bindings);
    const vals = map((b) => b.val, exp.bindings);
    const varTEs = map((b) => b.var.texp, exp.bindings);
    const constraints = zipWithResult((varTE, val) => bind(typeofExp(val, tenv), (typeOfVal: TExp) => 
                                                            checkCompatibleType(varTE, typeOfVal, exp)),
                                      varTEs, vals);
    return bind(constraints, _ => typeofExps(exp.body, makeExtendTEnv(vars, varTEs, tenv)));
};


// Purpose: compute the type of a letrec-exp
// We make the same assumption as in L4 that letrec only binds proc values.
// Typing rule:
//   (letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)
//   tenv-body = extend-tenv(p1=(t11*..*t1n1->t1)....; tenv)
//   tenvi = extend-tenv(xi1=ti1,..,xini=tini; tenv-body)
// If   type<body1>(tenv1) = t1
//      ...
//      type<bodyn>(tenvn) = tn
//      type<body>(tenv-body) = t
// then type<(letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)>(tenv-body) = t
export const typeofLetrec = (exp: LetrecExp, tenv: TEnv): Result<TExp> => {
    const ps = map((b) => b.var.var, exp.bindings);
    const procs = map((b) => b.val, exp.bindings);
    if (! allT(isProcExp, procs))
        return makeFailure(`letrec - only support binding of procedures - ${format(exp)}`);
    const paramss = map((p) => p.args, procs);
    const bodies = map((p) => p.body, procs);
    const tijs = map((params) => map((p) => p.texp, params), paramss);
    const tis = map((proc) => proc.returnTE, procs);
    const tenvBody = makeExtendTEnv(ps, zipWith((tij, ti) => makeProcTExp(tij, ti), tijs, tis), tenv);
    const tenvIs = zipWith((params, tij) => makeExtendTEnv(map((p) => p.var, params), tij, tenvBody),
                           paramss, tijs);
    const types = zipWithResult((bodyI, tenvI) => typeofExps(bodyI, tenvI), bodies, tenvIs)
    const constraints = bind(types, (types: TExp[]) => 
                            zipWithResult((typeI, ti) => checkCompatibleType(typeI, ti, exp), types, tis));
    return bind(constraints, _ => typeofExps(exp.body, tenvBody));
};

// Typecheck a full program
// TODO: Thread the TEnv (as in L1)

// Purpose: compute the type of a define
// Typing rule:
//   (define (var : texp) val)
// TODO - write the true definition
export const typeofDefine = (exp: DefineExp, tenv: TEnv): Result<VoidTExp> =>
    bind(typeofExp(exp.val, makeExtendTEnv([exp.var.var], [exp.var.texp], tenv)),
         _ => makeOk(makeVoidTExp()));



// Purpose: compute the type of a program
// Typing rule: 
// We use the same technique to update TEnv as we did for Env in the L2 interpreter.
export const typeofProgram = (exp: Program, tenv: TEnv): Result<TExp> =>
    typeofSequence(exp.exps, tenv);

// Purpose: Compute the type of a sequence of expressions
// Check all the exps in a sequence - return type of last.
// Thread the tenv when meeting a defineExp
// Pre-conditions: exps is not empty.
export const typeofSequence = (seq: List<Exp>, tenv: TEnv): Result<TExp> =>
    isNonEmptyList<Exp>(seq) ? typeofSequenceFirst(first(seq), rest(seq), tenv) :
    makeFailure("Empty sequence");
    
const typeofSequenceFirst = (first: Exp, rest: Exp[], tenv: TEnv): Result<TExp> =>
    isEmpty(rest) ? typeofExp(first, tenv) :
    isDefineExp(first) ? typeofDefineExps(first, rest, tenv) :
    // _ is a don't care parameter
    bind(typeofExp(first, tenv), _ => 
         typeofSequence(rest, tenv));

// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const typeofDefineExps = (def: DefineExp, exps: Exp[], tenv: TEnv): Result<TExp> =>
    bind(typeofDefine(def, tenv), (_) => 
         typeofSequence(exps, makeExtendTEnv([def.var.var], [def.var.texp], tenv)));