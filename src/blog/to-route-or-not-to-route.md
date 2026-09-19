---
title: "To Route Or Not To Route? For That Is the Question"
description: "Route work to specialized agents. Test model choice within each harness, and optimize the complete workflow for speed, cost, and correctness."
pubDate: 2026-09-18
tags: ["tech", "ai", "agents", "architecture", "cost"]
shareText: "Your business does not need to solve every problem. Route work to specialized agents, give each the context it needs, and test model choice against cost per successful task."
draft: true
---

Your business does not need to solve AGI. It needs to solve the problems customers pay it to solve, quickly, cheaply, and correctly.

That is the argument for routing work to specialized agents. Give each a narrow responsibility, relevant context, appropriate tools, and explicit checks. Then treat model choice as a parameter to test within that system. The competitive advantage comes from how well the complete workflow performs.

Most of the disagreement about routing comes from the word doing two jobs at once.

## Two products keep arriving in the same box

A gateway centralizes access and operational policy. A model router chooses which model handles a request. They ship together often enough that adopting one feels like adopting both, and each has to justify its overhead separately.

There is something to be said for the gateway. PII redaction, message flagging, fallback on provider outage, online evals: all of that wants a single egress point, and building it once is straightforward engineering. None of it requires automatic routing at the model level.

```mermaid
flowchart TD
    App[Your app] --> GW["Gateway<br/>PII redaction · flagging<br/>online evals · provider fallback"]
    GW --> Pin["One pinned model, per agent"]
    GW -. "shipped in the same box" .-> RT{"Auto model router<br/>scores price · latency · difficulty"}
    RT -.-> Any[Selected model<br/>under the routing policy]
```

## Agent routing and model routing answer different questions

Model routing chooses a model within a defined workflow:

```mermaid
flowchart TD
    U1[Request] --> R1{"Which model meets<br/>quality and cost targets?"}
    R1 --> M1[Small model]
    R1 --> M2[Mid model]
    R1 --> M3[Frontier model]
    M1 --> O1[Answer]
    M2 --> O1
    M3 --> O1
    O1 --> E1["Evaluate the router<br/>and every supported<br/>model configuration"]
```

Agent routing selects the workflow, including its tools, context, and validation:

```mermaid
flowchart TD
    U2[Request] --> R2{"Which domain<br/>owns this?"}
    R2 --> A1["Billing agent<br/>own tools · rules · pinned model"]
    R2 --> A2["Support agent<br/>own tools · rules · pinned model"]
    R2 --> A3["Escalation agent<br/>defined limits · human handoff"]
    A1 --> O2[Answer]
    A2 --> O2
    A3 --> O2
    O2 --> E2["Your eval suite describes<br/>each supported branch<br/>and the selection policy"]
```

The two compose. They are not the same decision, though, and they do not carry the same evidentiary burden: one gives you a boundary to evaluate against, the other adds a policy inside it.

## Specialize the work first

Agent routing chooses which workflow owns a request. A coordinator can also invoke a specialist as a subagent for one bounded part of a larger task. Neither requires a different model: two agents using the same weights can behave differently because their instructions, tools, context, and checks differ.

Consider a disputed invoice. A billing specialist needs the invoice, account terms, and payment tools. A delivery specialist needs shipment records. They can return concise findings and supporting evidence to a coordinator, without each receiving the entire conversation and every other specialist's tool history. Independent checks can run in parallel; dependent actions must wait for their prerequisites.

That separation can reduce irrelevant context and repeated processing of large tool outputs. It can also shorten elapsed time when work is independent. Anthropic describes subagents exploring in separate context windows and compressing their findings for a lead agent. Its research system also used substantially more total tokens than ordinary chat: context isolation is not itself a guarantee of lower total usage. [13]

The savings come from disciplined boundaries: send only the required context, bound the task and tool budget, and return the result with enough evidence to verify it. Spawning several agents that each reread the same history and repeat the same search can erase the benefit. Measure all calls, including coordination and retries.

Specialization also makes correctness concrete. An invoice total can be checked with code; a refund can be checked against account policy; a delivery claim can be checked against a source record. A narrower agent gives you fewer responsibilities to validate and more specific failure cases to improve.

## The harness is where the money is

**The unit you ship is the model plus its harness.** By harness, I mean the prompts, tools, context management, execution loop, checks, and recovery behavior around the model. Those conditions decide what the model can accomplish and what it costs you to accomplish it. That is the part of the argument worth being loud about: harness work moves cost per task by more than model swaps usually do, and it moves it in a direction you control.

ARC-AGI is the cleanest public demonstration, because ARC Prize reports cost next to score instead of score alone. On ARC-AGI-3 Semi-Private it ran OpenAI's Astra under two harnesses, at every reasoning-effort setting. [14]

| Reasoning effort | Standard harness | Provider Adapter harness |
|---|---|---|
| max | 62.7%, $26,098 | 98.6%, $17,332 |
| xhigh | 59.3%, $37,317 | 98.4%, $18,147 |
| high | 54.8%, $40,705 | 99.9%, $18,817 |
| medium | 38.6%, $48,090 | 98.4%, $19,285 |
| low | 17.5%, $38,166 | 98.0%, $21,298 |
| none | 35.2%, $49,791 | 96.7%, $23,457 |

Same model, same benchmark, same tasks. At `high` effort, changing only the harness moves the score from 54.8% to 99.9% and the bill from $40,705 to $18,817. Forty-five points better, for less than half the money.

Read the columns rather than the rows. Under the Provider Adapter harness the reasoning-effort dial barely matters: every setting lands between 96.7% and 99.9%, across a cost spread of about $6K. Under the Standard harness that same dial swings the score by 45 points and the cost by $24K, and not in the same direction. `none` is the most expensive row on the board and scores 35.2%. `low` scores 17.5% and still costs $38,166.

That inversion is the case against buying cheapness by the token. The settings that look cheapest bought the worst results at the highest total price, because a weaker configuration needs more actions to finish and every action is another model call. ARC Prize notes the mechanism directly: at max effort Astra solves games in fewer actions, which reduces total calls and tokens. Cost per successful task is the only unit that survives this table.

It also sets a condition on every comparison you read. Two systems are comparable only when their harnesses are, which is why the harness is published alongside the score. A number produced under someone else's scaffold is not a model result. It is a result about their engineering budget that happens to share a benchmark name.

Staying with a model lets you accumulate validated improvements to those conditions. You learn which tool descriptions it follows, when it needs a check, how to compact its context, and which failures require recovery. That is an engineering reason for stickiness, and a cost reason: every one of those lessons is a cheaper run you keep. Changing the model introduces another variable into a system whose behavior you have already priced.

### The coupling shows up in the model guide too

The same model's guide describes the coupling from the other side. Its model guide documents several behaviors that need application-specific prompting: it may ask for clarification when the user expects continued work, react strongly to instructions in skills and `AGENTS.md`, delegate less often than desired, or test more broadly than a small change warrants. The guide recommends adjusting those instructions to match the harness. Its asynchronous tool calls also require the application to execute tools and manage pending work. [1]

Each of those behaviors has a price. Clarifying questions the user did not want, tests broader than the change warranted, and work the model declined to delegate all bill as tokens and latency. Tuning them away is harness work, not model work, and it is the kind of saving that compounds every run.

That is a concrete example of model-specific integration work. It is not a controlled demonstration that a weaker model outperforms Astra, or a measurement of the benefit of any one prompt. The narrower point is sufficient: changing the model can change what a suitable harness looks like, and therefore what the workflow costs.

**Routing expands what you must validate.** A router is another policy whose behavior can change outcomes. You can evaluate it: run the production routing policy, exercise each supported model and harness configuration, test fallback paths, and record which configuration handled each request. The problem is assuming that an evaluation of one pinned model also validates the routed system.

A shared harness may work across several models. Where it does not, you maintain adaptations for each. If routing happens mid-session, you also have to validate how the next model interprets the accumulated tool results and conversation state. Those are costs that a token-price comparison leaves out.

**Stickiness also affects cache economics.** Long sessions accumulate reusable prefixes: instructions, tool definitions, history, and retrieved context. Changing models or providers can lose cache reuse and introduce new input-processing costs. The exact rules depend on the serving service; a cache hit is not guaranteed merely because the model name stays fixed. OpenRouter documents provider stickiness for prompt caching and separate session stickiness for its automatic model router. Its automatic router can still change models when its ranking calls for it. [2][3]

**Specialization includes tools and context.** Selecting a billing agent can choose domain rules, permissions, retrieval, and a tested model together. That gives you a useful boundary for evaluation. Model selection can also be useful inside that boundary, but it needs evidence of its own.

When an answer is poor, diagnose the failing step. Missing context, an unsuitable tool, or a weak recovery loop calls for a different fix than insufficient model capability. Start with a tested model per agent; add model selection when measurements justify it.

### Test model choice deliberately

A model is a useful experimental parameter. Establish a baseline for each specialist, then compare candidate models on the same representative tasks, with explicit quality checks and a cost and latency budget. Start with the harness fixed to see what changing the model does. If a candidate needs different prompts or tools, test that adapted configuration separately and record the whole configuration that produced the result.

You can then test a model-routing policy within that specialist: a cheaper model for a validated subset of work, escalation for harder cases, or selection based on observed task features. Evaluate that policy end to end, including selection errors and fallback costs. This is compatible with agent routing. It adds a decision inside a workflow whose responsibility is already clear.

## What the tools actually do

Much of the pressure to route arrives as a list of names: Anyscale, vLLM, SGLang, RouteLLM, OpenRouter, cited together as though they were one product whose popularity had already settled the question. They sit at different layers, and only two of them choose models at all.

| Project | What happens in the request path | Why use it, and what you take on |
|---|---|---|
| Anyscale / Ray Serve | Anyscale manages Ray infrastructure; Ray Serve runs and scales application deployments, which can contain inference engines and routing logic. | Useful for distributed applications and managed operations. You still design the application and pay for its compute and operational choices. [4] |
| vLLM | An inference engine schedules requests and runs model weights, using batching and efficient attention-memory management. | Useful for serving supported open models efficiently. You own capacity, model configuration, and deployment behavior. It is not inherently a quality-based model router. [5] |
| SGLang | A serving runtime reuses shared prefixes and schedules inference; its surrounding tooling supports distributed serving. | Useful for workloads with reusable context and high serving demand. Hardware and feature compatibility still constrain deployment. [6] |
| RouteLLM | A learned policy selects between a stronger and weaker model using a configurable threshold. | Can reduce expensive-model calls when its predictions transfer to your workload. Router evaluation, training-data fit, and misrouted requests matter. [7] |
| OpenRouter | A unified API routes requests to providers, supports model fallbacks, and optionally chooses models through an automatic router. | Useful for provider access and operational flexibility. Explicitly configure which provider or model decisions you delegate. [2][3][8] |

Two of those names share an origin, which is part of why they get cited in the same breath. LMSYS, the Large Model Systems Organization, is the research organization associated with both SGLang and RouteLLM. A serving runtime and a routing policy are still different things to adopt. [9]

The serving layer has the stronger deployment evidence. LinkedIn reported more than 50 generative-AI use cases on vLLM across thousands of hosts in 2025. That is evidence the engine runs in production, not a count of all vLLM users, and not evidence that those applications switch models automatically. [10]

The routing layer has narrower evidence, and it is real. RouteLLM's paper reports substantial cost reductions while preserving a target level of quality on evaluated benchmarks, for specified models, datasets, and routing policies. It does not establish savings for a long-running agent with model-specific tools, cached context, and recovery behavior. That gap is exactly what your own measurement has to close. [7]

## The cost incentive has to survive the whole system

Compare **cost per successful task** at an acceptable quality and latency level. Include router calls, input and output tokens, cache misses, retries, escalation, and the engineering work needed to maintain and evaluate each supported configuration. Amortize that engineering work over the actual workload.

At sufficient volume, routing savings can outweigh those costs. For a modest workload with a well-tuned agent, the savings may be too small to justify another moving part. The relevant claim is conditional: routing needs a demonstrated net benefit. There is no basis here for declaring either universal savings or universal lack of incentive.

Availability is not adoption, and the same gap opens one layer down in [deterministic serving](/blog/stop-calling-llms-non-deterministic). vLLM and SGLang both expose opt-in reproducibility, with constraints and performance trade-offs that have to be evaluated on the stack you deployed. A switch that exists in the engine is not a property of the system you shipped. That holds for batch invariance, and it holds for model selection. [11][12]

## Specialization is a business advantage to earn

A focused system can be faster because it performs fewer irrelevant steps and parallelizes independent work. It can be cheaper because it carries less unnecessary context and uses an adequate model for each task. It can be more correct because its retrieval, tools, and checks match the domain. Those are mechanisms to exploit, not automatic rewards for adding agents.

Compete on the work customers actually bring you. Measure completion time, total cost per successful task, and task-specific correctness against the current system and credible alternatives. Improve the specialist that limits those results. You do not need general superiority over every model or every competitor to build a better product for a particular job.

## The decision

Route work to the specialist that owns it. Invoke subagents where bounded context or parallel work improves the workflow. Treat model choice, including a routing policy, as a parameter to evaluate inside that specialist.

Keeping a tested model stable lets harness improvements accumulate. Changing it is justified when the complete system improves. The target is a specialized business workflow that delivers faster, cheaper, and more correct results, measured on the tasks that matter.

## References

1. [OpenAI. Model guidance: Using GPT-6 Astra.](https://developers.openai.com/api/docs/guides/latest-model)
2. [OpenRouter. Prompt caching.](https://openrouter.ai/docs/guides/best-practices/prompt-caching)
3. [OpenRouter. Auto Router, including session stickiness.](https://openrouter.ai/docs/guides/routing/routers/auto-router)
4. [Anyscale. Architecture.](https://docs.anyscale.com/get-started/architecture) See also [Anyscale Services](https://docs.anyscale.com/services).
5. [vLLM. Paged attention.](https://docs.vllm.ai/en/stable/design/paged_attention/)
6. [Zheng et al. SGLang: Efficient Execution of Structured Language Model Programs.](https://arxiv.org/abs/2312.07104)
7. [Ong et al. RouteLLM: Learning to Route LLMs from Preference Data.](https://arxiv.org/abs/2406.18665)
8. [OpenRouter. Provider routing.](https://openrouter.ai/docs/guides/routing/provider-selection)
9. [LMSYS. About.](https://www.lmsys.org/about/)
10. [LinkedIn Engineering. How we leveraged vLLM to power our GenAI applications, 2025.](https://www.linkedin.com/blog/engineering/ai/how-we-leveraged-vllm-to-power-our-genai-applications)
11. [SGLang. Deterministic inference.](https://docs.sglang.io/docs/advanced_features/deterministic_inference)
12. [vLLM. Batch invariance.](https://docs.vllm.ai/en/stable/features/batch_invariance/)
13. [Anthropic. How we built our multi-agent research system, 2025.](https://www.anthropic.com/engineering/multi-agent-research-system)
14. [ARC Prize. ARC-AGI-3 Semi-Private leaderboard: Astra under the Standard and Provider Adapter harnesses.](https://arcprize.org/leaderboard)
