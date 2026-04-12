---
title: "Ferb, I Know What We're Doing Today: A Pragmatic Dissection of LangChain"
description: "LangChain's Runnable abstraction bundles too much into a single interface, creating the kind of technical debt that haunts production systems. A look at what went wrong and what clean composition actually looks like."
pubDate: 2026-04-12
tags: ["ai", "langchain", "software-engineering", "architecture", "python"]
shareText: "LangChain's Runnable bundles streaming, batching, serialization, and callbacks into one interface. That's not composition — it's a violation of orthogonality."
draft: true
---

There are 104 days to summer vacation and LangChain will have you on call for half of them.

For those who don't already know, LangChain is the de-facto prototyping and now ostensibly "production-grade" agentic framework that many teams are adopting. Alongside CopilotKit, LiteLLM, LangGraph, and LlamaIndex, these new-generation AI frameworks are poorly designed and create the kind of technical debt you wish you never accrued. The companies' solution to their poorly designed abstractions? Introduce overpriced observability tooling and custom enterprise solutions — to problems they created. Imagine someone poisoning a well and then offering you the antidote. You'd probably avoid them altogether.

Most of these poor design choices were a direct result of feature bundling at scale without clear interface abstractions. The tragedy is that this was avoidable. When an industry is moving fast and you need to ship, the right move is to slow down on the design: enumerate the features you need, talk to the people around you about what they need, and prototype early. The prototyping experience will be brutal, but that's the point — it gives you real feedback before you've committed. Instead, these frameworks optimized for demos and first-mover optics, which plays well to non-technical audiences but leaves engineers holding the bag.

The result is everything a pragmatic programmer knows to avoid: leaky abstractions, happy-path coding, and violations of orthogonality — independent concerns fused into a single change surface. Once the prototype works and the pressure is on, engineers continue building on the abstraction until they hit a use case where the coupling forces them to monkeypatch — and then the next engineer builds on that monkeypatch. In a more cruel scenario, you hit a production bug with no clear way to diagnose it, and an SDR shows up to sell you their observability product. Due in part to Hyrum's Law and the sheer volume of consumers, these interfaces become nearly impossible to migrate away from.

---

## The Almighty Runnable

LangChain's entire mechanism is built around one class: the `Runnable`. It's designed to help compose pipelines, and while `langchain_classic` received a significant upgrade to v1, the core problem remains — this interface violates orthogonality at every level, and it causes more problems than it solves.

Before going further, it's worth grounding the criticism in what the file actually contains[^1]. `base.py` runs over 3,000 lines. It defines 10 substantive classes — `Runnable`, `RunnableSerializable`, `RunnableSequence`, `RunnableParallel`, `RunnableGenerator`, `RunnableLambda`, `RunnableEachBase`, `RunnableEach`, `RunnableBindingBase`, and `RunnableBinding` — plus 4 Protocol types. The base `Runnable` class alone exposes 24 public methods. Its imports draw from 8+ internal `langchain_core` submodules, pulling in callback managers, tracers, log stream handlers, event stream handlers, config utilities, and serialization primitives before a single line of business logic runs. This is what you inherit when you touch `Runnable`.

The composability pitch sounds great until you actually need specific information to build out an agent. The abstractions over RAG, and the further abstractions over the underlying agent mechanics, dilute the quality of insight you have into your own system. The truth is: for almost 99% of use cases, the SDKs the providers ship are sufficient for a POC, and creating your own thin abstractions from there is straightforward. The apparent complexity dissolves one layer deeper: async generators are pull-based, so a single consumer gets backpressure for free — the consumer controls the rate implicitly. Fan-out to multiple consumers means a queue per consumer, fire and continue; the dispatch layer owns the buffer, not the streaming abstraction. Cancellation is a token initialized once and threaded through — one signal, the loop exits. Errors surface at the await point and propagate up the call stack. Every one of these is a composition of simple pieces with clear ownership boundaries, not a framework concern. Once you have the deltas, you act on them however you want — tool calls, assistant messages, artifacts, video, audio, images — the underlying semantics are yours, accessed through an agnostic interface. Plug them into whatever workflow orchestration tool you already use and you have full insight at every level of the stack. No multi-layer abstractions stretching the stack trace so deep you need to purchase an entire new product to read it. By defaulting to LangChain, you're trading readability, maintainability, extensibility, and observability for speed — a trade almost no one should be making in AI systems. Those four properties are what separate a system that holds up from one that's waiting to fail.

The `Runnable` bundles streaming, batching, serialization, callback management, and transformations into a single interface. These are independent concerns — orthogonal in the precise sense: a change to how you batch requests has no logical relationship to how you serialize a chain, and neither should affect your streaming protocol. But because they share a change surface, they do. Modify the callback wiring and you risk breaking batch inference. Extend the streaming logic and serialization tests start failing. That coupling doesn't stay contained — it propagates into every class that touches the interface. "God class" is the colloquial term, but orthogonality is the engineering principle it violates: independent concerns fused into a single change surface, so that nothing can move without everything else moving with it.

The alternative isn't complicated. Here's a sketch:

```python
from typing import Literal
from pydantic import BaseModel

# The base of truth: LLMs produce tokens (deltas) which aggregate into messages.

class Delta(BaseModel):
    type: Literal["str"] = "str"
    content: ...  # discriminated union array

class Message(BaseModel):
    type: Literal["message"] = "message"
    content: ...  # discriminated union array

# A provider class that does one thing well.
# It reads messages, calls the API, and returns deltas.
# It doesn't care whether you stream them or buffer them — that's the caller's concern.

class ModelInfo(BaseModel):
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-5:latest"

class GenerationConfig(BaseModel):
    model: ModelInfo
    ...

class LLMProvider(Protocol):
    async def stream(
        self, config: GenerationConfig, messages: Sequence[Message]
    ) -> AsyncGenerator[Delta, None]:
        ...

# Need metadata (probabilities, etc.)? Wrap it — don't bake it in.

class DetailedDelta[M: BaseModel](BaseModel):
    type: Literal["detailed_delta"]
    content: Delta
    metadata: M

class RawProvider(Protocol):
    async def stream(
        self, config: GenerationConfig, messages: ...
    ) -> AsyncGenerator[DetailedDelta, ...]:
        ...

# Want batching? Compose it as a separate concern.

class BatchIdentifier[T: BaseModel](BaseModel):
    type: Literal["batch"]
    content: T

class Batch(Protocol):
    async def batch(
        self, batch_input: Sequence[Sequence[Message]]
    ) -> AsyncGenerator[BatchIdentifier[Delta], None]:
        # Run asyncio or a queue-based generator.
        # Can wrap an LLMProvider internally: b(p(x)) -> y
        # Implementation details are fluid; the interface stays clean.
        ...
```

Each type is orthogonal — not merely smaller, but independent along distinct axes. You can swap the batching implementation without touching the streaming protocol. You can add metadata to deltas without modifying the provider interface. The composition is explicit, and changes stay where they belong. That's what orthogonality buys you: freedom to change one concern without auditing every other.

## You Don't Need LangSmith

Remember the well-poisoning analogy? The observability story is where it plays out most clearly. LangChain's opacity creates a diagnostic gap, and LangSmith steps in to fill it — for a price. But the problem only exists because the abstraction made your system opaque in the first place.

OpenTelemetry already defines semantic conventions for generative AI[^3]. Traces, spans, token counts, model parameters — all standardized. Instrument your provider calls with OTel, and you get first-class observability in the tools you already run: Grafana, Google Cloud, Datadog, or any OTel-compatible backend. No vendor lock-in, no proprietary SDK, no additional bill.

More importantly, you own it. When something breaks, the fix is a commit in your repository — not a PR upstream that you wait weeks for, or a support ticket to a vendor. You control the instrumentation, the retention, the alerting. And because OTel spans carry arbitrary attributes, you get the business insights for free: cost per request, latency by model, error rates by prompt template. That's not a feature of LangSmith — it's a feature of owning your own telemetry.

In fairness to LangChain's origins: when it launched, almost the entire ecosystem was using it for a single purpose — RAG[^2]. The agentic patterns came later. But the architecture never caught up. The LCEL rewrite was a chance to fix this — and it was deliberate, not rushed — but it doubled down on the same non-orthogonal interface rather than decomposing it. What was a reasonable prototype scaffold became the foundation for production systems it was never designed to support.

Here's what's actually happening under the hood of every RAG pipeline and every agentic system: workflow orchestration. Inputs come in, get transformed, get routed, produce outputs. The fact that one of the steps in that workflow calls a language model doesn't make it categorically different from any other system that coordinates external services under uncertainty. We've been solving that problem for decades.

The probabilistic nature of LLM outputs isn't novel either — it's just non-determinism with a different shape. Most code that touches the outside world is non-deterministic in any meaningful sense. A monad is a formalism for exactly this: you have an operation that might fail, might produce variable output, might need cleanup — and you need to sequence it with other such operations without the composition itself becoming a source of bugs. That's the LLM call surface described precisely: sequencing operations that interact with external systems, managing failure, handling effects. Context windows, performance degradation under long sequences, prompt sensitivity — these all have direct analogues in how we think about resource constraints, latency budgets, and input validation in conventional systems. The vocabulary is different; the engineering problems are not.

What this means in practice is that context engineering, prompt construction, evaluation design, and bloat management are not AI-specific disciplines. They're engineering disciplines applied to a probabilistic data source. Treating them as something exotic is what produces the frameworks we've been discussing — built fast, built for demos, never designed for the systems that would eventually depend on them. Scripting practices don't belong in infrastructure that needs to scale. Until the field internalizes that, we'll keep rebuilding the same foundations with worse names.

---

[^1]: LangChain Repository. GitHub. https://github.com/langchain-ai/langchain
[^2]: "Build RAG applications with LangChain and Google Cloud." Google Cloud Blog. https://cloud.google.com/blog/products/databases/build-rag-applications-with-langchain-and-google-cloud
[^3]: "Semantic Conventions for Generative AI." OpenTelemetry. https://opentelemetry.io/docs/specs/semconv/gen-ai/
