# Project Verification Results

Verified on 2026-10-18 (local).

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

| Minutes | Curve | Original duration error | Improved duration error | Original ms | Improved ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 20 | pomodoro_peak | 8 | 8 | 3.16 | 35.47 |
| 20 | linear_ascent | 2 | 2 | 3.3 | 31.99 |
| 20 | wave_interval | 43 | 2 | 2.95 | 37.77 |
| 45 | pomodoro_peak | 21 | 4 | 6.03 | 56.33 |
| 45 | linear_ascent | 39 | 1 | 5.33 | 40.65 |
| 45 | wave_interval | 12 | 25 | 5.76 | 54.23 |
| 90 | pomodoro_peak | 81 | 4 | 8.41 | 110.41 |
| 90 | linear_ascent | 3 | 8 | 9.26 | 100.25 |
| 90 | wave_interval | 4 | 4 | 8.6 | 121.78 |
| 180 | pomodoro_peak | 5 | 8 | 22.65 | 356.21 |
| 180 | linear_ascent | 91 | 5 | 24.32 | 314.09 |
| 180 | wave_interval | 40 | 9 | 30.65 | 465.35 |
