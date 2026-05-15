# PasteLint

**Plain text that works everywhere.**

PasteLint is a privacy-first browser-based text cleanup and narration preparation toolkit.

It helps clean messy pasted text from:

* PDFs
* AI tools
* websites
* emails
* Word documents
* OCR exports
* copied transcripts
* IVR scripts
* accessibility workflows

Everything runs locally in the browser.
No uploads. No accounts. No APIs. No backend.

---

# Live Project

[https://guyt1225.github.io/pastelint/](https://guyt1225.github.io/pastelint/)

---

# Core Philosophy

PasteLint is intentionally designed as:

* browser-only
* privacy-first
* lightweight
* explainable
* accessibility-aware
* speech-aware
* utility-focused

The goal is not to create an “AI humanizer” or detector bypass tool.

The goal is to:

* improve readability
* reduce formatting friction
* improve narration flow
* improve accessibility
* improve spoken-text usability
* preserve meaning while making text easier to reuse

PasteLint aims to feel more like a trusted public utility than a hype-driven AI product.

---

# Current Tools

## PasteLint Clean

Cleans messy pasted text and formatting problems.

Current capabilities:

* extra spacing cleanup
* punctuation spacing repair
* hidden character detection
* smart quote normalization
* repeated word detection
* typo correction
* line ending normalization
* paragraph cleanup
* narration-aware symbol detection
* speech-risk detection

The system also includes:

* Text Brief
* What PasteLint Found
* Edit Map
* Visual cleanup preview

---

## SecondDraft

SecondDraft improves readability, tone, rhythm, and flow while preserving the original meaning.

The goal is not aggressive rewriting.

The goal is restrained revision.

Planned areas of focus:

* filler reduction
* readability improvement
* sentence rhythm balancing
* structure smoothing
* accessibility-aware rewriting
* narration-aware cadence
* tone controls
* paragraph reflow

SecondDraft is intentionally designed to avoid:

* synonym spinning
* detector bypass behavior
* meaning distortion
* over-polished AI tone

---

## SSML Builder

SSML Builder prepares text for:

* Amazon Polly
* IVR systems
* narration workflows
* screen readers
* speech synthesis
* accessibility systems

Current features include:

* Polly-safe formatting
* DB number normalization
* chunk generation
* speech pacing cleanup
* special character normalization
* narration-safe structure cleanup
* readable spoken formatting

The builder was originally developed to support real-world public library IVR systems and accessibility-focused narration workflows.

---

# Speech-Aware Direction

PasteLint is evolving toward:

> speech-aware readability infrastructure

The project increasingly focuses on:

* auditory readability
* narration optimization
* pacing awareness
* accessibility-aware text structure
* screen-reader usability
* spoken hierarchy
* cognitive readability

Examples of current speech-risk detection include:

* ampersands
* at-symbols
* slash characters
* em dashes
* en dashes
* overly long sentences
* narration pacing risks

---

# Architecture

PasteLint uses a modular browser-only architecture.

No frameworks.
No backend.
No build tools.
No APIs.

Current architecture direction:

```text
/js/
  engines/
  pages/
```

Core shared infrastructure:

```text
text-clean-engine.js
text-analyzer.js
```

Planned engine structure:

```text
/js/
  engines/
    text-clean-engine.js
    text-analyzer.js
    second-draft-engine.js
    speech-risk-engine.js
    ssml-engine.js

  pages/
    clean-page.js
    second-draft-page.js
    ssml-builder-page.js
```

The long-term goal is reusable text infrastructure shared across all tools.

---

# Current Analyzer Capabilities

The shared analyzer layer currently detects:

* hidden characters
* excessive spacing
* filler phrases
* repeated words
* long sentences
* punctuation issues
* speech risks
* narration formatting risks
* em dashes and en dashes
* accessibility-related readability concerns

This analyzer is becoming the shared intelligence layer across the platform.

---

# Accessibility Goals

Future development strongly considers:

* screen-reader workflows
* auditory cognition
* low-vision usability
* read-aloud fatigue
* spoken chunking
* narration pacing
* cognitive readability
* accessibility-aware formatting

The goal is to optimize text not only visually, but auditorily.

---

# Design Goals

PasteLint intentionally avoids:

* flashy AI startup aesthetics
* opaque black-box rewriting
* aggressive marketing language
* over-engineered interfaces

The intended experience is:

* calm
* clean
* trustworthy
* transparent
* utility-focused
* understandable
* explainable

---

# Privacy

PasteLint processes text locally in the browser.

That means:

* no uploads
* no account creation
* no cloud processing
* no hidden API calls
* no server-side text storage

Your text stays on your device.

---

# Project Direction

PasteLint is currently transitioning from:

```text
text cleanup utility
```

into:

```text
speech-aware text infrastructure
```

Long-term goals include:

* narration optimization
* accessibility-aware formatting
* speech-risk analysis
* reusable readability infrastructure
* explainable cleanup systems
* AI-era utility discoverability

---

# Development Principles

The project follows a deliberately conservative engineering philosophy:

* local-only processing
* minimal dependencies
* modular architecture
* explainable changes
* transparent cleanup
* reusable engines
* safe incremental refactoring
* browser-native reliability

The goal is boringly safe, stable, understandable software.

---

# Why This Exists

PasteLint began as a practical solution for real-world communication problems:

* messy pasted text
* IVR narration cleanup
* accessibility formatting
* speech synthesis preparation
* AI-generated text cleanup
* PDF and OCR formatting repair

The project continues to evolve through real operational workflows rather than artificial demo scenarios.

---

# Status

PasteLint is actively under development.

Current work includes:

* modular engine refactoring
* analyzer expansion
* narration optimization
* shared infrastructure extraction
* speech-aware cleanup systems
* UI stabilization
* accessibility-focused improvements

---

# License

TBD
