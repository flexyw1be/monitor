from backend.codeforces.utils.metrics import calculate_contest_metrics


def test_empty_metrics() -> None:
    stats = calculate_contest_metrics(None, None)
    assert stats["problemsSolved"] == 0
    assert stats["submissionsMade"] == 0
    assert stats["totalSubmissions"] == 0
    assert stats["verdicts"]["accepted"] == 0
    assert stats["verdicts"]["rejected"] == 0
    assert stats["verdicts"]["acceptedPercentage"] == 0.0
    assert stats["verdicts"]["rejectedPercentage"] == 0.0
    assert stats["languages"] == {}
    assert stats["problems"] == []
    assert stats["totalTeams"] == 0


def test_standings_metrics() -> None:
    standings = {
        "result": {
            "problems": [
                {"index": "A", "name": "Problem A"},
                {"index": "B", "name": "Problem B"},
            ],
            "rows": [
                {
                    "problemResults": [
                        {"points": 1, "rejectedAttemptCount": 1},  # Solved after 1 fail (2 tries)
                        {"points": 0, "rejectedAttemptCount": 2},  # Failed 2 times (2 tries)
                    ]
                },
                {
                    "problemResults": [
                        {"points": 1, "rejectedAttemptCount": 0},  # Solved on 1st try (1 try)
                        {"points": 1, "rejectedAttemptCount": 3},  # Solved after 3 fails (4 tries)
                    ]
                },
            ],
        }
    }

    stats = calculate_contest_metrics(standings, None)

    assert stats["totalTeams"] == 2
    assert stats["problemsSolved"] == 3
    assert stats["totalSubmissions"] == 9  # (1+1) + (0+2) + (1+0) + (1+3) = 9
    assert stats["submissionsMade"] == 9

    # Verdicts calculated from standings
    assert stats["verdicts"]["accepted"] == 3
    assert stats["verdicts"]["rejected"] == 6
    assert stats["verdicts"]["acceptedPercentage"] == 33.3
    assert stats["verdicts"]["rejectedPercentage"] == 66.7

    # Problem A: both teams solved it (2/2 = 100%)
    prob_a = next(p for p in stats["problems"] if p["index"] == "A")
    assert prob_a["name"] == "Problem A"
    assert prob_a["solvedCount"] == 2
    assert prob_a["attemptedCount"] == 2
    assert prob_a["totalTeams"] == 2
    assert prob_a["solveRate"] == 100.0
    assert prob_a["attemptSolveRate"] == 100.0
    assert prob_a["totalSubmissions"] == 3
    assert prob_a["acceptedSubmissions"] == 2
    assert prob_a["rejectedSubmissions"] == 1
    assert prob_a["submissionAcceptRate"] == 66.7

    # Problem B: 1 out of 2 teams solved it (1/2 = 50%)
    prob_b = next(p for p in stats["problems"] if p["index"] == "B")
    assert prob_b["solvedCount"] == 1
    assert prob_b["attemptedCount"] == 2
    assert prob_b["solveRate"] == 50.0
    assert prob_b["attemptSolveRate"] == 50.0
    assert prob_b["totalSubmissions"] == 6
    assert prob_b["acceptedSubmissions"] == 1
    assert prob_b["rejectedSubmissions"] == 5


def test_submissions_metrics_and_languages() -> None:
    submissions = [
        {"id": 1, "problemIndex": "A", "programmingLanguage": "Python", "verdict": "OK", "teamHandle": "team1"},
        {"id": 2, "problemIndex": "A", "programmingLanguage": "C++", "verdict": "WRONG_ANSWER", "teamHandle": "team2"},
        {"id": 3, "problemIndex": "B", "programmingLanguage": "Python", "verdict": "TIME_LIMIT_EXCEEDED", "teamHandle": "team1"},
        {"id": 4, "problemIndex": "B", "programmingLanguage": "Java", "verdict": "OK", "teamHandle": "team3"},
        {"id": 5, "problemIndex": "A", "programmingLanguage": "Python", "verdict": "TESTING", "teamHandle": "team2"},
    ]

    stats = calculate_contest_metrics(None, submissions)

    assert stats["totalSubmissions"] == 5

    # 3 Python, 1 C++, 1 Java
    langs = stats["languages"]
    assert "Python" in langs
    assert langs["Python"]["count"] == 3
    assert langs["Python"]["percentage"] == 60.0

    assert "C++" in langs
    assert langs["C++"]["count"] == 1
    assert langs["C++"]["percentage"] == 20.0

    assert "Java" in langs
    assert langs["Java"]["count"] == 1
    assert langs["Java"]["percentage"] == 20.0

    # Verdicts: 2 OK, 2 rejected (WA, TLE), 1 TESTING (pending)
    verdicts = stats["verdicts"]
    assert verdicts["accepted"] == 2
    assert verdicts["rejected"] == 2
    assert verdicts["acceptedPercentage"] == 50.0
    assert verdicts["rejectedPercentage"] == 50.0
    assert verdicts["byVerdict"]["OK"] == 2
    assert verdicts["byVerdict"]["WRONG_ANSWER"] == 1
    assert verdicts["byVerdict"]["TIME_LIMIT_EXCEEDED"] == 1
    assert verdicts["byVerdict"]["TESTING"] == 1


def test_combined_standings_and_submissions() -> None:
    standings = {
        "result": {
            "problems": [{"index": "A", "name": "Sum"}],
            "rows": [{"problemResults": [{"points": 1, "rejectedAttemptCount": 0}]}],
        }
    }
    submissions = [
        {"id": 1, "problemIndex": "A", "programmingLanguage": "Python", "verdict": "OK", "teamHandle": "t1"},
    ]

    stats = calculate_contest_metrics(standings, submissions)

    assert stats["totalTeams"] == 1
    assert stats["problemsSolved"] == 1
    assert stats["totalSubmissions"] == 1
    assert stats["verdicts"]["accepted"] == 1
    assert stats["verdicts"]["acceptedPercentage"] == 100.0
    assert stats["languages"]["Python"]["count"] == 1
    assert stats["languages"]["Python"]["percentage"] == 100.0
    assert stats["problems"][0]["solveRate"] == 100.0
