# Research & Documentation Skill Evaluations

Evaluation scenarios for testing the ddocs Research & Documentation skill.

## Purpose

These evaluations ensure the skill:
- Researches topics effectively using web search
- Synthesizes information from multiple sources
- Selects appropriate research report format
- Creates well-structured ddocs with proper markdown citations
- Handles blockchain sync correctly
- Works consistently across Haiku, Sonnet, and Opus

## Evaluation Files

### basic-research.json
Tests basic research workflow with web search and ddoc creation.

**Scenario**: Research WebAssembly adoption and create a summary ddoc
**Key Behaviors**:
- Searches the web for relevant information
- Gathers data from multiple authoritative sources
- Synthesizes information into coherent findings
- Selects appropriate format (Research Summary)
- Includes citations with `[Title](URL)` format
- Creates ddoc with `fileverse_create_document`
- Returns blockchain-synced link to user

### web-research-to-ddoc.json
Tests comparison format with multi-source web research.

**Scenario**: Compare React, Vue, and Svelte and publish as a ddoc
**Key Behaviors**:
- Searches for information on each framework
- Identifies key comparison criteria
- Creates comparison matrix table
- Provides detailed pros/cons analysis
- Selects Comparison format
- Publishes as ddoc with proper sync handling
- Returns blockchain link

## Running Evaluations

1. Ensure the `fileverse-api` server is running
2. Enable the `ddocs-research-documentation` skill
3. Submit the query from the evaluation file
4. Verify web searches are performed with relevant queries
5. Check that multiple sources are gathered and synthesized
6. Verify appropriate format is selected
7. Confirm citations use `[Title](URL)` markdown links
8. Verify ddoc is created and blockchain link is returned
9. Test with Haiku, Sonnet, and Opus

## Expected Skill Behaviors

### Web Research
- Searches with relevant, varied queries
- Gathers information from 3-5+ sources
- Synthesizes information across sources
- Identifies patterns and insights
- Notes conflicting information when present

### Format Selection
- Chooses correct format based on scope and depth:
  - **Research Summary**: Quick overview with key findings
  - **Comprehensive Report**: Deep analysis with multiple sections
  - **Quick Brief**: Fast facts and takeaways
  - **Comparison**: Side-by-side analysis
- Applies format structure consistently
- Uses appropriate sections and headings

### Citation & Attribution
- Includes citations for all web sources
- Uses `[Source Title](URL)` markdown links
- Attributes findings to specific sources
- Includes Sources section at document end
- Cross-references existing ddocs when relevant

### Ddoc Creation & Sync
- Searches for existing ddocs before creating (avoid duplicates)
- Creates ddoc with descriptive title including topic and date
- Waits for blockchain sync to complete
- Returns the `link` field to the user
- Handles sync failures gracefully

### Document Quality
- Title clearly indicates research topic and date
- Executive summary or key findings upfront
- Organized with clear hierarchy
- Actionable insights and recommendations
- Appropriate depth for the query

## Creating New Evaluations

When adding evaluations:

1. **Test different research types** - Market research, technical analysis, trend reports, comparisons
2. **Vary source requirements** - Simple topics (2-3 sources) vs deep research (5+ sources)
3. **Test format selection** - Does it choose the right format for the scope?
4. **Test citation accuracy** - Are all sources properly attributed with links?
5. **Test sync handling** - Does it wait for sync and return the link?

## Example Success Criteria

**Good** (specific, testable):
- "Performs at least 2 web searches with different query terms"
- "Includes at least 3 cited sources using [Title](URL) format"
- "Creates ddoc with title format 'Research: [Topic] - [Date]'"
- "Uses Research Summary format with sections: Executive Summary, Key Findings, Sources"
- "Returns blockchain-synced link after ddoc creation"

**Bad** (vague, untestable):
- "Searches the web effectively"
- "Creates comprehensive research"
- "Uses sources appropriately"
- "Good documentation"
