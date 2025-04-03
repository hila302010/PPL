/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).


% Ensure the argument is a list
list([]).
list([X|Xs]) :- list(Xs). 

append([], Xs, Xs):-list(Xs).
append([X | Xs], Ys, [X | Zs]) :- append(Xs, Ys, Zs).

% Define the Church numerals
natural_number(zero).
natural_number(st(X)):-natural_number(X).


% Signature: path(Node1, Node2, Path)/3
% Purpose: Path is a path, denoted by a list of nodes, from Node1 to Node2.
path(Node1, Node2, [Node1 , Node2]) :- edge(Node1, Node2).
path(Node1, Node2, [Node1 | Path]) :-
    edge(Node1, NextNode),
    path(NextNode, Node2, Path).


% Signature: cycle(Node, Cycle)/2
% Purpose: Cycle is a cyclic path, denoted a list of nodes, from Node1 to Node1.
cycle(Node, Path) :-
    cycle(Node, Node, [Node], Path).

cycle(Node, Node, Visited, Path) :-
    length(Visited, Len),
    Len > 1,
    Path = Visited.

cycle(Node, Node2, Visited, Path) :-
    edge(Node2, NextNode),
    append(Visited, [NextNode], NewVisited),
    cycle(Node, NextNode, NewVisited, Path).

% Signature: reverse(Graph1, Graph2)/2
% Purpose: The edges in Graph1 are reversed in Graph2 while preserving the order.
reverse(Graph1, Graph2) :-
    reverse_edges(Graph1, Graph2, []).

reverse_edges([], Acc, Acc).
reverse_edges([[From, To] | Rest], [[To, From] | Acc], Graph2) :-
    reverse_edges(Rest, Acc, Graph2).


% Define the degree predicate
% Signature: degree(Node, Graph, Degree)/3
% Purpose: Degree is the degree of node Node, denoted by a Church number (as defined in class)
degree(Node, Graph, Degree) :-
    count_edges(Node, Graph, 0, Count),
    to_number(Count, Degree).

% Helper predicate to count edges connected to Node
count_edges(_, [], Count, Count).
count_edges(Node, [[Node, _] | Rest], Acc, Count) :-
    NewAcc is Acc + 1,
    count_edges(Node, Rest, NewAcc, Count).
count_edges(Node, [_ | Rest], Acc, Count) :-
    count_edges(Node, Rest, Acc, Count).

% Helper predicate to convert an integer to a Church numeral
to_number(0, zero).
to_number(N, s(Num)) :-
    N > 0,
    N1 is N - 1,
    to_number(N1, Num).









