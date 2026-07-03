import "server-only";

const botChallengePatterns = [
  /just a moment\.\.\./i,
  /checking your browser/i,
  /attention required/i,
  /verify you are human/i,
  /enable javascript and cookies/i,
  /access denied/i,
  /cloudflare/i,
  /captcha/i,
  /checking if the site connection is secure/i,
];

export function detectBotChallenge(text: string): boolean {
  if (!text) {
    return false;
  }

  // A very short text containing a challenge phrase is highly suspicious
  if (text.length < 5000) {
    for (const pattern of botChallengePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  // If the document is large but contains multiple challenge phrases early on
  const earlyText = text.slice(0, 2000);
  for (const pattern of botChallengePatterns) {
    if (pattern.test(earlyText)) {
      return true;
    }
  }

  return false;
}
