#lang racket

;;(require seq)
;;(require seq/base)

(provide (all-defined-out))

(define id (lambda (x) x))
(define cons-lzl cons)
(define empty-lzl? empty?)
(define empty-lzl '())
(define head car)
(define tail
  (lambda (lzl)
    ((cdr lzl))))

(define integers-from
  (lambda (n)
    (cons-lzl n (lambda () (integers-from (+ n 1))))))

; Signature: compose(f g)
; Type: [T1 -> T2] * [T2 -> T3]  -> [T1->T3]
; Purpose: given two unary functions return their composition, in the same order left to right
; test: ((compose - sqrt) 16) ==> -4
;       ((compose not not) true)==> true
(define compose
  (lambda (f g)
    (lambda (x)
       (g (f x)))))


; Signature: pipe(lst-fun)
; Type: [[T1 -> T2],[T2 -> T3]...[Tn-1 -> Tn]]  -> [T1->Tn]
; Purpose: Returns the composition of a given list of unary functions. For (pipe (list f1 f2 ... fn)), returns the composition fn(....(f1(x)))
; test: ((pipe (list sqrt - - number?)) 16)) ==> true
;       ((pipe (list sqrt - - number? not)) 16) ==> false
;       ((pipe (list sqrt add1 - )) 100) ==> -11
(define pipe
  (lambda (fs)  
    (if (empty? (cdr fs))
        (car fs)
        (compose (car fs) (pipe (cdr fs))))))

(define compose$
  (lambda (f$ g$ cont1)
    (cont1 (lambda (x cont2)
                (f$ x (lambda (res) (g$ res cont2)))))))

(define compose$
  (lambda (f$ g$ cont1)
    (cont1 (lambda (x cont2) 
              (f$ x 
                (lambda (f-res) (g$ f-res cont2)))))))


; Signature: pipe$(lst-fun,cont)
;         [T1 * [T2->T3] ] -> T3,
;         [T3 * [T4 -> T5] ] -> T5,
;         ...,
;         [T2n-1 * [T2n * T2n+1]] -> T2n+1
;        ]
;        *
;       [[T1 * [T2n -> T2n+1]] -> T2n+1] -> 
;              [[T1 * [T2n+1 -> T2n+2]] -> T2n+2]
;      -> [T1 * [T2n+3 -> T2n+4]] -> T2n+4
; Purpose: Returns the composition of a given list of unry CPS functions. 

(define pipe$
  (lambda (fs cont1)  
    (if (empty? (cdr fs))
        (cont1 (lambda (x cont2) ((car fs) x cont2)))
        (pipe$ (cdr fs) (lambda (res) (compose$ (car fs) res cont1))))))

(define pipe$
  (lambda (fs cont)  
    (if (empty? (cdr fs))
        (cont (car fs))
        (pipe$ (cdr fs) (lambda (pipe-res) (compose$ (car fs) pipe-res cont))))))

 (define map
    (lambda (f lst)
          (if (empty? lst)
              lst
              (cons (f (car lst)) (map f (cdr lst))))))

(define map$
    (lambda (f$ lst cont)
        (if (empty? lst)
            (cont lst)
            (f$ (car lst)
              (lambda (f-car-res)
                (map$ f$ (cdr lst)
                  (lambda (map-f-cdr-res)
                    (cont (cons f-car-res map-f-cdr-res)))))))))



; Signature: reduce-prim$(reducer, init, lst, cont)
; Type: [[T1*T2->T1] * T1 * Lst<T2> * T1->T3] -> T3
; Purpose: Returns the reduced value of the given list, from left 
;          to right, with cont post-processing
; Pre-condition: reducer is primitive
; test: (reduce-prim$ + 0 '( 8 2 2) (lambda (x) x))==> 15
;      (reduce-prim$ * 1 '(1 2 3 4 5) (lambda (x) x)) ==> 120
;      (reduce-prim$ - 1 '(1 2 3 4 5) (lambda (x) x))==> -14
(define reduce-prim$
  (lambda (reducer$ init lst cont)
    (if (empty? lst)
        (cont init)
         (reduce-prim$ reducer$ init (cdr lst)
              (lambda (res)
                   (cont (reducer$ res (car lst))) )))))

; Signature: reduce-user$(reducer, init, lst, cont)
; Type: [[T1*T2*[T1->T1]->T1] * T1 * Lst<T2> * T1->T1] -> T1
; Purpose: Returns the reduced value of the given list, from left 
;          to right, with cont post-processing
; Pre-condition: reducer is a CPS user prococedure
; test: (reduce-user$ plus$ 0 '(3 8 2 2) (lambda (x) x)) ==> 15
;        (reduce-user$ div$ 100 '(5 4 1) (lambda (x) (* x 2))) ==> 10
(define reduce-user$
  (lambda (reducer$ init lst cont)
    (if (empty? lst)
        (cont init)
        (reducer$ init (car lst)
              (lambda (res)
                 (reduce-user$ reducer$ res (cdr lst) cont))))))

; Signature: take1(lz-lst,pred)
; Type: [LzL<T>*[T -> boolean] -> List<T>]
; Purpose: while pred holds return the list elments
; Tests: (take-while (integers-from 0) (lambda (x) (< x 9)))==>'(0 1 2 3 4 5 6 7 8)
;         (take-while (integers-from 0) (lambda (x)  (= x 128))))==>'()
(define take-while
  (lambda (lz-lst pred)
    (if (or (empty-lzl? lz-lst)
             (not (pred (head lz-lst))))
        '()
	(cons (head lz-lst) (take-while (tail lz-lst) pred)))))

; Signature: take-while-lzl(lz-lst,pred)
; Type: [LzL<T>*[T -> boolean] -> Lzl<T>]
; Purpose: while pred holds return list elments as a lazy list
; Tests: (take (take-while-lzl (integers-from 0) (lambda (x) (< x 9))) 10) ==>'(0 1 2 3 4 5 6 7 8)
;        (take-while-lzl(integers-from 0) (lambda (x)  (= x 128))))==>'()
(define take-while-lzl
  (lambda (lz-lst pred)
    (if (or (empty-lzl? lz-lst)
             (not (pred (head lz-lst))))
        empty-lzl
	(cons-lzl (head lz-lst) (lambda () (take-while-lzl (tail lz-lst) pred))))))


; Signature: reduce1-lzl(reducer, init, lzl)
; Type: [T2*T1 -> T2] * T2 * LzL<T1> -> T2
; Purpose: Returns the reduced value of the given lazy list
; test:(reduce-lzl + 0 (cons-lzl 3 (lambda () (cons-lzl 8 (lambda () '())))))==>11
;(reduce-lzl / 6 (cons-lzl 3 (lambda () (cons-lzl 2 (lambda () '())))))==> 1
(define reduce-lzl
  (lambda (reducer init lzl)
    (if (empty-lzl? lzl)
        init
        (reduce-lzl reducer
                 (reducer init (head lzl))
                 (tail lzl)))))



