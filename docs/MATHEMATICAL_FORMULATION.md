# Playlist Optimization Formulation

Each track has energy e, tempo b, key c, genre g and duration d.
The request supplies an energy curve E(t) on [0,1], duration D, genres,
BPM bounds, exclusions and optional crossfade x.

Track k starts at the sum of preceding durations minus x times the preceding
transition count. Total duration is the sum of durations minus x(K-1).

Energy error averages absolute deviation from E(t) at 15%, 50% and 85% of each
track. Search normalizes against requested duration. Final scoring normalizes
against actual duration. Summary energy error weights samples by track duration.

Effective BPM distance is the minimum direct, half-time and double-time
distance. Tempo affinity is exp(-distance squared / (2 times 12 squared)).
Displayed BPM delta uses effective distance.

Camelot scores are 1 for identical keys, .92 for relative major/minor,
.85 for same-mode adjacent keys, .75 for adjacent mode changes and .65 for
same-mode two-hour lifts. Other transitions score max(.1, .5-.08 times distance).

Genre scoring combines acoustic affinity with 1/(1 + prior genre count).
The diversity parameter controls the balance. Coverage is a soft preference.

Weights normalize to a total of one. Beam states contain accumulated
duration-weighted utility, elapsed duration and track indices. Filters remove
ineligible tracks before search. Tracks repeat only after pool exhaustion, and
consecutive identical tracks are avoided when alternatives exist.

Pruning preserves different end tracks, elapsed-time buckets and genre coverage.
Completed paths stay available for final ranking, which adds duration accuracy
and coverage terms and recalculates curve fit. The default beam width is 12,
configurable from 2 to 32. Search runs at most 128 steps.

Bounded caches store musical transition features and per-request curve errors.
Expansion costs approximately O(K B N) for steps K, width B and catalog size N,
plus final rescoring.

Overall fit is .4(1-energy error) + .25(tempo affinity) +
.2(harmonic compatible fraction) + .15(duration accuracy).
Duration accuracy is max(0, 1 - absolute duration error / requested duration).
Compatibility includes same-mode two-hour lifts.

Beam search is a heuristic, not a proof of a global optimum. Whole-track
duration and catalog range can make requests infeasible. Diagnostics report
excessive duration error, repeats and missing genre coverage. Browser fallback
uses a simpler greedy search and identifies itself explicitly.
