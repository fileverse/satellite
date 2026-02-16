# Example: Market Research

**User Request**: "Research the current state of AI coding assistants market and publish as a ddoc"

## Workflow

### 1. Web Research
```
Web search: "AI coding assistants market size 2025"
Web search: "GitHub Copilot vs Cursor market share"
Web search: "AI code generation tools comparison"
```
Found multiple authoritative sources covering market size, competitive landscape, and technology trends.

### 2. Format Selection
Request is for general market research → **Research Summary** format.

### 3. Search Existing Ddocs
```
fileverse_search_documents
  query: "AI coding assistants"
```
No existing ddocs found on this topic. Proceed with creation.

### 4. Create Ddoc
```
fileverse_create_document
  title: "Research: AI Coding Assistants Market - Feb 2026"
  content: "[structured markdown below]"
```

## Output (Condensed)

```markdown
# AI Coding Assistants Market Research - Feb 2026

## Executive Summary
The AI coding assistant market is experiencing 150%+ YoY growth, reaching an estimated $2.5B in 2025. GitHub Copilot dominates with ~55% market share, but specialized tools like Cursor and Cody are gaining traction in specific niches.

## Key Findings

### Market Size and Growth
$800M in 2024 → $2.5B projected by 2026. Developer adoption: 23% (2023) → 47% (2024) → 65%+ (projected 2025).
- Source: [Gartner AI Developer Tools Report](https://example.com/gartner)

### Competitive Landscape
- GitHub Copilot: ~55% (strong IDE integration, enterprise adoption)
- Cursor: ~18% (rapid growth, full IDE replacement)
- Tabnine: ~8% (enterprise, on-premise focus)
- Cody: ~6% (codebase-aware, context engine)
- Amazon CodeWhisperer: ~7% (AWS ecosystem)
- Source: [Stack Overflow Developer Survey 2025](https://example.com/stackoverflow)

### Technology Trends
Key differentiators: context window size, codebase awareness, multi-file editing, agentic capabilities, code verification and testing.
- Source: [AI Code Generation Landscape](https://example.com/landscape)

## Next Steps
1. Monitor Cursor's growth trajectory and enterprise features
2. Evaluate agentic coding capabilities across tools
3. Track pricing trends and enterprise security certifications
4. Assess impact on developer productivity metrics

## Sources
- [Gartner AI Developer Tools Report](https://example.com/gartner)
- [Stack Overflow Developer Survey 2025](https://example.com/stackoverflow)
- [AI Code Generation Landscape](https://example.com/landscape)
```

## Result
```
syncStatus: "synced"
link: "https://docs.fileverse.io/0x.../10#key=..."
```

Returned blockchain-synced link to user.

## Key Success Factors

1. **Multiple web searches**: Cast a wide net with varied queries
2. **Checked for duplicates**: Searched existing ddocs before creating
3. **Proper format selection**: Research Summary for general market overview
4. **Source citations**: Every key finding linked to its source
5. **Actionable next steps**: Clear recommendations for follow-up
6. **Link returned**: Shared the blockchain-synced ddoc link
