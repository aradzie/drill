# Project overview

This is a personal study app for learning mathematics through textbook problems and revisiting them over time. This document describes its purpose, intended user experience, and scope; it is not a claim that every feature is already implemented.

Design constraints, development commands, and conventions are in [AGENTS.md](AGENTS.md).

## Motivation

I have plenty of math textbooks with exercises, but I struggle to review problems consistently. Keeping track of a study schedule by hand takes too much bookkeeping.

I've noticed that I keep forgetting what I've learned. I'll read about Lagrange multipliers, work through the problems, and feel that I understand the topic well. A month later, I remember nothing and have to start from scratch.

The book _Make It Stick_ recommends spaced repetition and interleaving topics, and I'd like to put those ideas into practice.

I tried Anki, and it worked wonderfully for learning vocabulary in foreign languages. I started adding math flashcards too, but its scheduling algorithm doesn't suit the way I want to practice solving problems. I don't want to solve the same problem again a few minutes later or the next day. I'd rather revisit it after a week or a month, once I've had time to forget the trick.

I have a few thousand exercises in calculus, differential equations, and multivariable calculus. I want to work through new problems and revisit old ones systematically, without having to manage the schedule by hand.

## How it fits into studying

The app runs locally for one user, without accounts or sign-in. Problems and answers are maintained in files outside the app; the app presents that collection and remembers study activity without editing problem content.

Work is organized around three lists, rather than fixed sessions or daily quotas:

- **Due:** previously reviewed problems ready to revisit, interleaved across topics.
- **In progress:** problems currently being worked on, kept visible across days and app reloads.
- **New:** problems available to try, found through browsing or random suggestions.

You solve problems on paper or elsewhere. The app helps choose what to work on, reveal the standard answer, record the outcome, and remember what to revisit.

## Attempting and reviewing a problem

1. Choose a problem from the due list, the in-progress list, the browser, or a random suggestion.
2. Attempt it. If you want to continue later, choose **Start working** to keep it in progress.
3. When ready, choose **Show answer** and compare your work with the supplied solution.
4. Grade the attempt as **Fail**, **Very hard**, **Hard**, **Good**, or **Easy**.

Fail brings a problem back in a couple of days. Very hard and Hard bring it back within a week or so. Good pushes it out about a month. Easy pushes it out several months. Review timing should suit substantial problem-solving work, with gaps measured in days, weeks, or months rather than immediate flashcard-style repetitions.

## Work in progress

**Start working** means “I am working on this; I will grade it later.” It keeps the problem visible without changing its review schedule. Several problems can be in progress at once. Starting an already open problem does not start it again.

**Stop working** removes the in-progress reminder without recording an outcome or changing the underlying schedule. If a previously reviewed problem is overdue, it returns to the due list immediately. A never-reviewed problem becomes available as new again.

## Finding problems

Browse and filter by textbook source and conceptual tags. Source follows the book/chapter/section structure; tags describe topics or techniques, such as optimization or the chain rule. A problem can have several tags.

The due list mixes topics instead of presenting a whole chapter together. You can also browse directly and choose a problem yourself.

**Roll the dice** offers a random problem matching the chosen source/tag filter. Accept it to begin or resume work, or re-roll for another suggestion. Suggestions may include new, due, or already open problems. Re-rolling should avoid immediately showing the same problem when another match exists; a previously declined problem can appear again later.

## Initial scope

- Load the existing collection of externally maintained problem files.
- Show an interleaved due list and a persistent in-progress list.
- Browse and filter problems, and offer random suggestions.
- Reveal answers, record Fail/Very hard/Hard/Good/Easy grades, and schedule future reviews.
- Start or stop working on problems.
- Show basic progress information: due count, coverage by topic, and review history.

Possible later features, outside the initial scope:

- Hints or partial-answer reveal.
- Automatic mastery decisions and tuning review timing from usage data.
