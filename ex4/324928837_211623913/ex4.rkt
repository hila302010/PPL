#lang racket

(provide (all-defined-out))

(define id (lambda (x) x))
(define cons-lzl cons)
(define empty-lzl? empty?)
(define empty-lzl '())
(define head car)
(define tail
  (lambda (lzl)
    ((cdr lzl))))

;;; Q1.a
; Signature: compose(f g)
; Type: [T1 -> T2] * [T2 -> T3]  -> [T1->T3]
; Purpose: given two unary functions return their composition, in the same order left to right
; test: ((compose - sqrt) 16) ==> -4
;       ((compose not not) true)==> true
(define compose
  (lambda (f g)
    (lambda (x)
       (g (f x)))))
       
(define compose$
  (lambda (f$ g$ cont1)
    (cont1 (lambda (x cont2) 
              (f$ x 
                (lambda (f-res) (g$ f-res cont2)))))))

; Signature: pipe(lst-fun)
; Type: [[T1 -> T2],[T2 -> T3]...[Tn-1 -> Tn]]  -> [T1->Tn]
; Purpose: Returns the composition of a given list of unary functions. For (pipe (list f1 f2 ... fn)), returns the composition fn(....(f1(x)))
; test: ((pipe (list sqrt - - number?)) 16) ==> true
;       ((pipe (list sqrt - - number? not)) 16) ==> false
;       ((pipe (list sqrt add1 - )) 100) ==> -11
(define pipe
  (lambda (fs)  
    (if (empty? (cdr fs))
        (car fs)
        (compose (car fs) (pipe (cdr fs))))))

; Signature: pipe$(lst-fun,cont)
; Type: [
;          [T1 * [T2->T3] ] -> T3,
;          [T3 * [T4 -> T5] ] -> T5,
;          ...,
;          [T2n-1 * [T2n * T2n+1]] -> T2n+1
;       ]
;        *
;       [[T1 * [T2n -> T2n+1]] -> T2n+1] -> 
;              [[T1 * [T2n+1 -> T2n+2]] -> T2n+2]
;      -> [T1 * [T2n+3 -> T2n+4]] -> T2n+4
; Purpose: Returns the composition of a given list of unry CPS functions. 
(define pipe$
  (lambda (fs cont)  
    (if (empty? (cdr fs))
        (cont (car fs))
        (pipe$ (cdr fs) (lambda (pipe-res) (compose$ (car fs) pipe-res cont))))))


;;; Q2a
; Signature: reduce1-lzl(reducer, init, lzl) 
; Type: [T2*T1 -> T2] * T2 * LzL<T1> -> T2
; Purpose: Returns the reduced value of the given lazy list
(define reduce1-lzl 
  (lambda (reducer init lzl)
      (if (empty-lzl? lzl)
        init
        (reduce1-lzl reducer (reducer init (head lzl)) (tail lzl))
      )
  )
)  



;;; Q2b
; Signature: reduce2-lzl(reducer, init, lzl, n) 
; Type: [T2*T1 -> T2] * T2 * LzL<T1> * Number -> T2
; Purpose: Returns the reduced value of the first n items in the given lazy list
(define reduce2-lzl 
  (lambda (reducer init lzl n)
    (if (empty-lzl? lzl)
        init
        (if (eq? n 0) 
          init
          (reduce2-lzl reducer (reducer init (head lzl)) (tail lzl) (- n 1))
        )
    )
  ) 
)  

;;; Q2c
; Signature: reduce3-lzl(reducer, init, lzl) 
; Type: [T2 * T1 -> T2] * T2 * LzL<T1> -> Lzl<T2>
; Purpose: Returns the reduced values of the given lazy list items as a lazy list
(define reduce3-lzl 
  (lambda (reducer init lzl)
    (if (empty-lzl? lzl)
      '()
      (cons-lzl (reducer init (head lzl)) (lambda () (reduce3-lzl reducer (reducer init (head lzl)) (tail lzl))))
    )
  )
)
 
;;; Q2e
; Signature: integers-steps-from(from,step) 
; Type: Number * Number -> Lzl<Number>
; Purpose: Returns a list of integers from 'from' with 'steps' jumps
(define integers-steps-from
  (lambda (from step)
     (cons-lzl from (lambda () (integers-steps-from (+ from step) step)))
  )
)


 (define lzl-map
 (lambda (f lzl)
 (if (empty-lzl? lzl)
 lzl
 (cons-lzl (f (head lzl))
 (lambda () (lzl-map f (tail lzl)))))))


 (define pi-sum
  (lambda (a b)
    (if (> a b)
        0
        (+ (/ 1 (* a (+ a 2)))
        (pi-sum (+ a 4) b)))))


;;; Q2f
; Signature: generate-pi-approximations() 
; Type: Empty -> Lzl<Number>
; Purpose: Returns the approximations of pi as a lazy list
(define generate-pi-approximations
  (lambda ()
    (lzl-map
      (lambda (x) (* x 8))
      (reduce3-lzl + 0
        (lzl-map
          (lambda (a) (/ 1 (* a (+ a 2))))
          (integers-steps-from 1 4))))
    )
)