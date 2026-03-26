# STRUCTURAL-RUBRIC.md — Structural Code Quality Evaluation

> **Purpose**: Claude-driven structural evaluation of code quality.
> Unlike RULES.md (pattern-matching), this rubric requires LLM analysis of code semantics.
> Version: 1.0.0 | Max Score: 100 | 5 Categories

## Evaluation Schema

```json
{
  "version": "1.0.0",
  "maxScore": 100,
  "evaluator": "claude",
  "categories": [
    {
      "id": "domain-clarity",
      "name": "Domain Clarity & Intent Readability",
      "weight": 25,
      "rules": [
        {
          "id": "SC-01",
          "name": "Function/variable names convey intent without comments",
          "maxPoints": 8,
          "type": "claude",
          "criteria": "Every exported function and key variable name should clearly describe what it does/holds. A developer reading the name alone should understand the purpose without needing comments or context. Deduct for generic names (data, result, handle, process) or misleading names."
        },
        {
          "id": "SC-02",
          "name": "Module boundaries align with domain concepts",
          "maxPoints": 8,
          "type": "claude",
          "criteria": "Each file/module should map to a single domain concept. 'server/routes/generate.js' handles generation, 'video-llm/adapters/veo.js' wraps Veo API. Check that no module mixes unrelated concerns (e.g., auth logic in a route handler, data parsing in middleware)."
        },
        {
          "id": "SC-03",
          "name": "Control flow is linear and predictable",
          "maxPoints": 5,
          "type": "auto",
          "measurement": "max_nesting_depth",
          "target": 3,
          "criteria": "No function should have nesting deeper than 3 levels. Early returns preferred over nested if/else chains. Measured automatically via AST-like analysis."
        },
        {
          "id": "SC-04",
          "name": "Abstraction levels are consistent within modules",
          "maxPoints": 4,
          "type": "claude",
          "criteria": "Within a single module, all functions should operate at the same abstraction level. High-level orchestration functions should not contain low-level string manipulation. Utility functions should not contain business logic."
        }
      ]
    },
    {
      "id": "structural-maintainability",
      "name": "Structural Maintainability",
      "weight": 25,
      "rules": [
        {
          "id": "SM-01",
          "name": "Dependency direction is acyclic (DAG)",
          "maxPoints": 7,
          "type": "auto",
          "measurement": "circular_imports",
          "target": 0,
          "criteria": "No circular imports between modules. Import graph must form a DAG. Measured automatically by tracing import statements."
        },
        {
          "id": "SM-02",
          "name": "Each module has a single clear responsibility",
          "maxPoints": 6,
          "type": "claude",
          "criteria": "The Single Responsibility Principle: each file should have one reason to change. router.js handles routing only, auth.js handles authentication only. Deduct for modules that mix responsibilities."
        },
        {
          "id": "SM-03",
          "name": "Configuration is separated from logic",
          "maxPoints": 6,
          "type": "auto",
          "measurement": "config_separation",
          "criteria": "Magic numbers, URLs, and configuration values should live in config files (config.js, data/*.json), not inline in logic modules. Measured by checking for hardcoded URLs and numeric constants in non-config files."
        },
        {
          "id": "SM-04",
          "name": "Common patterns are extracted, not duplicated",
          "maxPoints": 6,
          "type": "claude",
          "criteria": "Similar code blocks (>3 lines) should be extracted into shared utilities. Check for response formatting, error handling, validation patterns that are repeated across modules."
        }
      ]
    },
    {
      "id": "bug-resistance",
      "name": "Bug Resistance Patterns",
      "weight": 20,
      "rules": [
        {
          "id": "BR-01",
          "name": "All async paths have error handling",
          "maxPoints": 6,
          "type": "auto",
          "measurement": "async_error_coverage",
          "target": 1.0,
          "criteria": "Every async function should have try/catch or .catch() handling. Unhandled promise rejections are bugs waiting to happen. Measured automatically."
        },
        {
          "id": "BR-02",
          "name": "Input boundaries are validated at module edges",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "Every public function that accepts external input (HTTP requests, file reads, user parameters) should validate inputs before processing. Internal functions can trust their callers."
        },
        {
          "id": "BR-03",
          "name": "Mutable state is minimized and scoped",
          "maxPoints": 5,
          "type": "auto",
          "measurement": "let_const_ratio",
          "target": 0.1,
          "criteria": "The ratio of 'let' declarations to total (let + const) should be below 10%. Prefer const for immutability. Measured automatically."
        },
        {
          "id": "BR-04",
          "name": "Edge cases are handled (null, empty, overflow)",
          "maxPoints": 4,
          "type": "claude",
          "criteria": "Functions should handle null/undefined inputs, empty arrays/objects, and boundary values gracefully. Optional chaining, default parameters, and guard clauses should be used appropriately."
        }
      ]
    },
    {
      "id": "api-design",
      "name": "API Design Quality",
      "weight": 15,
      "rules": [
        {
          "id": "AD-01",
          "name": "Public APIs are minimal and well-bounded",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "Each module exports only what external consumers need. Internal helpers should not be exported. The 'index.js' files should serve as clean public APIs."
        },
        {
          "id": "AD-02",
          "name": "Return types are consistent and predictable",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "Similar functions should return similar shapes. All route handlers should use sendJSON/sendError consistently. All adapters should return the same response structure."
        },
        {
          "id": "AD-03",
          "name": "Error responses follow a uniform schema",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "All API errors should use the same format: { error: { message, code, status } }. No raw strings or inconsistent error shapes."
        }
      ]
    },
    {
      "id": "evolutionary-fitness",
      "name": "Evolutionary Fitness",
      "weight": 15,
      "rules": [
        {
          "id": "EF-01",
          "name": "Adding a new provider requires only adapter + config change",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "To add a new video model (e.g., Pika), you should only need to: 1) create adapters/pika.js, 2) add entry in config.js PROVIDERS, 3) import in index.js. No changes needed in router.js, server routes, or client SDK."
        },
        {
          "id": "EF-02",
          "name": "Adding a new route requires only route file + registration",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "To add a new API endpoint (e.g., /v1/status), you should only need to: 1) create routes/status.js, 2) register in server/index.js. Middleware chain applies automatically."
        },
        {
          "id": "EF-03",
          "name": "Data schema changes don't cascade across modules",
          "maxPoints": 5,
          "type": "claude",
          "criteria": "If a data file schema changes (e.g., adding a field to api-keys.json), only the direct consumer should need updating. Check for tight coupling where multiple modules parse the same data file."
        }
      ]
    }
  ]
}
```

## How to Use

### Automated Evaluation (~40% of points)
Run `node scripts/evaluate-structural.js --prepare` to generate a codebase snapshot with:
- Import graph analysis (SM-01)
- Nesting depth per function (SC-03)
- Config separation check (SM-03)
- Async error handling coverage (BR-01)
- let/const ratio (BR-03)

### Claude Evaluation (~60% of points)
Claude reads the codebase snapshot + this rubric and scores each rule that has `"type": "claude"`.
The evaluation considers:
- Whether a developer (or AI) can understand intent from names alone
- Whether module boundaries match domain concepts
- Whether abstractions are consistent
- Whether the codebase is easy to extend

### Scoring
Each rule: 0 to maxPoints. Category score = sum of rule scores. Total = sum of all categories (max 100).
