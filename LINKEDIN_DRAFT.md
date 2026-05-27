# LinkedIn Draft

AI-polished writing can make weak evidence sound stronger than it is.

One failure mode I keep seeing: a claim quietly requires a higher evidence floor than the artifact being cited.

A local checklist might be enough for "we ran a local checklist."

It is not enough for:

- safe for hospitals
- compliant for regulated teams
- production-ready across an organization
- externally validated

I built a small local MVP called Evidence Floor to make that mismatch visible.

It reads a Markdown claim, structured evidence notes, and a plain Markdown policy that declares the minimum evidence for a claim class. Then it produces a review-only table for human judgment.

It does not verify truth, prevent fraud, certify compliance, or decide what should be published.

It just asks a useful pre-release question:

> What kind of evidence does this kind of claim require?

Repo: [repo link]

