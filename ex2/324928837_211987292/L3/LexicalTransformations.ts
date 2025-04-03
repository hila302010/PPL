import { ClassExp, ProcExp, Exp, Program, makeProcExp, Binding, CExp, makeVarDecl, makeIfExp, makeAppExp, makePrimOp, makeVarRef, makeBoolExp, makeStrExp, isExp, isProgram, isCExp, isDefineExp, makeDefineExp, isAtomicExp, isLitExp, isIfExp, isAppExp, isLetExp, isProcExp, isClassExp, makeProgram, makeLitExp } from "./L3-ast";
import { isEmpty, map } from "ramda";
import { isNonEmptyList, first, rest } from "../shared/list";
import { makeSymbolSExp } from "./L3-value";
import { Result, makeOk, mapv, makeFailure, bind, mapResult, isOk } from "../shared/result";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>
    makeProcExp(exp.fields, makeBody(exp.methods))
    
const makeBody = (methods: Binding[]) : CExp[]=>
    [makeProcExp([makeVarDecl("msg")], [buildIf(methods)])]

const buildIf = (methods: Binding[]) : CExp =>{
    if(isNonEmptyList<Binding>(methods))
    {
        const test : CExp = makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(first(methods).var.var))]); 
        const then : CExp = makeAppExp(first(methods).val, []);
        const alt : CExp = buildIf(rest(methods));
        return makeIfExp(test, then, alt);
    } 
    return makeBoolExp(false); 
}


/*
Purpose: Transform all class forms in the given AST to procs
Signature: lexTransform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>
    isExp(exp) ? makeOk(rewriteAllClassExp(exp)) :
    isProgram(exp) ? bind(makeOk(map(rewriteAllClassExp, exp.exps)), (res: Exp[]) => makeOk(makeProgram(res))) :
    makeFailure("Invalid input");

const rewriteAllClassExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllClassCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllClassCExp(exp.val)) :
    exp;

const rewriteAllClassCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllClassCExp(exp.test),
                                rewriteAllClassCExp(exp.then),
                                rewriteAllClassCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllClassCExp(exp.rator),
                                map(rewriteAllClassCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllClassCExp, exp.body)) :
    isClassExp(exp) ? rewriteAllClassCExp(class2proc(exp)) :
    exp;