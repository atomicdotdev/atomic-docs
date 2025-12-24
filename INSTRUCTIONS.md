# AI Assistant Instructions for Atomic Docs Project

## General Guidelines

1. **No Meta-Documentation**: Do NOT create summary documents, migration guides, status files, or changelog files unless explicitly requested
   - No `PROJECT_SUMMARY.md`
   - No `MIGRATION.md`
   - No `STATUS.md`
   - No `CHANGELOG.md`
   - No `DEPLOYMENT_SUMMARY.md`

2. **Focus on User-Facing Content**: When asked to create documentation, create the actual documentation pages that users will read, not meta-commentary about the documentation

3. **Actual Code Over Commentary**: Prioritize working, functional code and content over explanatory files about the code

4. **Conversational Suggestions**: If you want to suggest next steps or provide status updates, do so in conversation, not by creating files

5. **Explicit Requests Only**: Only create these types of files if the user explicitly asks for them by name

## What TO Create

- Documentation pages in `docs/` directory
- Code files (components, utilities, etc.)
- Configuration files when needed
- README updates when changes affect usage
- Deployment configurations

## What NOT to Create (Unless Asked)

- Summary documents
- Meta-documentation
- Status reports as files
- Migration guides (unless specifically requested)
- Architecture overview documents (unless specifically requested)
- Any file with "SUMMARY", "STATUS", "MIGRATION" in the name

## Exception

If the user says "create a summary" or "write a migration guide" or "I need a status document", then go ahead and create it. This is about not being proactive with meta-docs, not refusing when asked.