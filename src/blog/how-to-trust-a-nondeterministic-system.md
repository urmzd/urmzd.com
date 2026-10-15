---
title: How to Trust a Nondeterministic System
description: Understanding why identical requests diverge helps you build meaningful evals. Trust depends on reproducibility, judge quality, and test coverage.
pubDate: 2026-09-16
tags:
  - ai
  - critical-thinking
  - inference
  - evals
  - architecture
shareText: Understanding how your models run gives you more control over their behaviour.
draft: true
---
Other people's traffic was one place I hadn't looked.

A response that passed your eval, or just your vibe check, can fail on another run even when your request hasn't changed. Understanding why is part of learning to trust the system. Exact replay helps isolate regressions; confidence also depends on the quality of your judge and whether your tests cover the situations your system will face.

## Being wrong in public

The question came at me twice, from two different people: if everything else is the same, and two identical prompts reach an LLM, why would it produce a different result?

My answer both times was that the premise was false. Everything else *wasn't* the same. Something upstream had changed: a tool call returned different data, a timestamp moved, a retrieved document was updated, a system prompt got tweaked. Something had caused a different token to be produced.

Autoregressive LLMs generate text one token at a time, using the preceding tokens to predict the next. One token's difference can cascade because it changes the prefix used for later predictions. The continuations may overlap or reach the same conclusion, but they can also become completely different responses. You don't need a big perturbation to get a completely different essay. You need one token, once.

What I had wrong was where to look for it. I searched the inputs exhaustively and never searched the execution, because I was thinking about the LLM as a mathematical function, not the LLM as a deployed system. The variable could have been in the execution.

## Your prompt does not arrive alone

Your prompt doesn't reach the model by itself. It's grouped with whatever other requests are in flight at that instant, because grouping requests is how you keep a very expensive GPU busy. That group is a batch, and its size changes constantly with traffic. Changing the batch size can change how a kernel, the code doing the calculation, groups its additions. Floating-point addition is not associative: changing the grouping can change the result.

For example, Python's integers preserve the exact result. Its floats can lose the small term to rounding:

```python
>>> (1 + 10**64) - 10**64
1
>>> (1.0 + 10.0**64) - 10.0**64
0.0
>>> 1.0 + (10.0**64 - 10.0**64)
1.0
```

The two float expressions use the same values. In the first, the `1.0` is lost when added to the large number. In the second, the large numbers cancel first, preserving it.

How does that become a different answer? Greedy decoding, usually selected with temperature 0, picks the token with the highest score: the argmax. If two token scores are nearly tied, a tiny numerical difference can reverse their order. A different token wins, changes the prefix, and can send the rest of the answer in a different direction. The Python example exaggerates the scale to make rounding visible; a token flip only needs a change large enough to cross the gap between the leading scores.

Sampling variance and execution variance are different things. With nonzero temperature and fresh random draws, the sampler can choose different tokens even from identical scores. That deliberate randomness can overshadow numerical effects, but temperature alone doesn't tell you which source dominates for your workload. At temperature 0, greedy decoding removes the random draw; execution can still change the scores it chooses from. A fixed seed helps repeat sampling, but doesn't repair changing arithmetic.

You may not even get those controls. [Anthropic documents models that accept only default sampling settings, alongside adaptive thinking that decides when and how much to reason](https://platform.claude.com/docs/en/build-with-claude/thinking). An effort setting can steer that behaviour where available; it doesn't fix the exact computation performed on every request. As architectures and serving systems change, the controls exposed to you change too. A provider's general-purpose configuration may not give you the controls your particular workflow needs. Your eval has to test the system you can actually call.

Batch size isn't the only moving part. Processing a prompt in chunks or reusing a cached prefix can also change where sums are split and combined. Reproducible execution needs to handle those boundaries consistently, too.

The request can be identical while its execution changes. Calling the endpoint non-deterministic is fair. Assuming that variation is an unavoidable property of the model is where the explanation falls short.

One correction to the folk version of this story, which I believed for a while: parallel execution does not by itself explain the variation. Thinking Machines describes how common forward-pass kernels can be repeatable for a fixed shape while giving different results across batch shapes. That distinction matters because the fix is different. You don't have to stop distributing work. You have to preserve the reduction order for each request across batch sizes. That doesn't make floating-point addition associative. It makes the rounding behaviour repeatable.

## The fix exists

In September 2025, Thinking Machines published [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). It explains the batch-shape mechanism and demonstrates batch-invariant kernels: arithmetic whose results do not depend on which other requests share the batch. With those kernels enabled, all 1,000 completions in its test of Qwen3-235B-A22B-Instruct-2507 at temperature zero were identical.

This is available in serving software, too. vLLM runs language models and schedules incoming requests. [Its documentation describes an opt-in batch-invariance mode](https://docs.vllm.ai/en/stable/features/batch_invariance/), enabled with `VLLM_BATCH_INVARIANT=1`. Its documentation marks the feature as beta, describes supported hardware and tested models, and warns of a possible performance impact. It is a supported path with constraints, not a guarantee for every deployment. Batch invariance does not promise identical results across hardware, software versions, or precision changes.

The distinction is between an operator having a switch and an API customer receiving a guarantee. The first does not automatically give you the second.

[Fireworks provides one example of this in practice](https://fireworks.ai/blog/frontier-lab-training-infrastructure-as-a-service): batch-invariant serving and matching training and inference numerics for GLM 5.2 LoRA training. It illustrates how controlling execution can support a workflow built for a specific use case.

*Disclosure: I work at Fireworks. The views in this post are my own.*

Open source matters here because it lets you inspect and change the serving software. Ownership gives you the ability to hold a version steady, investigate a failure, and decide when to change how your system runs. That control matters over time, as the systems underneath your workflow evolve. Even when you don't own the infrastructure, you still need to understand what you're consuming. Writing tests against a database without understanding its transaction guarantees or retry behaviour is how you end up surprised in production. Agent workflows deserve the same scrutiny. At the scale they execute, a rare failure can become a recurring problem, especially when each run can take actions beyond generating text. Your evals need to reflect those consequences.

## What I'd say now

Understanding what can go wrong, and why, is how you write meaningful evals. Batch-dependent numerics are one example. Once you understand the mechanism, you can test whether failure rates change under different serving loads instead of treating every changed answer as the same kind of failure.

And if your evaluator is itself an LLM, there's another moving part. Your system can produce a different answer, and your judge can give the same answer a different score. When a score changes, you need to know which one moved before calling it an improvement or a regression.

Consider an invoice assistant that must identify a duplicate $40 charge. Freeze the invoice, policy, prompt, model version, and tool responses. Where the model supports it, use greedy decoding, commonly temperature 0, to remove deliberate sampling. Otherwise, hold the exposed settings fixed and treat sampling or adaptive reasoning as part of the system being measured. On a deployment you control, run the same case 100 times under a fixed low-load configuration, then 100 times while varying background traffic. Interleave the conditions and log the actual batch shapes where possible: steady request traffic alone doesn't guarantee identical batches. Check the refund amount and permitted action with code, and record exact-output agreement separately from task success.

Suppose 99 of the first 100 runs pass and 94 of the second 100 pass. Those are hypothetical numbers, not measurements. They flag a difference to investigate, not proof that batching caused it. Repeat the comparison and estimate uncertainty before calling it a load effect; then repeat across representative cases. One invoice and 100 runs are an illustration, not a universal sample-size rule.

Now hold one saved answer fixed and ask the same LLM judge to score it 100 times in independent calls, keeping its rubric, model, and any exposed sampling or reasoning settings fixed. If it passes the answer 87 times and fails it 13, the answer didn't change: the evaluation did. Compare the judge against human-reviewed examples too. A judge that repeats the same wrong verdict is consistent, but still wrong.

For a closed API, you may not control or even observe batching. Measure variation across repeated calls at different times and client concurrency levels, recording the model version and settings the provider exposes, along with reasoning-token usage when available. These tests measure the endpoint's observed behaviour; they don't reveal its internal batch sizes or isolate the cause. Measure that uncertainty rather than assuming it away, and evaluate with the same configuration you deploy, including provider-managed defaults and adaptive reasoning. Rerun the eval when that configuration or the model changes.

All of this takes compute, time, and human attention. Direct checks reduce dependence on a judge where an answer can be verified mechanically. Repeated runs help separate a stable pattern from a lucky result. This is one reason meaningful evals are expensive.

Even then, your results describe the cases and conditions you tested. Production brings different inputs, traffic, tool results, and combinations you didn't anticipate. Repeating the same test helps measure variation within that test; it doesn't make the test representative of everything your system will encounter.

Exact replay helps isolate regressions by removing one source of variation. It doesn't make a judge correct or a test representative. The more you understand the systems you work with, the better you can decide what to test, what to control, and how much confidence the result deserves.

## References

1. Horace He et al. [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). Thinking Machines Lab, September 10, 2025.
2. vLLM. [Batch Invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/). Documentation, accessed September 12, 2026.
3. Fireworks AI. [Frontier-lab Training Infrastructure, Available Now as a Managed Service for GLM 5.2](https://fireworks.ai/blog/frontier-lab-training-infrastructure-as-a-service). June 24, 2026.
4. Anthropic. [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking). Documentation, accessed October 8, 2026.
