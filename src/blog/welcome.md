---
title: "Hey, I'm Urmzd!"
description: "The meaning behind 'Urmzd' — from its Zoroastrian roots in ancient Badakhshan to the principles of honesty, freedom, and family that guide everything on this site. Plus: the math that powers AI search."
pubDate: 2026-01-31
tags: ["introduction", "personal"]
shareText: "Meet Urmzd — a name rooted in ancient wisdom, a mind driven by honesty, freedom, and family. This is his story, from Zoroastrian etymology to cosine similarity."
---

Hey! I'm Urmzd Mukhammadnaim (/ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/), and welcome to **urmzd.com**!

My father — a history enthusiast from [Badakhshan](https://en.wikipedia.org/wiki/Badakhshan_Province), Afghanistan, believed to be the homeland of the prophet [Zoroaster](https://en.wikipedia.org/wiki/Zoroaster) — gave me a name steeped in ancient meaning. *Urmzd* derives from "Ahura Mazda", the supreme deity of [Zoroastrianism](https://en.wikipedia.org/wiki/Zoroastrianism), humanity's oldest monotheistic faith. The name combines the [Proto-Indo-Iranian](https://en.wikipedia.org/wiki/Proto-Indo-Iranian_language) words *Ahura* ("Lord") and *Mazda* ("Wisdom") — together meaning "Lord of Wisdom." The deeper etymology reveals even more: *Ahura* traces to Proto-Indo-European roots meaning "to engender, beget," while *Mazda* comes from "placing one's mind" — to give rise to one's mind, or as I hold it, to shape and share knowledge.

This name holds great meaning to me, and this site is my attempt to stay true to it.

This is meant to be a living document — posts may be refined, opinions may evolve, and ideas may deepen as I grow. Since I value transparency and honesty, all changes are tracked on [github.com/urmzd/urmzd.com](https://github.com/urmzd/urmzd.com), where you can see exactly what evolved and when. There, you can explore, analyze, and critique it to your heart's desire.
You can open up issues if you want to request a specific topic be covered. Alternatively, if you aren't in tech like the vast majority of people,
just shoot an email to [hello@urmzd.com](mailto:hello@urmzd.com). I commit to responding as reasonably soon as I can. For now, I plan on publishing one written piece a week, but more often if time allows for it!

A small note before we continue: each post will close with a brief snippet from a different domain. I hope that by sharing these, it'll encourage people to explore topics beyond what they know or believe they know.

What does staying true to that name look like in practice? It starts with three principles that guide everything I do.

## Core Principles

I hold *honesty*, *freedom*, and *family* dear to me. These core principles inform the decisions I make.

- Honesty: *The pursuit and belief in absolute truth within oneself.*
- Freedom: *A state in which one is unbounded by the assumptions created internally or externally*
- Family: *Relationships in which the kindness received produces profound changes to the state of one's life*

With this in mind, I believe it's difficult to learn about someone without understanding their story. Instead of just describing who I am, let me show you through the milestones that shaped me.

## The Timeline

<!-- embed:welcome-timeline -->

That's the path so far. Now, as promised, here's something to spark curiosity in a completely different direction.

## Snippet of the Week

With the rapid development and integration of LLMs, I believe it's important to understand the foundations that brought us here — the people, the discoveries, and how those changes shaped where we are today.

<details>
<summary>Cosine Similarity — The Math Behind AI Search</summary>

#### The Foundation

To learn more about the people, take a look here:

- [History of Trigonometry](https://en.wikipedia.org/wiki/History_of_trigonometry)

To learn more about the math, take a look here:

- [Dot Product](https://en.wikipedia.org/wiki/Dot_product)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)

#### The Math

**Vector** — An ordered list of numbers representing a point or direction in n-dimensional space:

$$
\vec{v} = \begin{bmatrix} v_1 \\ v_2 \\ \vdots \\ v_n \end{bmatrix} \in \mathbb{R}^n
$$

**Dot Product** — The sum of element-wise products of two vectors:

$$
\vec{a} \cdot \vec{b} = \sum_{i=1}^{n} a_i \cdot b_i
$$

**Norm (Euclidean)** — The "length" or magnitude of a vector:

$$
\lVert\vec{v}\rVert = \sqrt{\sum_{i=1}^{n} v_i^2}
$$

**Cosine Similarity** — Measures directional similarity between two vectors (ranges from -1 to 1):

$$
\text{sim}(\vec{a}, \vec{b}) = \frac{\vec{a} \cdot \vec{b}}{\lVert\vec{a}\rVert \cdot \lVert\vec{b}\rVert}
$$

#### The Code

```python
from typing import TypeAlias
from math import sqrt

# A Vector is an N-dimensional point in space.
Vector: TypeAlias = list[float]

# An Embedding is a Vector that encodes semantic meaning.
Embedding: TypeAlias = Vector

# Dot product: sum of element-wise products of two vectors.
def dot_product(a_vec: Vector, b_vec: Vector) -> float:
    return sum(a*b for a,b in zip(a_vec, b_vec))

# Euclidean norm: the magnitude (length) of a vector.
def norm(vec: Vector) -> float:
    return sqrt(sum(a**2 for a in vec))

# Cosine similarity: measures directional alignment between two vectors (-1 to 1).
def cosine_similarity(a: Embedding, b: Embedding) -> float:
    return dot_product(a, b) / (norm(a) * norm(b))
```

#### The Connection

Modern LLMs like GPT, Claude, Gemini, and others convert text into high-dimensional vectors called **embeddings** — numerical representations that capture semantic meaning. Words, sentences, or entire documents that are similar in meaning end up as vectors pointing in similar directions.

When you search for something using an AI-powered tool, or when a chatbot retrieves relevant context from a knowledge base, **cosine similarity** is often the mechanism comparing your query's embedding against stored embeddings. This is the foundation of:

- **Semantic search**: Finding documents by meaning, not just keyword matches
- **Retrieval-Augmented Generation (RAG)**: Giving LLMs relevant context before answering
- **Recommendation systems**: Suggesting similar content based on vector proximity

The math above — developed centuries ago by mathematicians studying triangles and angles — now powers the similarity calculations running billions of times daily across AI systems worldwide.

</details>

## Recommended Books

Two books that have shaped my thinking:

- [Meditations: Marcus Aurelius](https://www.amazon.com/Meditations-Penguin-Classics-Marcus-Aurelius/dp/0140449337)
  - *On finding inner peace through accepting what we cannot control and living virtuously regardless of circumstance.*
- [Dare to Lead: Brené Brown](https://www.amazon.com/Dare-Lead-Brave-Conversations-Hearts/dp/0399592520)
  - *On the courage to be vulnerable and how authentic connection creates meaningful leadership.*
