---
title: How to Trust a Nondeterministic System
description: The model is a fixed function. Reproducible serving is possible. Its performance cost depends on the implementation, and its value depends on the workload.
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
People keep telling me that large language models are non-deterministic, as though variation were inevitable. It isn't. The mathematical model is a fixed function. Sampling can deliberately introduce randomness, and the machinery we've built to serve the model at scale can introduce variation of its own. A response that passed your eval, or just your vibe check, can fail on another run even when your request hasn't changed.

## Being wrong in public

The question came at me twice, from two different people: if everything else is the same, and two identical prompts reach an LLM, why would it produce a different result?

My answer both times was that the premise was false. Everything else *wasn't* the same. Something upstream had changed: a tool call returned different data, a timestamp moved, a retrieved document was updated, a system prompt got tweaked. Something had caused a different token to be produced.

Autoregressive LLMs generate text one token at a time, using the preceding tokens to predict the next. One token's difference can cascade because it changes the prefix used for later predictions. The continuations may overlap or reach the same conclusion, but they can also become completely different responses. You don't need a big perturbation to get a completely different essay. You need one token, once.

What I had wrong was where to look for it. I searched the inputs exhaustively and never searched the execution, because I was thinking about the LLM as a mathematical function, not the LLM as a deployed system. The variable could have been in the execution. Other people's traffic was one place I hadn't looked.

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

Batch size isn't the only moving part. Processing a prompt in chunks or reusing a cached prefix can also change where sums are split and combined. Reproducible execution needs to handle those boundaries consistently, too.

The request can be identical while its execution changes. Calling the endpoint non-deterministic is fair. Assuming that variation is an unavoidable property of the model is where the explanation falls short.

One correction to the folk version of this story, which I believed for a while: parallel execution does not by itself explain the variation. Thinking Machines describes how common forward-pass kernels can be repeatable for a fixed shape while giving different results across batch shapes. That distinction matters because the fix is different. You don't have to stop distributing work. You have to preserve the reduction order for each request across batch sizes. That doesn't make floating-point addition associative. It makes the rounding behaviour repeatable.

## The fix exists

In September 2025, Thinking Machines published [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). It explains the batch-shape mechanism and demonstrates batch-invariant kernels: arithmetic whose results do not depend on which other requests share the batch. With those kernels enabled, all 1,000 completions in its test of Qwen3-235B-A22B-Instruct-2507 at temperature zero were identical.

This is available in serving software, too. vLLM runs language models and schedules incoming requests. [Its documentation describes an opt-in batch-invariance mode](https://docs.vllm.ai/en/stable/features/batch_invariance/), enabled with `VLLM_BATCH_INVARIANT=1`. Its documentation marks the feature as beta, describes supported hardware and tested models, and warns of a possible performance impact. It is a supported path with constraints, not a guarantee for every deployment. Batch invariance does not promise identical results across hardware, software versions, or precision changes.

The distinction is between an operator having a switch and an API customer receiving a guarantee. The first does not automatically give you the second.

[Fireworks provides one example of this in practice](https://fireworks.ai/blog/frontier-lab-training-infrastructure-as-a-service): batch-invariant serving and matching training and inference numerics for GLM 5.2 LoRA training. It illustrates how controlling execution can support a workflow built for a specific use case.

*Disclosure: I work at Fireworks. The views in this post are my own.*

This is one of the reasons open source matters. It gives you the ability to inspect and change the software, manage your infrastructure, and control how your models are served. That ownership lets you tailor workflows to your use case, including what you hold fixed and what you test. But making those decisions requires understanding the systems you depend on and ingest outputs from: how they run, where variation enters, and what can go wrong. Meaningful evals start with that understanding.

## What I'd say now

Understanding what can go wrong, and why, is how you write meaningful evals. Batch-dependent numerics are one example. Once you understand the mechanism, you can test whether failure rates change under different serving loads instead of treating every changed answer as the same kind of failure.

And if your evaluator is itself an LLM, there's another moving part. Your system can produce a different answer, and your judge can give the same answer a different score. When a score changes, you need to know which one moved before calling it an improvement or a regression.

That means repeating runs, holding the answer fixed while checking the judge, and comparing its judgments against examples you've already reviewed. Use direct checks where you can: a total either matches the source records or it doesn't. Save judgment for the parts that actually need it. Those checks take compute, time, and human attention. This is one reason meaningful evals are expensive.

Even then, your results describe the cases and conditions you tested. Production brings different inputs, traffic, tool results, and combinations you didn't anticipate. Repeating the same test helps measure variation within that test; it doesn't make the test representative of everything your system will encounter.

Exact replay helps isolate regressions by removing one source of variation. It doesn't make a judge correct or a test representative. The more you understand the systems you work with, the better you can decide what to test, what to control, and how much confidence the result deserves.

## References

1. Horace He et al. [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). Thinking Machines Lab, September 10, 2025.
2. vLLM. [Batch Invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/). Documentation, accessed September 12, 2026.
3. Fireworks AI. [Frontier-lab Training Infrastructure, Available Now as a Managed Service for GLM 5.2](https://fireworks.ai/blog/frontier-lab-training-infrastructure-as-a-service). June 24, 2026.
