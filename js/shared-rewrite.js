
function generateVersions(text) {
  return [
    rewriteConcise(text),
    rewriteNatural(text),
    rewriteDirect(text)
  ];
}

function rewriteConcise(text) {
  let out = text;

  out = out.replace(/It is important to note that/gi, "");
  out = out.replace(/due to the fact that/gi, "because");
  out = out.replace(/in order to/gi, "to");
  out = out.replace(/for the purpose of/gi, "to");
  out = out.replace(/At this point in time/g, "Now");
  out = out.replace(/at this point in time/g, "now");

  return buildRewriteResult("Concise", text, out);
}

function rewriteNatural(text) {
  let out = text;

  out = out.replace(/utilize/gi, "use");
  out = out.replace(/assistance/gi, "help");
  out = out.replace(/facilitate/gi, "help");
  out = out.replace(/with regard to/gi, "about");
  out = out.replace(/prior to/gi, "before");

  return buildRewriteResult("Natural", text, out);
}

function rewriteDirect(text) {
  let out = text;

  out = out.replace(/I would like to/gi, "");
  out = out.replace(/It seems that/gi, "");
  out = out.replace(/There is/gi, "");
  out = out.replace(/There are/gi, "");
  out = out.replace(/Please be advised that/gi, "");

  return buildRewriteResult("Direct", text, out);
}

function buildRewriteResult(label, original, revised) {
  const cleanedRevised = normalizeRewrite(revised);

  const impact = {
    shortened: Math.max(0, original.length - cleanedRevised.length)
  };

  return {
    label,
    text: cleanedRevised,
    changes: original !== cleanedRevised
      ? [`Created ${label.toLowerCase()} version`]
      : ["No major rewrite needed"],
    impact
  };
}

function normalizeRewrite(text) {
  return String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|[.!?]\s+)([a-z])/g, function (match, start, letter) {
      return start + letter.toUpperCase();
    })
    .trim();
}
