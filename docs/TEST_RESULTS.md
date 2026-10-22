# Project Verification Results

Verified on 2026-10-22 (local).

These results measure the local application. AWS deployment and account
cost remain unverified.

## HTTP integration

Health, custom-track create/list/delete, generation, saved retrieval, history and M3U/JSON/CSV exports passed.
The session used a planned eight-second crossfade without repeats.

## Original and improved engine

For a fair historical comparison, both engines use the original 48-track catalog and three selected genres.
The live demo catalog contains at least 118 tracks.
Duration error uses seconds. Runtime uses milliseconds and depends on the machine.
The new energy metric integrates three samples per track, so its energy error
is not directly comparable with the original midpoint metric.

Mean duration error across the 12 cases: original 29.1s, improved 6.7s.

| Minutes | Curve | Original duration error | Improved duration error | Original ms | Improved ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 20 | pomodoro_peak | 8 | 8 | 1.77 | 19.1 |
| 20 | linear_ascent | 2 | 2 | 1.62 | 15.73 |
| 20 | wave_interval | 43 | 2 | 1.66 | 23.43 |
| 45 | pomodoro_peak | 21 | 4 | 3.04 | 29.95 |
| 45 | linear_ascent | 39 | 1 | 3.04 | 22.38 |
| 45 | wave_interval | 12 | 25 | 2.97 | 31.04 |
| 90 | pomodoro_peak | 81 | 4 | 4.67 | 63.89 |
| 90 | linear_ascent | 3 | 8 | 6.74 | 51.4 |
| 90 | wave_interval | 4 | 4 | 4.81 | 65.78 |
| 180 | pomodoro_peak | 5 | 8 | 12.65 | 176.98 |
| 180 | linear_ascent | 91 | 5 | 13.08 | 159.91 |
| 180 | wave_interval | 40 | 9 | 12.85 | 196.58 |
