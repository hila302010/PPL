import { expect } from 'chai';
import {  evalL3program } from '../L3/L3-eval-env';
import { SExpValue, Value, isSExp, valueToString } from "../L3/L3-value";
import { Result, bind, isOk, makeOk, makeFailure } from "../shared/result";
import { parseL3} from "../L3/L3-ast";


const evalP = (x: string): Result<Value> =>
    bind(parseL3(x), evalL3program);

const evalP2String = (x: string): string => {
    const res : Result<SExpValue> = bind(parseL3(x), evalL3program);
    return isOk(res) ? valueToString(res.value) : res.message;
}

describe('Q2B Tests for environment model', () => {
    
    it("Test class definition", () => {
        expect(evalP2String(`
        (L3
         (define pair 
            (class (a b) 
               ((first (lambda () a)) 
                (second (lambda () b))
                (sum (lambda () (+ a b)))
                (scale (lambda (k) (pair (* k a) (* k b))))
               )
             )
         )
         pair
        )`)).to.deep.equal("Class");
    });

    it("Test object definition", () => {
        expect(evalP2String(`
        (L3
            (define pair 
               (class (a b) 
                  ((first (lambda () a)) 
                   (second (lambda () b))
                   (sum (lambda () (+ a b)))
                   (scale (lambda (k) (pair (* k a) (* k b))))
                  )
                )
            )
            (define p34 (pair 3 4))
            p34
        )
        `)).to.deep.equal("Object");
    });    
    
    it("Test object methods application", () => {

        expect(evalP(`
        (L3
            (define pair 
               (class (a b) 
                  ((first (lambda () a)) 
                   (second (lambda () b))
                   (sum (lambda () (+ a b)))
                   (scale (lambda (k) (pair (* k a) (* k b))))
                  )
                )
            )
            (define p34 (pair 3 4))
            (p34 'first)
        )
        `)).to.deep.equal(makeOk(3));

        expect(evalP(`
        (L3
            (define pair 
               (class (a b) 
                  ((first (lambda () a)) 
                   (second (lambda () b))
                   (sum (lambda () (+ a b)))
                   (scale (lambda (k) (pair (* k a) (* k b))))
                  )
                )
            )
            (define p34 (pair 3 4))
            (p34 'second)
        )
        `)).to.deep.equal(makeOk(4));

        expect(evalP(`
        (L3
            (define pair 
               (class (a b) 
                  ((first (lambda () a)) 
                   (second (lambda () b))
                   (sum (lambda () (+ a b)))
                   (scale (lambda (k) (pair (* k a) (* k b))))
                  )
                )
            )
            (define p34 (pair 3 4))
            (p34 'sum)
        )
        `)).to.deep.equal(makeOk(7));

    });    

    it("Test object methods application with parameters", () => {

    expect(evalP(`
    (L3
        (define pair 
           (class (a b) 
              ((first (lambda () a)) 
               (second (lambda () b))
               (sum (lambda () (+ a b)))
               (scale (lambda (k) (pair (* k a) (* k b))))
              )
            )
        )
        (define p34 (pair 3 4))
        ((p34 'scale 2) 'second)
    )
    `)).to.deep.equal(makeOk(8));
});

it("Test unknown methods application for environment model", () => {

    expect(evalP(`
    (L3
        (define pair 
          (class (a b) 
           ((first (lambda () a)) 
            (second (lambda () b))
            (sum (lambda () (+ a b)))
            (scale (lambda (k) (pair (* k a) (* k b))))
           )
          )
        )
        (define p34 (pair 3 4))
        (p34 'power)
    )
    
`)).to.deep.equal(makeFailure("Unrecognized method: power"));

});

it("Test unknown field in methods application", () => {

    expect(evalP(`
    (L3
      (define pair 
        (class (a b) 
           ((first (lambda () a)) 
            (second (lambda () b))
            (sum (lambda () (+ a c)))
            (scale (lambda (k) (pair (* k a) (* k b))))
           )
        )
      )
      (define p34 (pair 3 4))
      (p34 'sum)
    )
`)).to.deep.equal(makeFailure("var not found: c"));

});

it("Test nested object methods application", () => {

    expect(evalP(`
    (L3
        (
         (lambda (obj) (obj 'first))
         (
           (class (a b) 
              ((first (lambda () a)) 
               (second (lambda () b))
               (sum (lambda () (+ a b)))
               (scale (lambda (k) (pair (* k a) (* k b))))
              )
            )
            3 4
         )
       )
    )
    `)).to.deep.equal(makeOk(3));
     
});

 
});
