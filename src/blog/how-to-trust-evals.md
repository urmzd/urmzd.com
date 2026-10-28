---
title: How to Trust Evals
description: Understanding why identical requests diverge helps you build meaningful evals. Trust depends on reproducibility, judge quality, and test coverage.
pubDate: 2026-10-13
tags:
  - ai
  - critical-thinking
  - inference
  - evals
  - architecture
shareText: Understanding how your models run gives you more control over their behaviour.
draft: true
codename: evals
---
You did the right thing, you split your evals into  an execution step and an verification step. After all, you got the perfect set up, right? You ran them and now and you finally have your long awaited traces. It's show time. You ran the analysis and like the sane engineer you are, you run them again, only to find out that the analysis differs but the input hasn't changed. In shock, you arrive at urmzd.com and you realize, you're not the only one who's running into this issue. 

A response that passed your eval can produce vastly different answers during analysis. Understanding the why is how you can build AI powered systems you can trust.

## Understanding Why

One fundamental piece of information that I came across as I was writing an evals platform is that good evals are hard to define and even harder to implement without knowing the risks. Which in hindsight, is somewhat obvious, right? Not really, it's seems counter intuitive to most folks coming from a traditional software background. A test should be as simple as that shown below, ...right?

```python
@your.favourite.framework.test(some_param="here")
def given_urmzd_is_bald__when_the_sun_shines__then_you_should_be_blinded():
	urmzd = give_me_urmzd()
	
	urmzd.make_him_bald()
	
	# obviously, this could be optimized
	you = give_me_you()
	
	# now, I'm clearly joking, I've forgotten how to code
	# hopefully, you should get the point I'm making
	assert bald_blind_check(urmzd, you) == True
```

Unfortunately, it's not that simple. Most evals are fundamentally split into categories and they serve different purposes. I want to make a key distinction before we go forward though as evals themselves are often ill-defined. So, let's quickly make a trip to dictionary town.

Evals, short for evaluations have two different meanings that differ based on their context but are oddly used interchangably. This interchangeable usage makes it much more confusing then it needs to be. So for my own sanity sake and yours, here are the definitions in their relevant contexts:

1. As a mechanism, evals are the process in which a system's behaviour is verified
2. As verification results, they are the analytics produced against the tests written.

However, I like to make things easy for myself. Hence, I like to treat Evals as a proper noun. Here, I define it as the set of processes which produce insights into the essence of a unknown system's correctness. So what do good Evals look like? I hinted it at it earlier, but in short, they are fundamentally split into execution (the run) and verification (the derived analytics). We'll break down why in a moment here, but bear with me. Then, within the verification step, you have two different ways to achieve your desired goal.

 1) You can use deterministic evaluations. These leverage checks that are repeatable, are well constructed and well defined. They produce the same result no matter how many times they're ran.
2) Alternatively, stochastic evaluations, my personal favorite nightmare. These leverage systems powered by the glory of probability to produce  results. There is no guarantee that the results will be the same [footer 1].

If you're following along, one keen observation you'll make is that I have yet to define the value of these Evals. Why, you ask? It's because even the deterministic Evals, when used incorrectly, can mislead you. In that sense, the hardest thing to really do is -- define the value of what you're testing, and what assumptions you're looking to validate. While both evaluation methods have their uses, you should be aware of what it really leverage stochastic evaluations.

## Not The Same

Modern uses of stochastic evaluations often leverage a technique called "LLM-as-a-judge", in effect leveraging an LLMs predictive capabilities / it's latent intelligence to complete the rubric you've defined for success.

Most LLMs currently out there are large scale implementations of autoregressive transformers. 
What that effectively means is that the generation (decoding) of a token is entirely dependent on everything that comes before it. As one can imagine, with these large architectures, decoding is expensive and memory bound. Alongside those factors, GPU capacity and the cost of electricity nudge inference providers to optimize their GPU utilization. One way of ensuring that the GPU utilization is optimal is batching requests and processing them in parallel. That means, at any given point, your request is almost never performed in isolation. So what does that really mean for your system? Well, it means that you're almost never guaranteed the same result. So while theoretically, LLMs can be deterministic, the mechanism for inference produces nondeterminism even when. 

## Understanding Why 

Most often the culprit is a mix of things, and such is the case even now. There are two different things we should understand if we hope to understand how to make our evals more reliable.

1. Floating point arithmetic has it's limitations
2. Batch invariance, or in other words, dynamic sized batches can change the downstream arithmetic 

There are two issues with floating point arithmetic.

### Association

So, floating-point addition are not associative: changing the grouping in which it's done can change the result. Let me just show you what I mean.

```python
>>> (1 + 10**64) - 10**64
1
>>> 1 + (10 ** 64 - 10 ** 64)
1
>>> (1.0 + 10.0**64) - 10.0**64
0.0
>>> 1.0 + (10.0**64 - 10.0**64)
1.0
```

While integers association is respected, floating point is not. If you want to know why, take a look into the floating point spec, IEEE-754. TLDR; it's a limitation of the spec itself. Grouping changes can impact the outcome of the calculation. However that's only one floating point arithmetic issue. 
### Precision

CPUs and GPUs differ in architecture but the same underlying principle pins them. Floating point arithmetic can only be so precise. While I'd love to go into the depths of fp16 vs bf16 vs fp32 - for clarity sake, lets use fp8 as an example. Using fp8 with the E4M3 variant, we get the following

```
[S EEEE MMM]
```

With that, you have 1 sign bit, 4 exponent bits and 3 mantissa bits which can be read using the formula:

```
(−1)^sign × 1.mantissa × 2^(exponent − bias)
```

In turn, that means you can roughly express values from -480 to 480 (1 1111 111) to (0 1111 111). So, what happens if you add the following two floating point numbers together?

> Disclaimer: in practice, the max range is +/- 448 since 0 1111 111 is reserved for NaN in fp8. For the sake of our example, we ignore that. Don't worry though, it doesn't really change the point being made.

```
1.625 (0 1000 101)
+
1.5 (0 1000 100) 
```

Well you'd expect to get the result 3.125 but that requires 4 mantissa bits and we only have 3...
So you could either round to 3 (0 1001 000) or 3.25 (0 1001 001) and neither are exactly 3.125, are they? To top it all off, that's all before the potential quantization and other tricks that might be happening in the background...

### Batch Invariance

One thing to realize is that the deployment and serving of LLMs is a complex distributed systems problem, and due to the economics of hosting them, inference providers bottom line is dependent on their inference serving efficiency. Dynamic batching is one such way of doing so.

Most serving stacks provide 

 in which requests that arrive within some proximate time are grouped and processed in parallel allowing for GPUs to process se. Some have rolling windows to maximize GPU utilization and due to the amazing abstraction 


## References

1. Horace He et al. [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). Thinking Machines Lab, September 10, 2025.
2. vLLM. [Batch Invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/). Documentation, accessed September 12, 2026.
3. Fireworks AI. [Frontier-lab Training Infrastructure, Available Now as a Managed Service for GLM 5.2](https://fireworks.ai/blog/frontier-lab-training-infrastructure-as-a-service). June 24, 2026.
4. Anthropic. [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking). Documentation, accessed October 8, 2026.
5. https://builder.aws.com/content/3GlmK8uXPjvrNLx8YnZEWxnlAzb/the-batch-changed-the-answer-shouldnt 
