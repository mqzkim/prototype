# RULES.md — Video LLM SaaS Evaluation Criteria

> **This file is IMMUTABLE.** The daily cron self-evolution system uses these rules as fixed targets.
> The codebase evolves to meet these criteria; the criteria themselves never change.
> Version: 1.0.0 | Max Score: 100 | Passing Threshold: 70

## Evaluation Schema

```json
{
  "version": "1.0.0",
  "maxScore": 100,
  "passingThreshold": 70,
  "categories": [
    {
      "id": "code-quality",
      "name": "Code Quality",
      "weight": 20,
      "rules": [
        {
          "id": "CQ-01",
          "name": "No console.error/warn in production source",
          "maxPoints": 4,
          "measurement": "count_violations",
          "target": 0,
          "pattern": "console\\.(error|warn)",
          "glob": "src/**/*.js",
          "scoring": "violations === 0 ? maxPoints : Math.max(0, maxPoints - violations)"
        },
        {
          "id": "CQ-02",
          "name": "Exported functions have JSDoc comments",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 0.9,
          "glob": "src/**/*.js",
          "scoring": "Math.round(maxPoints * Math.min(1, ratio / target))"
        },
        {
          "id": "CQ-03",
          "name": "No TODO/FIXME/HACK in source code",
          "maxPoints": 4,
          "measurement": "count_violations",
          "target": 0,
          "pattern": "TODO|FIXME|HACK",
          "glob": "src/**/*.js",
          "scoring": "violations === 0 ? maxPoints : Math.max(0, maxPoints - violations)"
        },
        {
          "id": "CQ-04",
          "name": "All functions are 40 lines or fewer",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 1.0,
          "glob": "src/**/*.js",
          "scoring": "Math.round(maxPoints * ratio)"
        },
        {
          "id": "CQ-05",
          "name": "ES Module consistency (no require())",
          "maxPoints": 4,
          "measurement": "count_violations",
          "target": 0,
          "pattern": "require\\(",
          "glob": "src/**/*.js",
          "scoring": "violations === 0 ? maxPoints : 0"
        }
      ]
    },
    {
      "id": "test-coverage",
      "name": "Test Coverage",
      "weight": 25,
      "rules": [
        {
          "id": "TC-01",
          "name": "All test suites pass",
          "maxPoints": 8,
          "measurement": "boolean",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "TC-02",
          "name": "Test file count >= source file count * 0.5",
          "maxPoints": 5,
          "measurement": "ratio",
          "target": 0.5,
          "scoring": "Math.round(maxPoints * Math.min(1, ratio / target))"
        },
        {
          "id": "TC-03",
          "name": "At least 1 integration test exists",
          "maxPoints": 4,
          "measurement": "count",
          "target": 1,
          "scoring": "count >= target ? maxPoints : 0"
        },
        {
          "id": "TC-04",
          "name": "Average assertions per test file >= 3",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 3.0,
          "scoring": "Math.round(maxPoints * Math.min(1, ratio / target))"
        },
        {
          "id": "TC-05",
          "name": "Server routes all have corresponding tests",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 1.0,
          "scoring": "Math.round(maxPoints * ratio)"
        }
      ]
    },
    {
      "id": "security",
      "name": "Security",
      "weight": 20,
      "rules": [
        {
          "id": "SEC-01",
          "name": "No hardcoded API keys or secrets in source",
          "maxPoints": 6,
          "measurement": "count_violations",
          "target": 0,
          "pattern": "(sk-[a-zA-Z0-9]{20,}|api[_-]?key\\s*=\\s*['\"][a-zA-Z0-9]{20,})",
          "glob": "src/**/*.js",
          "scoring": "violations === 0 ? maxPoints : 0"
        },
        {
          "id": "SEC-02",
          "name": "Auth middleware on all /v1/ routes except /health",
          "maxPoints": 5,
          "measurement": "boolean",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "SEC-03",
          "name": "Rate limiting is implemented and active",
          "maxPoints": 5,
          "measurement": "boolean",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "SEC-04",
          "name": "Input validation on all POST route handlers",
          "maxPoints": 4,
          "measurement": "boolean",
          "scoring": "value ? maxPoints : 0"
        }
      ]
    },
    {
      "id": "performance",
      "name": "Performance",
      "weight": 15,
      "rules": [
        {
          "id": "PERF-01",
          "name": "Server starts and responds to /health in < 500ms",
          "maxPoints": 5,
          "measurement": "timing_ms",
          "target": 500,
          "scoring": "ms <= target ? maxPoints : Math.max(0, maxPoints - Math.ceil((ms - target) / 100))"
        },
        {
          "id": "PERF-02",
          "name": "Health endpoint responds in < 50ms",
          "maxPoints": 5,
          "measurement": "timing_ms",
          "target": 50,
          "scoring": "ms <= target ? maxPoints : Math.max(0, maxPoints - Math.ceil((ms - target) / 20))"
        },
        {
          "id": "PERF-03",
          "name": "No synchronous file reads in request handlers",
          "maxPoints": 5,
          "measurement": "count_violations",
          "target": 0,
          "pattern": "readFileSync",
          "glob": "src/server/routes/**/*.js",
          "scoring": "violations === 0 ? maxPoints : 0"
        }
      ]
    },
    {
      "id": "documentation",
      "name": "Documentation",
      "weight": 20,
      "rules": [
        {
          "id": "DOC-01",
          "name": "CLAUDE.md contains SaaS architecture info",
          "maxPoints": 4,
          "measurement": "boolean",
          "check": "CLAUDE.md includes 'SaaS' AND 'API proxy'",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "DOC-02",
          "name": "All API route handler files have JSDoc",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 1.0,
          "glob": "src/server/routes/**/*.js",
          "scoring": "Math.round(maxPoints * ratio)"
        },
        {
          "id": "DOC-03",
          "name": "Client SDK has @example tags in JSDoc",
          "maxPoints": 4,
          "measurement": "boolean",
          "check": "src/client/index.js contains '@example'",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "DOC-04",
          "name": "RULES.md exists with all 5 categories",
          "maxPoints": 4,
          "measurement": "boolean",
          "scoring": "value ? maxPoints : 0"
        },
        {
          "id": "DOC-05",
          "name": "All data/ JSON files have schema validation in tests",
          "maxPoints": 4,
          "measurement": "ratio",
          "target": 1.0,
          "scoring": "Math.round(maxPoints * ratio)"
        }
      ]
    }
  ]
}
```

## Category Descriptions

### Code Quality (20 points)
Measures code hygiene, consistency, and maintainability. Production source (`src/`) must avoid debug patterns, maintain documentation, keep functions small, and use ES modules consistently.

### Test Coverage (25 points)
The highest-weighted category. All tests must pass, test-to-source ratio must be adequate, integration tests must exist, and server routes must be individually tested.

### Security (20 points)
No secrets in source code. All authenticated endpoints must enforce auth middleware. Rate limiting must be active. POST endpoints must validate input.

### Performance (15 points)
Server must start quickly. Health endpoint must respond within 50ms. Request handlers must use async I/O only (no readFileSync in hot paths).

### Documentation (20 points)
CLAUDE.md must describe the SaaS architecture. Route handlers and client SDK must have JSDoc. All data files must have schema validation tests.

## Scoring Formula

Each rule produces a score from 0 to its `maxPoints`. Category scores are the sum of rule scores within that category. The total score is the sum of all category scores (max 100). A score of 70+ is considered passing.

```
totalScore = sum(all rule scores)
percentage = (totalScore / 100) * 100
passing = totalScore >= 70
```
