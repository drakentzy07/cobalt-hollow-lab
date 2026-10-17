#!/usr/bin/env python3
"""Read-only HIGHFLY Pages footprint forensic from a GitHub Pages artifact tar.

Analyzes compressed or uncompressed artifact.tar without extracting or deleting.
The previous Pages deploy is the evidence; this tool NEVER edits a published site.
"""
from __future__ import annotations

import collections
import hashlib
import json
import pathlib
import sys
import tarfile


def group_for(path: str) -> str:
    bits = pathlib.PurePosixPath(path).parts
    if len(bits) >= 2 and bits[0] == "lab":
        return "/".join(bits[:2])
    return bits[0] if bits else "(root)"


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Usage: pages_footprint_audit.py /path/to/artifact.tar [report.json]")
    root = pathlib.Path(sys.argv[1])
    report_path = pathlib.Path(sys.argv[2]) if len(sys.argv) == 3 else pathlib.Path("highfly-clean-pages-footprint.json")
    if root.is_dir():
        files = list(root.rglob("*.tar")) + list(root.rglob("*.tar.gz"))
        if len(files) != 1:
            raise SystemExit("Exactly one Pages tar must be present: " + str([str(x) for x in files]))
        root = files[0]
    if not root.is_file():
        raise SystemExit("GitHub Pages artifact not found: " + str(root))
    groups: dict[str, dict[str, int]] = collections.defaultdict(lambda: {"bytes": 0, "files": 0})
    ext_bytes: collections.Counter[str] = collections.Counter()
    largest: list[dict[str, object]] = []
    identities: dict[tuple[int, str], list[str]] = collections.defaultdict(list)
    total = 0
    count = 0
    invalid = []
    with tarfile.open(root, "r:*") as archive:
        for member in archive:
            if not member.isfile():
                continue
            name = member.name.removeprefix("./").lstrip("/")
            path = pathlib.PurePosixPath(name)
            if ".." in path.parts or not name:
                invalid.append(name)
                continue
            count += 1
            total += member.size
            group = groups[group_for(name)]
            group["files"] += 1
            group["bytes"] += member.size
            ext_bytes[path.suffix.lower() or "(none)"] += member.size
            largest.append({"path": name, "bytes": member.size})
            # Exactly matching byte payloads, not just same-name guesses.
            raw = archive.extractfile(member)
            if raw is None:
                raise SystemExit("Unreadable tar entry: " + name)
            digest = hashlib.sha256()
            while piece := raw.read(1024 * 1024):
                digest.update(piece)
            identities[(member.size, digest.hexdigest())].append(name)
    duplicates = []
    for (size, digest), names in identities.items():
        if len(names) > 1 and size > 0:
            duplicates.append({
                "eachBytes": size, "copies": len(names),
                "potentialDuplicateBytes": size * (len(names) - 1),
                "sha256": digest, "paths": names[:12], "hiddenPaths": max(0, len(names) - 12),
            })
    duplicates.sort(key=lambda x: int(x["potentialDuplicateBytes"]), reverse=True)
    grouped = [{"group": name, **v} for name, v in groups.items()]
    grouped.sort(key=lambda x: x["bytes"], reverse=True)
    largest.sort(key=lambda x: int(x["bytes"]), reverse=True)
    report = {
        "source": "GitHub Pages artifact tar; read-only; no live deletion",
        "totalBytes": total, "totalFiles": count, "invalidPathCount": len(invalid),
        "largestGroups": grouped[:100],
        "extensionsByBytes": [{"ext": x, "bytes": n} for x, n in ext_bytes.most_common()],
        "largestFiles": largest[:75],
        "exactDuplicatePayloadBytes": sum(int(x["potentialDuplicateBytes"]) for x in duplicates),
        "duplicatePayloadGroups": len(duplicates),
        "largestExactDuplicates": duplicates[:60],
        "notes": [
            "Duplicate content is only a removal candidate; URLs, manifests, old labs and rollback promises still need explicit owner approval.",
            "GitHub repository storage, Pages uncompressed size and Action artifact compressed size are different measures.",
            "No delete, deploy, migration or edit occurs in this audit.",
        ],
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print("HIGHFLY_CLEAN_PAGES_AUDIT=" + json.dumps({
        "bytes": total, "files": count, "duplicatePayloadBytes": report["exactDuplicatePayloadBytes"],
        "largestGroups": grouped[:15], "largestFiles": largest[:8],
    }, ensure_ascii=False))
    if invalid:
        raise SystemExit("Unsafe tar paths: " + repr(invalid[:10]))


if __name__ == "__main__":
    main()
