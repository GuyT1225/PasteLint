
/* PasteLint Text Analyzer
   Shared browser-only analysis layer.
   No DOM access. No backend. No dependencies.
*/

(function () {
  "use strict";

  function normalizeInput(text) {
    return String(text || "");
  }

  function countWords(text) {
    const matches = normalizeInput(text).trim().match(/\b[\w'-]+\b/g);
    return matches ? matches.length : 0;
  }

  function countSentences(text) {
    const matches = normalizeInput(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    return matches ? matches.filter(s => s.trim().length > 0).length : 0;
  }

  function countParagraphs(text) {
    return normalizeInput(text)
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0).length;
  }

  function estimateReadTime(words) {
    return Math.max(1, Math.ceil(words / 225));
  }

  function detectHiddenCharacters(text) {
    const hiddenPattern = /[\u200B-\u200D\uFEFF\u00A0]/g;
    const matches = normalizeInput(text).match(hiddenPattern);
    return matches ? matches.length : 0;
  }

  function detectFormattingIssues(text) {
    const findings = [];
    const value = normalizeInput(text);

    if (/\r\n|\r/.test(value)) {
      findings.push({
        type: "line-endings",
        severity: "low",
        message: "Mixed line endings detected."
      });
    }

    if (/[ \t]{2,}/.test(value)) {
      findings.push({
        type: "extra-spacing",
        severity: "low",
        message: "Extra spacing detected."
      });
    }

    if (/\n{3,}/.test(value)) {
      findings.push({
        type: "excess-line-breaks",
        severity: "low",
        message: "Excess blank lines detected."
      });
    }

    if (detectHiddenCharacters(value) > 0) {
      findings.push({
        type: "hidden-characters",
        severity: "medium",
        message: "Hidden or non-breaking characters detected."
      });
    }

    if (/[“”‘’]/.test(value)) {
      findings.push({
        type: "smart-quotes",
        severity: "low",
        message: "Smart quotes detected."
      });
    }

    return findings;
  }

  function detectLongSentences(text) {
    const sentences = normalizeInput(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];

    return sentences
      .map(sentence => sentence.trim())
      .filter(sentence => countWords(sentence) >= 28)
      .map(sentence => ({
        type: "long-sentence",
        severity: "medium",
        message: "Long sentence may be harder to read or hear aloud.",
        text: sentence
      }));
  }

  function detectFillerPhrases(text) {
    const phrases = [
      "it is important to note",
      "in today's world",
      "at the end of the day",
      "in order to",
      "due to the fact that",
      "needless to say",
      "it goes without saying",
      "as previously mentioned",
      "with that being said"
    ];

    const lower = normalizeInput(text).toLowerCase();

    return phrases
      .filter(phrase => lower.includes(phrase))
      .map(phrase => ({
        type: "filler-phrase",
        severity: "low",
        message: `Possible filler phrase detected: "${phrase}".`
      }));
  }

  function detectSpeechRisks(text) {
    const risks = [];
    const value = normalizeInput(text);

    if (/[\/\\]/.test(value)) {
      risks.push({
        type: "slash-character",
        severity: "medium",
        message: "Slash characters may sound awkward in TTS or screen readers."
      });
    }
     
     if (/[—–]/.test(value)) {
       risks.push({
         type: "dash-character",
         severity: "low",
         message: "Em dashes or en dashes may create awkward pauses in speech synthesis."
     });
   }
    if (/&/.test(value)) {
      risks.push({
        type: "ampersand",
        severity: "medium",
        message: "Ampersands should usually be spoken as 'and'."
      });
    }

    if (/@/.test(value)) {
      risks.push({
        type: "at-symbol",
        severity: "medium",
        message: "At symbols may need spoken-text normalization."
      });
    }

    if (/\b[A-Z]{4,}\b/.test(value)) {
      risks.push({
        type: "all-caps-word",
        severity: "low",
        message: "All-caps words may be misread or over-emphasized."
      });
    }

    return risks;
  }

  function analyzeText(text) {
    const value = normalizeInput(text);
    const words = countWords(value);
    const sentences = countSentences(value);
    const paragraphs = countParagraphs(value);

    const formattingFindings = detectFormattingIssues(value);
    const longSentenceFindings = detectLongSentences(value);
    const fillerFindings = detectFillerPhrases(value);
    const speechRisks = detectSpeechRisks(value);

    return {
      stats: {
        characters: value.length,
        words,
        sentences,
        paragraphs,
        estimatedReadTimeMinutes: estimateReadTime(words)
      },
      findings: [
        ...formattingFindings,
        ...longSentenceFindings,
        ...fillerFindings
      ],
      speechRisks
    };
  }

  window.PasteLintAnalyzer = {
    analyzeText,
    countWords,
    countSentences,
    countParagraphs,
    estimateReadTime,
    detectFormattingIssues,
    detectSpeechRisks
  };
})();
