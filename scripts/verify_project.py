"""Repeatable local/API and optimizer verification with an evidence report."""
import argparse
import csv
import io
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def request(base, path, payload=None, method=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def smoke(base):
    health = request(base, "/health")
    assert health["catalog_track_count"] >= 118
    created = request(base, "/tracks/custom", {
        "title": "Verification Song", "artist": "QA Ensemble", "genre": "Verification",
        "duration_seconds": 210, "bpm": 118, "energy": .62,
        "camelot_code": "8B", "musical_key": "C Major",
    })["track"]
    try:
        custom = request(base, "/tracks/custom")["tracks"]
        assert any(track["id"] == created["id"] for track in custom)
        assert any(item["name"] == "Verification" for item in request(base, "/genres")["genres"])
    finally:
        request(base, "/tracks/custom/" + created["id"], method="DELETE")
    generated = request(base, "/playlists/generate", {
        "target_duration_minutes": 30,
        "selected_genres": ["Contemporary Classical Piano", "Indie Pop", "Hip-Hop"],
        "curve_type": "pomodoro_peak", "crossfade_seconds": 8,
        "allow_repeats": False, "name": "Verification session",
    })["playlist"]
    loaded = request(base, "/playlists/" + generated["playlist_id"])["playlist"]
    assert loaded["tracks"] == generated["tracks"]
    assert len(loaded["transitions"]) == len(loaded["tracks"]) - 1
    history = request(base, "/playlists/history")["history"]
    assert any(item["playlist_id"] == loaded["playlist_id"] for item in history)
    for fmt in ("m3u", "json", "csv"):
        exported = request(base, "/playlists/export",
                           {"playlist_id": loaded["playlist_id"], "format": fmt})
        assert exported["content"]
        if fmt == "csv":
            rows = list(csv.reader(io.StringIO(exported["content"])))
            assert len(rows) == len(loaded["tracks"]) + 1
        if fmt == "json":
            assert json.loads(exported["content"])["diagnostics"]["crossfade_seconds"] == 8
    return {"status": "passed", "track_count": loaded["track_count"],
            "metrics": loaded["metrics"], "diagnostics": loaded["diagnostics"]}


def benchmark():
    from backend.app.engine.models import Track
    from backend.app.engine.optimizer import PlaylistOptimizer
    baseline_catalog = subprocess.check_output(
        ["git", "show", "875804d767890211dafa5a97126fdd909044136c:backend/app/data/track_catalog.json"],
        cwd=ROOT, text=True)
    tracks = [Track.from_dict(item) for item in json.loads(baseline_catalog)]
    # The original committed engine supplies the comparison, not invented numbers.
    source = subprocess.check_output(
        ["git", "show", "875804d767890211dafa5a97126fdd909044136c:backend/app/engine/optimizer.py"],
        cwd=ROOT, text=True)
    namespace = {"__name__": "backend.app.engine.baseline",
                 "__package__": "backend.app.engine"}
    exec(compile(source, "original_optimizer.py", "exec"), namespace)
    rows = []
    for duration in (20, 45, 90, 180):
        for curve in ("pomodoro_peak", "linear_ascent", "wave_interval"):
            kwargs = dict(target_duration_minutes=duration,
                          selected_genres=["Contemporary Classical Piano", "Indie Pop", "Hip-Hop"],
                          curve_type=curve)
            result = {"duration_minutes": duration, "curve": curve}
            for label, optimizer in (("original", namespace["PlaylistOptimizer"]),
                                     ("improved", PlaylistOptimizer)):
                start = time.perf_counter()
                playlist = optimizer(tracks).generate_playlist(**kwargs)
                result[label] = {
                    "execution_ms": round((time.perf_counter() - start) * 1000, 2),
                    "duration_error_seconds": abs(playlist.actual_duration_seconds - duration * 60),
                    "harmonic_percent": round(playlist.metrics.harmonic_compatibility_rate, 2),
                    "genre_count": len(playlist.genres_used),
                }
            rows.append(result)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url")
    parser.add_argument("--report", default="docs/TEST_RESULTS.json")
    args = parser.parse_args()
    results = {"date": datetime.now(timezone.utc).date().isoformat(),
               "environment": "remote" if args.api_url else "local",
               "aws_deployment_verified": False}
    if args.api_url:
        results["http_smoke"] = smoke(args.api_url.rstrip("/"))
    else:
        with tempfile.TemporaryDirectory(prefix="audio-api-qa-") as local_dir:
            # Reserve an available loopback port before starting the gateway.
            import socket
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0))
                port = sock.getsockname()[1]
            env = dict(os.environ, LOCAL_DATA_DIR=local_dir, AWS_EC2_METADATA_DISABLED="true")
            process = subprocess.Popen(
                [sys.executable, str(ROOT / "backend/app/local_server.py"), str(port)],
                cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            try:
                base = f"http://127.0.0.1:{port}"
                for _ in range(60):
                    try:
                        request(base, "/health")
                        break
                    except (OSError, ValueError):
                        if process.poll() is not None:
                            raise RuntimeError("Local gateway exited during startup.")
                        time.sleep(.1)
                results["http_smoke"] = smoke(base)
            finally:
                process.terminate()
                process.wait(timeout=10)
    if args.api_url:
        health = request(args.api_url.rstrip("/"), "/health")
        assert health["dynamodb_connected"] and health["s3_connected"], "Cloud persistence must be connected."
        results["aws_deployment_verified"] = True
    results["benchmark"] = benchmark() if not args.api_url else []
    output = ROOT / args.report
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    markdown = ["# Project Verification Results", "",
                f"Verified on {results['date']} ({results['environment']}).", ""]
    if args.api_url:
        markdown.extend([
            "The deployed API passed health, generation, saved retrieval, history",
            "and M3U/JSON/CSV export checks. DynamoDB and S3 health checks passed.",
            "The session used a planned eight-second crossfade without repeats.",
            "Account charges and frontend browser behavior were not checked by this run.",
        ])
    else:
        markdown.extend([
            "These results measure the local application. AWS deployment and account",
            "cost remain unverified.", "", "## HTTP integration", "",
            "Health, custom-track create/list/delete, generation, saved retrieval, history and M3U/JSON/CSV exports passed.",
            "The session used a planned eight-second crossfade without repeats.", "",
            "## Original and improved engine", "",
            "For a fair historical comparison, both engines use the original 48-track catalog and three selected genres.",
            "The live demo catalog contains at least 118 tracks.",
            "Duration error uses seconds. Runtime uses milliseconds and depends on the machine.",
            "The new energy metric integrates three samples per track, so its energy error",
            "is not directly comparable with the original midpoint metric.", "",
            "| Minutes | Curve | Original duration error | Improved duration error | Original ms | Improved ms |",
            "| --- | --- | ---: | ---: | ---: | ---: |",
        ])
        for row in results["benchmark"]:
            old, new = row["original"], row["improved"]
            markdown.append(f"| {row['duration_minutes']} | {row['curve']} | "
                            f"{old['duration_error_seconds']} | {new['duration_error_seconds']} | "
                            f"{old['execution_ms']} | {new['execution_ms']} |")
    output.with_suffix(".md").write_text("\n".join(markdown) + "\n", encoding="utf-8")
    print(json.dumps({"http": results["http_smoke"]["status"],
                      "benchmark_cases": len(results["benchmark"]),
                      "report": str(output)}, indent=2))


if __name__ == "__main__":
    main()
