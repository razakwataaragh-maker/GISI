# GISI Git Standards

## Required Git version

Use Git 2.40 or later where practical, with the organization's security updates applied.

Verify:

```bash
git --version
git config --get user.name
git config --get user.email
```

## Repository setup

```bash
git clone <repository-url> GISI
cd GISI
git switch main
git pull --ff-only
```

If the repository uses another default branch, use the branch documented by the project maintainers.

## Branches

Use the approved naming patterns:

```text
feature/<module-name>
fix/<issue-name>
```

Foundation work should remain scoped to its approved task.

## Commits and pushes

- Use approved conventional prefixes.
- Keep commits focused.
- Do not commit secrets, `.env` files, `node_modules`, build output, or generated coverage.
- Pull with fast-forward-only behavior unless an explicit integration workflow says otherwise.
- Never rewrite shared branch history without authorization.

