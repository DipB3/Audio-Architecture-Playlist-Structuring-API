# Project Verification Results

Verified on 12 October 2026. These results measure the local application.
AWS deployment and account cost remain unverified.

## Additional verification

37 backend unit tests passed. Frontend service tests, lint and production
build passed. Terraform formatting and validation passed. The Lambda package
imports correctly and excludes tests, bytecode and local runtime data.
Browser interaction verified session controls, generation, saved reload
and export preview.

## HTTP integration

Health, generation, saved retrieval, history and M3U/JSON/CSV exports passed.
The session uses a planned eight-second crossfade and disables repeats.

## Original and improved engine

Both engines use the same 48-track catalog and the same three selected genres.
Duration error uses seconds. Runtime uses milliseconds and depends on the machine.
The new energy metric integrates three samples per track, so its energy error
is not directly comparable with the original midpoint metric.

| Minutes | Curve | Original duration error | Improved duration error | Original ms | Improved ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 20 | pomodoro_peak | 8 | 8 | 3.71 | 44.05 |
| 20 | linear_ascent | 2 | 2 | 2.99 | 34.23 |
| 20 | wave_interval | 43 | 2 | 3.46 | 42.8 |
| 45 | pomodoro_peak | 21 | 4 | 6.81 | 59.58 |
| 45 | linear_ascent | 39 | 1 | 6.31 | 44.28 |
| 45 | wave_interval | 12 | 25 | 5.89 | 63.03 |
| 90 | pomodoro_peak | 81 | 4 | 11.2 | 158.8 |
| 90 | linear_ascent | 3 | 8 | 15.07 | 129.8 |
| 90 | wave_interval | 4 | 4 | 13.42 | 138.46 |
| 180 | pomodoro_peak | 5 | 8 | 25.66 | 375.21 |
| 180 | linear_ascent | 91 | 5 | 34.03 | 354.67 |
| 180 | wave_interval | 40 | 9 | 27.02 | 463.64 |
