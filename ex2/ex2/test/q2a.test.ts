import { expect } from 'chai';
import { unparseL3, parseL3, parseL3Exp } from '../L3/L3-ast';
import { lexTransform } from '../L3/LexicalTransformations';
import { makeOk, bind, isFailure } from '../shared/result';
import { parse as p } from "../shared/parser";



describe('Q2A Tests', () => {
     it('test parse/unparse class', () => {
          expect(bind(bind(p(`
          (class (a b) 
            ((first (lambda () a)) 
             (second (lambda () b)) 
             (sum (lambda () (+ a b)))))`),parseL3Exp), x=>makeOk(unparseL3(x)))).to.deep.equal(makeOk(`(class (a b) ((first (lambda () a)) (second (lambda () b)) (sum (lambda () (+ a b)))))`));
         });

     it('test parse wrong class', () => {
          expect(bind(p(`(class ((first (lambda () a)) (second (lambda () b)) (sum (lambda () (+ a b)))))`),parseL3Exp)).is.satisfy(isFailure);
     });


     it('test parse/unparse program', () => {
          expect(bind(parseL3(`(L3 (define pair (class (a b) ((first (lambda () a)) (second (lambda () b)) (sum (lambda () (+ a b)))))) (let ((p12 (pair 1 2)) (p34 (pair 3 4))) (if (> (p12 'first) (p34 'second)) #t #f)))`), x=>makeOk(unparseL3(x)))).to.deep.equal(makeOk(`(L3 (define pair (class (a b) ((first (lambda () a)) (second (lambda () b)) (sum (lambda () (+ a b)))))) (let ((p12 (pair 1 2)) (p34 (pair 3 4))) (if (> (p12 'first) (p34 'second)) #t #f)))`));
         });  
});