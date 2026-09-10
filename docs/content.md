# Writing problem files

Drill reads `.note` files recursively from `~/Documents/Problems`. It never edits them. Reload the app after changing content.

A file may contain several problems:

```text
!type: Problem
!deck: calculus::derivatives
!tags: chain-rule

!id: chain-rule-1
!front: Differentiate \(f(x) = \sin(x^2)\).
!back: \(f'(x) = 2x\cos(x^2)\).
!hint: Apply the chain rule.
~~~

!id: chain-rule-2
!front: Differentiate \(g(x) = e^{3x}\).
!back: \(g'(x) = 3e^{3x}\).
~~~
```

Set the type to `Problem`. Put type, deck, and tags before the fields; these properties carry forward to later problems until overridden. Separate deck levels with `::` and tags with whitespace.

Give each problem a unique, stable `id`, a `front` question, and a `back` answer. A `hint` is optional. Field text may continue on subsequent lines and supports Markdown and math. End every problem with `~~~`; fields do not carry forward.

Keep IDs when editing or moving problems so their study history stays attached. Avoid duplicate IDs and repeated fields. Loading errors prevent the catalog from opening successfully; Drill does not show a partial catalog.

[Development guide](../AGENTS.md)
