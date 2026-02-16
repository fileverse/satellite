# Citation Standards

## Basic Web Source Citation

Always cite sources using standard markdown links:

```markdown
[Source Title](https://example.com/article)
```

Include the source title for readability:

```markdown
According to [The State of AI Report 2025](https://example.com/ai-report), adoption has doubled.
```

## Inline Citations

Cite immediately after referenced information:

```markdown
The Q4 revenue increased by 23% quarter-over-quarter ([Q4 Financial Report](https://example.com/q4-report)).
```

## Multiple Sources

When information comes from multiple sources:

```markdown
Customer satisfaction has improved across all metrics ([Q3 Survey Results](https://example.com/survey), [Support Analysis](https://example.com/analysis)).
```

## Section-Level Citations

For longer sections derived from one source:

```markdown
### Engineering Priorities

According to [Engineering Roadmap 2025](https://example.com/roadmap):

- Focus on API scalability
- Improve developer experience
- Migrate to microservices architecture
```

## Sources Section

Always include a "Sources" section at document end:

```markdown
## Sources

- [Strategic Plan 2025](https://example.com/strategy)
- [Market Analysis Report](https://example.com/market)
- [Competitor Research: Q3](https://example.com/competitor)
- [Customer Interview Notes](https://example.com/interviews)
```

Group by category for long lists:

```markdown
## Sources

### Web Sources
- [Official Documentation](https://example.com/docs)
- [Industry Report 2025](https://example.com/report)

### Related Ddocs
- [Previous Research: Market Trends](https://docs.fileverse.io/...)
- [Technical Architecture Review](https://docs.fileverse.io/...)
```

## Ddoc Cross-References

When referencing other Fileverse ddocs, use the blockchain link:

```markdown
This research builds on [Previous Market Analysis](https://docs.fileverse.io/0x.../5#key=...).
```

## Quoting Content

When quoting directly from a source:

```markdown
The product team noted: "We need to prioritize mobile experience improvements" ([Product Meeting Notes](https://example.com/notes)).
```

For block quotes:

```markdown
> We need to prioritize mobile experience improvements to meet our Q4 goals. This includes performance optimization and UI refresh.
>
> — [Product Meeting Notes - Oct 2025](https://example.com/notes)
```

## Data Citations

When presenting data, cite the source:

```markdown
| Metric | Q3 | Q4 | Change |
|--------|----|----|--------|
| Revenue | $2.3M | $2.8M | +21.7% |
| Users | 12.4K | 15.1K | +21.8% |

Source: [Financial Dashboard](https://example.com/dashboard)
```

## Citation Frequency

**Over-citing** (every sentence):
```markdown
Revenue increased ([Report](url)). Costs decreased ([Report](url)). Margin improved ([Report](url)).
```

**Under-citing** (no attribution):
```markdown
Revenue increased, costs decreased, and margin improved.
```

**Right balance** (grouped citation):
```markdown
Revenue increased, costs decreased, and margin improved ([Q4 Financial Report](https://example.com/report)).
```

## Outdated Information

Note when source information might be outdated:

```markdown
The original API design ([API Spec v1](https://example.com/v1), published January 2024) has been superseded by [API Spec v2](https://example.com/v2).
```

## Cross-References

Link to related research documents:

```markdown
## Related Research

This research builds on previous findings:
- [Market Analysis - Q2 2025](https://docs.fileverse.io/...)
- [Competitor Landscape Review](https://docs.fileverse.io/...)

For implementation details, see:
- [Technical Implementation Guide](https://docs.fileverse.io/...)
```

## Citation Validation

Before finalizing research:

- Every key claim has a source citation
- All links are valid URLs
- Sources section includes all cited sources
- Outdated sources are noted as such
- Direct quotes are clearly marked
- Data sources are attributed

## Citation Style Consistency

Choose one citation style and use throughout:

**Inline style** (lightweight):
```markdown
Revenue grew 23% (Financial Report). Customer count increased 18% (Metrics Dashboard).
```

**Formal style** (full links — recommended):
```markdown
Revenue grew 23% ([Q4 Financial Report](https://example.com/report)). Customer count increased 18% ([Metrics Dashboard](https://example.com/dashboard)).
```

**Recommend formal style** for most research documentation as it provides clickable navigation to sources.
