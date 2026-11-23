from collections import Counter
from typing import Any


def calculate_contest_metrics(
    standings: dict[str, Any] | None = None,
    submissions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Calculate contest statistics and metrics from standings and submissions.

    Computes:
    - totalSubmissions: total count of attempts across all teams/problems
    - problemsSolved: count of solved problems across all teams
    - verdicts: accepted/rejected counts, percentages, and breakdown by verdict
    - languages: breakdown of submissions by programming language (count & percentage)
    - problems: per-problem metrics (solve rate, attempt solve rate, submissions)
    - totalTeams: total number of participating teams in the standings
    """
    standings_result = standings.get("result", {}) if isinstance(standings, dict) else {}
    rows = standings_result.get("rows", [])
    problems_meta = standings_result.get("problems", [])
    total_teams = len(rows)

    standings_solved = 0
    standings_submissions = 0
    problem_stats: dict[str, dict[str, Any]] = {}

    for idx, prob in enumerate(problems_meta):
        p_index = prob.get("index", str(idx))
        problem_stats[p_index] = {
            "index": p_index,
            "name": prob.get("name", f"Problem {p_index}"),
            "solvedCount": 0,
            "attemptedCount": 0,
            "totalTeams": total_teams,
            "solveRate": 0.0,
            "attemptSolveRate": 0.0,
            "totalSubmissions": 0,
            "acceptedSubmissions": 0,
            "rejectedSubmissions": 0,
            "submissionAcceptRate": 0.0,
        }

    for row in rows:
        results = row.get("problemResults", [])
        for idx, res in enumerate(results):
            pts = res.get("points", 0)
            rejected = res.get("rejectedAttemptCount", 0)
            is_solved = pts > 0
            has_attempts = is_solved or rejected > 0

            if is_solved:
                standings_solved += 1
                standings_submissions += 1
            standings_submissions += rejected

            p_index = (
                problems_meta[idx].get("index", str(idx))
                if idx < len(problems_meta)
                else str(idx)
            )
            if p_index not in problem_stats:
                problem_stats[p_index] = {
                    "index": p_index,
                    "name": f"Problem {p_index}",
                    "solvedCount": 0,
                    "attemptedCount": 0,
                    "totalTeams": total_teams,
                    "solveRate": 0.0,
                    "attemptSolveRate": 0.0,
                    "totalSubmissions": 0,
                    "acceptedSubmissions": 0,
                    "rejectedSubmissions": 0,
                    "submissionAcceptRate": 0.0,
                }
            stat = problem_stats[p_index]
            if is_solved:
                stat["solvedCount"] += 1
                stat["acceptedSubmissions"] += 1
                stat["totalSubmissions"] += 1
            if has_attempts:
                stat["attemptedCount"] += 1
            stat["rejectedSubmissions"] += rejected
            stat["totalSubmissions"] += rejected

    # If standings had no problems/rows, attempt to build problem stats from submissions
    raw_subs = submissions or []
    if not problem_stats and raw_subs:
        sub_prob_data: dict[str, dict[str, Any]] = {}
        unique_teams_by_prob: dict[str, set[str]] = {}
        solved_teams_by_prob: dict[str, set[str]] = {}

        for sub in raw_subs:
            p_idx = sub.get("problemIndex")
            if not p_idx:
                continue
            team = sub.get("teamHandle") or sub.get("teamName") or ""
            if p_idx not in sub_prob_data:
                sub_prob_data[p_idx] = {
                    "index": p_idx,
                    "name": f"Problem {p_idx}",
                    "solvedCount": 0,
                    "attemptedCount": 0,
                    "totalTeams": 0,
                    "solveRate": 0.0,
                    "attemptSolveRate": 0.0,
                    "totalSubmissions": 0,
                    "acceptedSubmissions": 0,
                    "rejectedSubmissions": 0,
                    "submissionAcceptRate": 0.0,
                }
                unique_teams_by_prob[p_idx] = set()
                solved_teams_by_prob[p_idx] = set()

            stat = sub_prob_data[p_idx]
            stat["totalSubmissions"] += 1
            if team:
                unique_teams_by_prob[p_idx].add(team)
            if sub.get("verdict") == "OK":
                stat["acceptedSubmissions"] += 1
                if team:
                    solved_teams_by_prob[p_idx].add(team)
            elif sub.get("verdict") and sub.get("verdict") != "TESTING":
                stat["rejectedSubmissions"] += 1

        for p_idx, stat in sub_prob_data.items():
            stat["attemptedCount"] = len(unique_teams_by_prob[p_idx])
            stat["solvedCount"] = len(solved_teams_by_prob[p_idx])
            if stat["attemptedCount"] > 0:
                stat["attemptSolveRate"] = round((stat["solvedCount"] / stat["attemptedCount"]) * 100, 1)
                stat["solveRate"] = stat["attemptSolveRate"]
            if stat["totalSubmissions"] > 0:
                stat["submissionAcceptRate"] = round(
                    (stat["acceptedSubmissions"] / stat["totalSubmissions"]) * 100, 1
                )
            problem_stats[p_idx] = stat

    # Compute percentages for problems
    for stat in problem_stats.values():
        if total_teams > 0:
            stat["solveRate"] = round((stat["solvedCount"] / total_teams) * 100, 1)
        if stat["attemptedCount"] > 0:
            stat["attemptSolveRate"] = round(
                (stat["solvedCount"] / stat["attemptedCount"]) * 100, 1
            )
        if stat["totalSubmissions"] > 0:
            stat["submissionAcceptRate"] = round(
                (stat["acceptedSubmissions"] / stat["totalSubmissions"]) * 100, 1
            )

    total_submissions = max(len(raw_subs), standings_submissions)

    # Programming languages breakdown
    lang_counter: Counter[str] = Counter()
    verdict_counter: Counter[str] = Counter()

    for sub in raw_subs:
        lang = sub.get("programmingLanguage")
        if lang:
            lang_counter[lang] += 1
        verdict = sub.get("verdict")
        if verdict:
            verdict_counter[verdict] += 1

    total_lang_subs = sum(lang_counter.values())
    languages: dict[str, dict[str, Any]] = {
        lang: {
            "count": count,
            "percentage": round((count / total_lang_subs) * 100, 1) if total_lang_subs > 0 else 0.0,
        }
        for lang, count in lang_counter.most_common()
    }

    # Verdicts breakdown (Accepted / Rejected)
    if verdict_counter:
        accepted_count = verdict_counter.get("OK", 0)
        rejected_count = sum(
            cnt for v, cnt in verdict_counter.items() if v not in ("OK", "TESTING")
        )
        evaluated = accepted_count + rejected_count
        accepted_pct = round((accepted_count / evaluated) * 100, 1) if evaluated > 0 else 0.0
        rejected_pct = round((rejected_count / evaluated) * 100, 1) if evaluated > 0 else 0.0
        by_verdict = dict(verdict_counter.most_common())
    else:
        accepted_count = standings_solved
        rejected_count = max(0, standings_submissions - standings_solved)
        evaluated = accepted_count + rejected_count
        accepted_pct = round((accepted_count / evaluated) * 100, 1) if evaluated > 0 else 0.0
        rejected_pct = round((rejected_count / evaluated) * 100, 1) if evaluated > 0 else 0.0
        by_verdict = {"OK": accepted_count, "REJECTED": rejected_count} if evaluated > 0 else {}

    problems_list = sorted(problem_stats.values(), key=lambda p: str(p.get("index", "")))

    return {
        "problemsSolved": standings_solved if standings_result else sum(p["solvedCount"] for p in problems_list),
        "submissionsMade": total_submissions,
        "totalSubmissions": total_submissions,
        "verdicts": {
            "accepted": accepted_count,
            "rejected": rejected_count,
            "acceptedPercentage": accepted_pct,
            "rejectedPercentage": rejected_pct,
            "byVerdict": by_verdict,
        },
        "languages": languages,
        "problems": problems_list,
        "totalTeams": total_teams,
    }
