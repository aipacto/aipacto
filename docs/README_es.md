# Aipacto

**English**: For the English version of this README, see [`README.md`](../README.md).

## Visión y Misión

Aipacto es un Sistema Operativo de código abierto, impulsado por IA y diseñado para revolucionar la eficiencia y la transparencia en ayuntamientos y gobiernos locales. Nuestra visión es establecer un nuevo estándar mundial para la IA en la administración pública, comenzando en España y expandiéndonos internacionalmente. Aprovechando modelos de lenguaje avanzados y una integración de datos exhaustiva, empoderamos a los gobiernos locales con herramientas inteligentes que optimizan las operaciones y mejoran la prestación de servicios públicos.

### ¿Por qué Aipacto?

- **Optimizar las Operaciones Públicas**: Automatizar y optimizar procesos administrativos complejos, reduciendo la burocracia y mejorando la eficiencia.
- **Gobernanza Basada en Datos**: Transformar grandes volúmenes de datos públicos en información accionable para una mejor toma de decisiones.
- **Escalable y Sostenible**: Diseñado para municipios de todos los tamaños, con una versión gratuita autoalojada y soluciones empresariales en la nube para una viabilidad a largo plazo.

### Primera Aplicación: Generador de Licitaciones Impulsado por IA

Nuestra aplicación insignia revoluciona la contratación pública aprovechando datos exhaustivos de los portales de licitación gubernamentales de España:

**Para Técnicos de Contratación:**

- "Genera un pliego de licitación completo para servicios de mantenimiento de carreteras basado en licitaciones similares exitosas"
- "Analiza las tendencias de precios del mercado para servicios de TI en municipios de tamaño similar"
- "Crea las especificaciones técnicas para proyectos de alumbrado urbano utilizando las mejores prácticas de otras ciudades"
- "Redacta los criterios de evaluación que cumplan con la ley de contratación pública española"

**Para el Personal Municipal:**

- "Encuentra licitaciones similares de otros ayuntamientos para contratos de gestión de residuos"
- "Analiza los requisitos de una licitación y sugiere mejoras basadas en adjudicaciones exitosas"
- "Genera cronogramas de contratación que cumplan con los requisitos legales"
- "Crea justificaciones presupuestarias utilizando datos municipales comparables"

**Características Clave:**

- **Integración Exhaustiva de Datos**: Accede a todas las licitaciones publicadas en los portales gubernamentales de España (PLACSP, plataformas autonómicas).
- **Generación Inteligente de Documentos**: Crea pliegos de licitación conformes a la ley utilizando plantillas de éxito.
- **Inteligencia de Mercado**: Proporciona información sobre precios y análisis de proveedores.
- **Cumplimiento Legal**: Garantiza que todos los documentos cumplan con la normativa de contratación pública española.

### Impacto Económico y Social

- **España**: Más de 8.000 municipios que gestionan más de 60.000 M€ en contratación anual. Incluso una adopción del 5% podría optimizar más de 3.000 M€ en gasto público.
- **Eficiencia en la Contratación**: Reducir el tiempo de preparación de licitaciones en un 70%, mejorando al mismo tiempo la calidad y el cumplimiento normativo.
- **Inteligencia de Mercado**: Facilitar mejores negociaciones de precios, con un ahorro potencial del 2-5% en contratos municipales.
- **Escalabilidad**: Comenzando en España con planes de expansión a la UE, aprovechando las capacidades de IA multilingüe.

## Arquitectura y Stack Tecnológico

Aipacto está construido con una arquitectura moderna y de nivel empresarial:

- **Arquitectura Limpia y DDD**: Organizado en contextos delimitados (*bounded contexts*) siguiendo los principios de Arquitectura Limpia y Diseño Guiado por el Dominio (*Domain-Driven Design*) para mantenibilidad y escalabilidad.
- **TypeScript en todo el stack**: Desarrollo full-stack en TypeScript para consistencia, seguridad y productividad del desarrollador.
- **Frontend**: React, React Native, Expo con Tamagui (Material Design 3) para aplicaciones municipales multiplataforma.
- **Backend**: Fastify (Node.js), Effect para programación funcional, contenedorizado para un despliegue multi-tenant seguro.
- **Orquestación de IA**: LangChain, LangGraph para flujos de trabajo multi-agente que procesan documentos de licitación y datos de contratación.
- **Integración de Datos**: Rastreadores (*crawlers*) exhaustivos para los portales de licitación gubernamentales de España (PLACSP, plataformas autonómicas).
- **Búsqueda y Analítica**: Qdrant para búsqueda semántica en documentos de licitación, PostgreSQL para datos estructurados.
- **Soporte para LLMs**: Modelos optimizados para español con *fallback* a OpenAI, Claude y otros proveedores.
- **Seguridad y Cumplimiento Normativo**: Diseñado para los requisitos del sector público con registros de auditoría y protección de datos.

## Componentes Principales

1. **Interfaz del Generador de Licitaciones**: Aplicación multiplataforma (web/móvil) para crear y gestionar documentos de contratación.
2. **Rastreadores de Datos de Licitaciones de España**: Scripts automatizados para recopilar y estructurar datos de licitaciones de portales gubernamentales.
3. **Agentes de IA para Contratación Pública**: Sistema multi-agente especializado en el análisis de licitaciones, generación de documentos y verificación del cumplimiento normativo.
4. **APIs Municipales**: Servidor Fastify que gestiona los flujos de trabajo de contratación, el procesamiento de documentos y la inteligencia de licitaciones.

## Cómo Colaborar

Estamos desarrollando activamente la aplicación del generador de licitaciones y los agentes de IA para la contratación. Si te interesa revolucionar la contratación pública a través de la IA y hacer más eficientes las operaciones municipales, ¡nos encantaría que contribuyeras!

Antes de empezar, por favor, lee nuestra [Guía de Contribución](../CONTRIBUTING.md) para ver las instrucciones de configuración, los estándares de codificación y el flujo de trabajo para las contribuciones.

## Licencia

Licencia GNU Affero General Public License v3.0.

Consulta el archivo [LICENSE](../LICENSE.md) para ver todos los detalles.
