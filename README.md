# Aipacto

**Español**: For the Spanish version of this README, see [`README`](./docs/README_es.md).

## Vision & Mission

Aipacto is an open-source, AI-driven Operating System designed to revolutionize efficiency and transparency in city councils and local governments. Our vision is to set a new global standard for AI in public administration, starting in Spain and expanding internationally. By leveraging advanced language models and comprehensive data integration, we empower local governments with intelligent tools that streamline operations and enhance public service delivery.

### Why Aipacto?

- **Streamline Public Operations**: Automate and optimize complex administrative processes, reducing bureaucracy and improving efficiency.
- **Data-Driven Governance**: Transform vast amounts of public data into actionable insights for better decision-making.
- **Scalable & Sustainable**: Designed for municipalities of all sizes, with a free self-hosted version and enterprise cloud solutions for long-term viability.

### First Application: AI-Powered Tender Writer

Our flagship application revolutionizes public procurement by leveraging comprehensive data from Spanish governmental tender portals:

**For Procurement Officers:**

- "Generate a complete tender document for road maintenance services based on similar successful tenders"
- "Analyze market pricing trends for IT services in municipalities of similar size"
- "Create technical specifications for urban lighting projects using best practices from other cities"
- "Draft evaluation criteria that comply with Spanish public procurement law"

**For Municipal Staff:**

- "Find similar tenders from other councils for waste management contracts"
- "Analyze tender requirements and suggest improvements based on successful awards"
- "Generate procurement timelines that comply with legal requirements"
- "Create budget justifications using comparable municipal data"

**Key Features:**

- **Comprehensive Data Integration**: Accesses all published tenders from Spanish governmental portals (PLACSP, regional platforms)
- **Intelligent Document Generation**: Creates compliant tender documents using successful templates
- **Market Intelligence**: Provides pricing insights and vendor analysis
- **Legal Compliance**: Ensures all documents meet Spanish procurement regulations

### Economic & Social Impact

- **Spain**: 8,000+ municipalities managing €60B+ in annual procurement. Even 5% adoption could optimize €3B+ in public spending.
- **Procurement Efficiency**: Reduce tender preparation time by 70% while improving quality and compliance.
- **Market Intelligence**: Enable better pricing negotiations, potentially saving 2-5% on municipal contracts.
- **Scalability**: Starting in Spain with plans for EU expansion, leveraging multilingual AI capabilities.

## Architecture & Tech Stack

Aipacto is built with a modern, enterprise-grade architecture:

- **Clean Architecture & DDD**: Organized into bounded contexts following Clean Architecture and Domain-Driven Design for maintainability and scalability.
- **TypeScript Everywhere**: Full-stack development in TypeScript for consistency, safety, and developer productivity.
- **Frontend**: React, React Native, Expo with Tamagui (Material Design 3) for cross-platform municipal applications.
- **Backend**: Fastify (Node.js), Effect for functional programming, containerized for secure multi-tenant deployment.
- **AI Orchestration**: LangChain, LangGraph for multi-agent workflows processing tender documents and procurement data.
- **Data Integration**: Comprehensive crawlers for Spanish governmental tender portals (PLACSP, regional platforms).
- **Search & Analytics**: Qdrant for semantic search across tender documents, PostgreSQL for structured data.
- **LLM Support**: Spanish-optimized models with fallback to OpenAI, Claude, and other providers.
- **Security & Compliance**: Built for public sector requirements with audit trails and data protection.

## Core Components

1. **Tender Writer Interface**: Cross-platform (web/mobile) application for creating and managing procurement documents.
2. **Spanish Tender Data Crawlers**: Automated scripts to collect and structure tender data from governmental portals.
3. **Procurement AI Agents**: Multi-agent system specialized in tender analysis, document generation, and compliance checking.
4. **Municipal APIs**: Fastify server managing procurement workflows, document processing, and tender intelligence.

## Getting Involved

We are actively developing the tender writer application and AI procurement agents. If you're interested in revolutionizing public procurement through AI and making municipal operations more efficient, we'd love to have you contribute!

Before you start, please read our [Contributing Guide](./CONTRIBUTING.md) for setup instructions, coding standards, and contribution workflow.

## License

Licensed under the GNU Affero General Public License v3.0.

See [LICENSE](./LICENSE) for full details.
