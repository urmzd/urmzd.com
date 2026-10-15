---
title: "To Route Or Not To Route? For That Is the Question"
description: "Define the use case and its evals first. Test whether model routing improves cost, latency, and correctness over the best fixed configuration."
pubDate: 2026-09-18
tags: ["tech", "ai", "agents", "architecture", "cost"]
shareText: "Can a router choose a better model for each request? Start with the work you need to solve and the evals that define success. Then measure whether selection beats the best fixed configuration, including its mistakes and overhead."
draft: true
---

Your business does not need to solve AGI. It needs to solve the problems customers pay it to solve correctly, at a profitable price point fast. Before asking which model should handle a request, decide what a successful result looks like. Build the evals for that use case. Then compare the systems that might deliver it. That ordering changes the routing question. Can an LLM predict which model will do better than a human can? Perhaps, but do you really need that for your use case? 

## Start with the disputed invoice

Consider a customer disputing an invoice. A useful answer needs the invoice, account terms, payment history, and possibly shipment records. It must identify the disputed charge, apply the right policy, and either resolve the issue or hand it to someone authorized to act.

A fluent explanation is insufficient. The refund amount must be correct. The evidence must support the decision. An unauthorized refund is a failure even if the customer likes the response.

Write those requirements into cases before choosing an architecture:

| Case | What success requires | Failure to catch |
|---|---|---|
| Duplicate charge | Identify the duplicate and follow the permitted refund process | Refunding both charges |
| Delivery dispute | Use shipment evidence and the applicable account terms | Treating a customer claim as verified delivery evidence |
| Missing records | Request the missing evidence or escalate | Inventing a payment or shipment status |
| Policy exception | Recognize the authorization boundary and hand off with context | Taking an action outside the agent's permissions |

Build a representative set from the work you expect, with a separate set of difficult and high-impact cases. Track results by case type as well as overall. A good average should not hide unauthorized actions in a small category.

Use code to check amounts and tool actions, source records to check factual claims, and explicit review criteria where judgment is required. Define acceptable completion time and cost alongside correctness. These are the conditions a candidate must meet, including a candidate that uses no router.

Keep development cases separate from held-out evaluation cases. Tune prompts and routing thresholds on the former; use the latter to assess whether the improvement survives unfamiliar requests. Keep related versions of the same dispute together so the test does not become a memory exercise.

## Evaluate the thing you would ship

**The unit you ship is the model plus its harness.** By harness, I mean the prompts, tools, context management, execution loop, checks, and recovery behavior around the model.

For the invoice workflow, start with a fixed model and the tools needed to finish the task. Run the cases. Record whether the task succeeded, which actions it took, elapsed time, and total cost, including failed attempts and retries.

Then compare candidate models on the same cases. Holding the harness fixed initially helps isolate the effect of changing the model. If a candidate needs different instructions or tool descriptions, evaluate that adapted configuration separately. Record the configuration that produced each result so the comparison can be repeated.

Two questions matter here: what happens when I swap a model into this system, and what is the best system I can build with each candidate? A fixed-harness experiment answers the first. Allowing adaptation addresses the second and adds engineering effort to the comparison.

When a run fails, inspect the failing step. Missing shipment records call for a retrieval fix. An incorrect total may call for a calculation tool. Misreading an exception may call for clearer policy context or a more capable model. Changing the model is one intervention to test.

Choose a fixed baseline that meets the quality and latency requirements at an acceptable cost. If none does, improve the workflow or test additional configurations. Adding selection among inadequate candidates does not by itself solve the task.

## The harness is where the comparison gets interesting

Public benchmarks can help explain why the configuration matters. ARC Prize distinguishes its Standard harness, which carries forward model-selected notes, from its Provider Adapter harness, which preserves reasoning state and compacts longer conversations. Those are materially different ways of giving a model access to its prior work. [2]

The earlier draft captured the following Astra results for ARC-AGI-3 Semi-Private:

> Draft verification note: these figures are restored from the earlier draft. Confirm the exact leaderboard snapshot, score definition, and cost units before publication; the currently accessible page text does not expose these rows.

| Reasoning effort | Standard harness | Provider Adapter harness |
|---|---|---|
| max | 62.7%, $26,098 | 98.6%, $17,332 |
| xhigh | 59.3%, $37,317 | 98.4%, $18,147 |
| high | 54.8%, $40,705 | 99.9%, $18,817 |
| medium | 38.6%, $48,090 | 98.4%, $19,285 |
| low | 17.5%, $38,166 | 98.0%, $21,298 |
| none | 35.2%, $49,791 | 96.7%, $23,457 |

Taking those recorded figures at face value, the `high` row moves from 54.8% to 99.9%, while the listed cost falls from $40,705 to $18,817. Within the Provider Adapter column, scores stay between 96.7% and 99.9%. Within the Standard column, both score and cost vary much more. The configuration changes the apparent value of the reasoning-effort setting.

That is the idea worth preserving: a setting with a lower reasoning budget need not produce a cheaper completed task. More attempts, repeated tool calls, and lost context can consume the saving. To explain a particular benchmark result, inspect its execution traces and accounting rather than inferring the cause from the score alone.

This comparison motivates testing the harness. It cannot establish that harness work usually beats model swaps, or predict the gain for an invoice workflow. Our evals still have to answer that question. A public score tells us what a particular system achieved under particular conditions.

### Model-specific integration is part of the experiment

The practical work lives in details: which tool descriptions the model follows, when it asks for clarification, how much testing it performs, when it delegates, what survives context compaction, and how it recovers from a failed action. Each behavior can affect correctness, tokens, and elapsed time.

For the invoice workflow, asking for clarification when the records already settle the dispute adds delay. Acting without clarification when essential evidence is missing creates a different failure. The harness needs to distinguish those situations, and the eval cases need to catch both.

Keeping a model stable lets you accumulate validated improvements. Changing it may require retuning prompts, tools, or recovery behavior. That is a reason to account for integration effort, rather than a reason to rule out switching. Some improvements will transfer; others will not.

Routing expands this experiment. Every supported model-and-harness configuration needs coverage, along with the selection policy and fallback paths. A passing eval for one pinned configuration does not validate the entire routed system.

## Is there anything useful to route?

Look at where the candidates succeed and fail, rather than only their average scores.

Suppose a cheaper configuration reliably handles duplicate charges, while another handles policy exceptions more accurately. That creates a possible opportunity: send routine disputes to the cheaper configuration and reserve the more expensive one for cases that need it.

The difficult part is knowing which case has arrived. The router sees the information available at the decision point. It does not get to inspect the eventual correct answer before selecting a model.

An offline comparison can estimate the opportunity by asking what would happen if you always selected the cheapest successful configuration for each case. That is an optimistic reference, based on observed runs, rather than a deployable policy. Repeated runs matter when outcomes vary. If even this hindsight selection offers little benefit over the fixed baseline, there is little room to pay for a router.

If there is room, test whether a policy can capture it using information actually available when the request arrives. A known dispute category might support a simple rule. Less obvious distinctions might require a learned selector. An LLM is another candidate for that job, and its own cost and selection errors belong in the evaluation.

[RouteLLM](https://arxiv.org/abs/2406.18665) provides evidence that learned selection can reduce costs while maintaining response quality on evaluated benchmarks. It trains routers using preference data and selects between stronger and weaker models. Those results justify testing the idea; they do not establish the outcome for our invoice workflow. [1]

## Compare the policy with the baseline

Run the complete routing policy on the held-out cases, alongside the fixed baseline. Include the router's input processing, any additional retrieval, the selected model's work, retries, and escalation.

For the disputed invoice, a cheap first attempt followed by an expensive retry may cost more and take longer than using the stronger configuration immediately. An incorrect refund that escapes detection is worse: the system has failed even though its token bill looks excellent.

Use **cost per successful task** alongside success rate and latency. Divide the cost of all attempts, including failures, by the number of successful tasks. Report critical failure categories separately. A lower cost per success cannot excuse crossing an authorization boundary.

Decide what would count as a worthwhile improvement before looking at the final results. Test enough cases and repeat variable runs to distinguish a useful gain from noise. If you change the policy after inspecting held-out failures, evaluate the revision on fresh cases.

If the question really is whether an LLM selects better than humans, give both the same request information, candidate configurations, and decision criteria. Measure the resulting task outcomes and the cost of selection. That is a separate experiment from beating a model an engineer chose once for the entire workflow.

For deployment, the fixed baseline is the first comparison to beat. A simple routing rule is a useful additional baseline when the task already exposes categories. The more elaborate selector has to earn its extra work.

## Where specialization fits

Agent routing chooses a workflow with its own responsibilities, tools, context, and checks. Model routing chooses a model within a workflow. A gateway centralizes access and operational policy. These decisions can coexist, but an eval should tell you which one helps.

In the invoice example, separating billing from delivery investigation might reduce irrelevant context and make each responsibility easier to validate. A coordinator could ask a delivery specialist for shipment evidence while a billing specialist checks the charge. Both specialists could use the same model.

That architecture also creates new failure modes. The coordinator might choose the wrong specialist, omit account terms, or receive a summary that drops an important exception. Run the complete dispute through the evals, including handoffs. Better isolated specialist scores are insufficient if the customer-facing workflow gets worse.

Specialize when the boundaries improve measured outcomes. Add model selection within a specialist when the cases show a further benefit. The evals come before either architectural commitment.

## What the tools actually do

Once the evals expose a bottleneck, the tooling comparison becomes useful. Are we trying to run inference more efficiently, centralize access and operational policy, or select a different model for each request? Those changes affect different parts of the system.

A gateway can centralize redaction, logging, provider access, and outage handling while an application keeps its model fixed. Adopting that operational boundary does not require delegating model selection.

| Project | What happens in the request path | What to evaluate for our use case |
|---|---|---|
| Anyscale / Ray Serve | Anyscale manages Ray infrastructure; Ray Serve runs and scales application deployments, which can include inference engines and routing logic. [3] | Capacity, scaling, reliability, and operational cost for the deployed workflow. |
| vLLM | An inference engine runs model weights with request scheduling and efficient attention-memory management. [4] | Throughput, latency, memory use, and task outcomes under the chosen serving configuration. |
| SGLang | A runtime executes language-model programs and reuses shared prefixes through its serving machinery. [5] | Whether context reuse and scheduling improve the workload's serving efficiency. |
| RouteLLM | A learned policy selects between stronger and weaker models. [1] | Whether its selection behavior transfers to our cases and saves money at the required quality. |
| OpenRouter | A unified API provides model/provider access; its optional Auto Router selects models for requests. [6] | Which choices we delegate, selection errors, fallback behavior, and total cost and latency. |

A serving engine's throughput improvement and a router's selection improvement need different experiments. We can test an engine with a fixed model, then test selection across configurations. If we change both together, the complete system may improve, but we have less evidence about which change produced the gain.

These tools can compose. Ray Serve can host an application with a routing policy; a selected model can run on an inference engine. The existence or popularity of any one layer does not establish that automatic model selection benefits our workflow.

## The savings must survive deployment

A routing result also has to survive the conditions of the service you operate.

Long sessions may reuse cached instructions, tool definitions, and conversation history. Switching models or providers can change cache reuse and input-processing costs. If selection happens mid-session, test how the next model interprets prior tool results and unresolved actions. Measure those effects in the actual deployment rather than assuming a per-token price captures them.

Include the engineering work needed to maintain and evaluate each supported configuration, amortized over the expected workload. A small saving per request can justify that work at sufficient volume. At lower volume, the fixed configuration may remain cheaper overall.

After deployment, record routing decisions and task outcomes. Recheck the policy as the request mix, models, prices, or harnesses change. Keep the fixed baseline available for comparison and rollback. A policy that worked on last month's disputes still needs evidence that it works on this month's.

## The decision

Start with the work customers bring you and the evals that define success. Establish a fixed baseline. Inspect where alternative configurations offer a useful advantage, then test whether a selector can recognize those cases cheaply and reliably enough to improve the whole workflow.

The answer to whether we should route belongs in those results.

## References

1. Ong et al. [RouteLLM: Learning to Route LLMs with Preference Data](https://arxiv.org/abs/2406.18665). Revised February 2025.
2. ARC Prize. [ARC-AGI leaderboard and harness descriptions](https://arcprize.org/leaderboard). Exact figures in the restored table require snapshot verification.
3. Anyscale. [Platform architecture](https://docs.anyscale.com/get-started/architecture) and [Services](https://docs.anyscale.com/services).
4. vLLM. [Paged Attention](https://docs.vllm.ai/en/stable/design/paged_attention/).
5. Zheng et al. [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104).
6. OpenRouter. [Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router).
