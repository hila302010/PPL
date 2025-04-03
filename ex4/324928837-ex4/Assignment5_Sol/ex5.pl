append([], Xs, Xs).
append([X|Xs], Y, [X|Zs] ) :- append(Xs, Y, Zs).

member(X, [X|_]).
member(X, [_|Ys]) :- member(X, Ys).

not_member(_, []).
not_member(X, [Y|Ys]):- X \= Y, not_member(X,Ys).

unique(L1,ND,D):- list2sets(L1,[],[],ND,D).

list2sets([X|Xs],NDAcc,DAcc,ND,D):-not_member(X,NDAcc),append(NDAcc,[X],NDAccNew),list2sets(Xs,NDAccNew,DAcc,ND,D).
list2sets([X|Xs],NDAcc,DAcc,ND,D):-member(X,NDAcc),append(DAcc,[X],DAccNew),list2sets(Xs,NDAcc,DAccNew,ND,D).
list2sets([],ND,D,ND,D).
