:- module('ex5',
        [author/2,
         genre/2,
         book/4
        ]).

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



author(1, "Isaac Asimov").
author(2, "Frank Herbert").
author(3, "William Morris").
author(4, "J.R.R Tolkein").


genre(1, "Science").
genre(2, "Literature").
genre(3, "Science Fiction").
genre(4, "Fantasy").

book("Inside The Atom", 1, 1, 500).
book("Asimov's Guide To Shakespeare", 1, 2, 400).
book("I, Robot", 1, 3, 450).
book("Dune", 2, 3, 550).
book("The Well at the World's End", 3, 4, 400).
book("The Hobbit", 4, 4, 250).
book("The Lord of the Rings", 4, 4, 1250).

% You can add more facts.
% Fill in the Purpose, Signature as requested in the instructions here


authorOfGenre(GenreName, AuthorName):-
    genre(GenreId, GenreName),
    book(_, AuthorId, GenreId, _),
    author(AuthorId, AuthorName).

longestBook(AuthorId, BookName):-
    findall(Length, book(_, AuthorId, _, Length), Lengths),
    max_list(Lengths, MaxLen),
    book(BookName, AuthorId, _, MaxLen).

versatileAuthor(AuthorName) :-
    author(AuthorId, AuthorName),
    findall(GenreId, book(_, AuthorId, GenreId, _), Genres),
    length(Genres, Len),
    Len >= 3.
