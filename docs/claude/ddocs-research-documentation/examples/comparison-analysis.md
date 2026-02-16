# Example: Comparison Analysis

## User Request

> "Compare the top cloud storage providers and publish a comparison ddoc"

## Workflow Execution

### Step 1: Web Research

```
Web search: "cloud storage providers comparison 2025"
Web search: "AWS S3 vs Google Cloud Storage vs Azure Blob pricing"
Web search: "cloud storage performance benchmarks"
Web search: "IPFS Filecoin decentralized storage comparison"
```

Found pricing pages, benchmark reports, and comparison articles.

### Step 2: Format Selection

Comparing multiple options → **Comparison** format.

### Step 3: Search Existing Ddocs

```
fileverse_search_documents
  query: "cloud storage comparison"
```

No existing ddocs found. Proceed with creation.

### Step 4: Create Ddoc

```
fileverse_create_document
  title: "Comparison: Cloud Storage Providers - Feb 2026"
  content: "[structured markdown below]"
```

## Output Document

```markdown
# Cloud Storage Providers Comparison - Feb 2026

**Date**: February 2026

## Overview

We compared four major cloud storage providers — AWS S3, Google Cloud Storage, Azure Blob Storage, and Filecoin/IPFS — across pricing, performance, features, and use cases. This comparison helps inform storage architecture decisions for applications ranging from startups to enterprise.

## Comparison Matrix

| Criteria | AWS S3 | Google Cloud Storage | Azure Blob | Filecoin/IPFS |
|----------|--------|---------------------|------------|---------------|
| **Standard Storage** | $0.023/GB/mo | $0.020/GB/mo | $0.018/GB/mo | $0.002-0.01/GB/mo |
| **Egress Cost** | $0.09/GB | $0.12/GB | $0.087/GB | Free (IPFS) |
| **Availability SLA** | 99.99% | 99.95% | 99.9% | Varies |
| **Regions** | 30+ | 35+ | 60+ | Decentralized |
| **Encryption** | AES-256 | AES-256 | AES-256 | Content-addressed |
| **CDN Integration** | CloudFront | Cloud CDN | Azure CDN | IPFS Gateways |
| **Best For** | General purpose | Analytics/ML | Microsoft ecosystem | Permanent storage |

## Detailed Analysis

### AWS S3

**Pros**:
- Most mature and widely adopted
- Extensive storage classes (Standard, IA, Glacier, Deep Archive)
- Rich ecosystem of integrations and tools
- Strong compliance certifications

**Cons**:
- Higher egress costs at scale
- Complex pricing with many tiers
- Vendor lock-in through ecosystem dependencies

**Best for**: General-purpose storage, enterprises already on AWS

**Source**: [AWS S3 Pricing](https://example.com/s3-pricing)

### Google Cloud Storage

**Pros**:
- Competitive pricing, especially for storage
- Strong analytics integration (BigQuery, Dataflow)
- Autoclass for automatic tier management
- Dual-region and multi-region options

**Cons**:
- Highest egress costs
- Smaller partner ecosystem than AWS
- Fewer storage class options

**Best for**: Data analytics workloads, ML pipelines

**Source**: [Google Cloud Storage Docs](https://example.com/gcs-docs)

### Azure Blob Storage

**Pros**:
- Lowest standard storage pricing
- Deep Microsoft 365 and Active Directory integration
- Most global regions (60+)
- Strong hybrid cloud story (Azure Stack)

**Cons**:
- Management tools less intuitive
- Complex SLA tiers
- Weaker developer experience vs AWS

**Best for**: Microsoft-centric organizations, hybrid cloud

**Source**: [Azure Blob Pricing](https://example.com/azure-pricing)

### Filecoin / IPFS

**Pros**:
- Dramatically lower storage costs
- Content-addressed (deduplication built in)
- Censorship resistant, no single point of failure
- Permanent storage option (deal renewals)

**Cons**:
- Retrieval latency higher than centralized providers
- Less predictable availability
- Ecosystem still maturing
- Not suitable for low-latency applications

**Best for**: Archival storage, decentralized applications, content permanence

**Source**: [Filecoin Storage Stats](https://example.com/filecoin-stats)

## Pricing Comparison at Scale

| Monthly Storage | AWS S3 | GCS | Azure Blob | Filecoin |
|----------------|--------|-----|------------|----------|
| 1 TB | $23 | $20 | $18 | $2-10 |
| 10 TB | $230 | $200 | $180 | $20-100 |
| 100 TB | $2,300 | $2,000 | $1,800 | $200-1,000 |
| 1 PB | $23,000 | $20,000 | $18,000 | $2,000-10,000 |

*Note: Excludes egress, API calls, and retrieval fees.*

## Recommendation

**For most applications**: **AWS S3** — most mature, broadest integration ecosystem, predictable performance.

**For cost-sensitive archival**: **Filecoin/IPFS** — 10-100x cheaper for storage-heavy workloads where retrieval latency is acceptable.

**For Microsoft shops**: **Azure Blob** — lowest per-GB cost among centralized providers with deep Microsoft integration.

**Rationale**: AWS S3 remains the safe default due to ecosystem maturity and reliability. Filecoin represents a compelling alternative for applications that can tolerate higher retrieval latency in exchange for dramatically lower costs and decentralization benefits.

## Sources

- [AWS S3 Pricing](https://example.com/s3-pricing)
- [Google Cloud Storage Docs](https://example.com/gcs-docs)
- [Azure Blob Pricing](https://example.com/azure-pricing)
- [Filecoin Storage Stats](https://example.com/filecoin-stats)
- [Cloud Storage Benchmark Report 2025](https://example.com/benchmark)
```

## Result

```
syncStatus: "synced"
link: "https://docs.fileverse.io/0x.../12#key=..."
```

Returned blockchain-synced link to user.

## Key Success Factors

1. **Structured comparison**: Matrix format for quick scanning
2. **Multiple dimensions**: Price, performance, features, target market
3. **Included decentralized option**: Filecoin/IPFS alongside centralized providers
4. **Strategic recommendations**: Context-dependent suggestions, not just data
5. **Scaling analysis**: Pricing at different volume levels
6. **Comprehensive sources**: Each option backed by authoritative source
