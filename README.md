# Drill

Drill is a personal study app for learning mathematics through problem solving.
It keeps a record of your practice, tracks unfinished work, and schedules problems
to revisit. You solve the problems on paper; Drill handles the bookkeeping.

## Why it exists

Working through a textbook once doesn't mean I'll still know how to solve its
problems a month later. I can understand a technique, use it successfully through
a whole section, and then struggle to recognize when to use it again.

I wanted a study journal: a record of which problems I'd attempted, when I'd
worked on them, and how difficult they were. I also wanted to mark problems worth
revisiting and have them come back without maintaining a review schedule by hand.

I particularly liked [_Make It Stick_](https://www.makeitstick.com/), whose advice
helped shape the project: revisit material after a delay, attempt to retrieve what
you've learned, and interleave different topics. For my own practice, that means
solving a worthwhile problem a few times with gaps between attempts, and mixing
problems from different chapters so I have to decide which method applies.

## How I use it

Drill is built around a collection of textbook exercises and their answers. It
helps with several parts of independent study:

- **Work through new material.** Browse or search the collection, choose a
  problem, and attempt it before revealing the answer.
- **Keep unfinished work visible.** Mark a problem as in progress and return to
  it later, even if the work spans several days.
- **Decide what needs more practice.** Grade an attempt from Fail to Easy. The
  grade determines whether and when the problem returns for review.
- **See progress over time.** Review activity is saved in a local log, with an
  activity calendar and progress statistics in the app. The Reviewed list keeps
  previously attempted problems available to revisit.

The journal currently takes the form of recorded actions and grades. Automatic
topic interleaving remains a goal; for now, I can mix topics by choosing problems
myself.

## How it compares with Anki

[Anki](https://docs.ankiweb.net/background.html) uses active recall and spaced
repetition to help retain knowledge. It worked wonderfully for me when learning
foreign-language vocabulary, and those same principles are useful in mathematics.

For textbook exercises, I wanted a workflow centered on a whole problem: time to
work through a solution, a place to leave unfinished work, and a record of the
attempt. I prefer returning after enough time has passed that I have to work out
the solution again. Drill's review intervals are measured in days, weeks, or
months, and problems can graduate out of automatic review while remaining in the
study record.

Anki can also hold math problems, and its
[learning steps and review order are configurable](https://docs.ankiweb.net/deck-options.html).
Drill exists because I wanted a small tool built around this particular study
routine. I use flashcards for vocabulary, definitions, and facts; Drill gives my
longer problem-solving practice its own place.

Drill runs locally for one user, without accounts. Problem content lives in
separate plain-text files, and study activity is stored locally alongside the
collection.

## Further reading

- [PROJECT.md](PROJECT.md): motivation, intended features, and scope.
- [Writing problem files](docs/content.md): format and examples for the problem collection.
- [AGENTS.md](AGENTS.md): design constraints, development commands, and repository conventions.
