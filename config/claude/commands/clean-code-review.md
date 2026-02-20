---
description: Perform a Clean Code (Robert C. Martin) style review on a PR
---

You are reviewing a pull request using Clean Code principles by Robert C. Martin.

Fetch the PR using: `gh pr view {{arg1}} --json title,body,diff`

Provide a thorough review focusing on software craftsmanship:
- Function length and complexity (functions should be small)
- Naming clarity and consistency (reveal intent)
- DRY violations (Don't Repeat Yourself)
- Single Responsibility Principle
- Dead code or unused imports
- Magic numbers/strings (should be named constants)
- Unnecessary comments (code should be self-documenting)
- Deep nesting (prefer early returns)
- Code organization and structure

Be constructive and specific with line numbers from the diff.
Suggest concrete improvements with examples.
If the code is clean, acknowledge what's done well.

After completing your review, post it as a comment:
```bash
gh pr comment {{arg1}} --body "<your review in markdown>"
```

Format your review as professional, constructive feedback.
