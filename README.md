# ClearSign

## Inspiration

Most people have signed something they didn't fully understand. A rental lease, an employment contract, a terms of service agreement — legal documents are deliberately dense, and the people who are most affected by them are often the least equipped to decode them. First-generation students, newcomers, low-income renters, and young people accepting their first job offer are all signing away rights they don't know they have. ClearSign was built for them.

## What it does

ClearSign lets you paste any legal document and instantly get:
- A **plain English summary** of what the document actually means
- **Colour-coded highlights** on the original text flagging risks, obligations, rights, and deadlines
- A **"bottom line"** written like a knowledgeable friend explaining what to watch out for before you sign
- An overall **risk level** so you know how carefully to read before committing

Users also select their role — tenant, employee, consumer, or student — so the analysis is tailored to what *they specifically* need to watch out for, not a generic summary.

## How we built it

ClearSign is a React frontend with an Express backend that proxies requests to a large language model API. The core highlight mechanic works by making two parallel API calls — one for a structured JSON summary, and one for a list of important verbatim phrases with category tags. The frontend then scans the original document text for each phrase and wraps matches in colour-coded `<mark>` elements, layering the annotation directly onto the source document without modifying it.

## Challenges

The trickiest part was the highlight matching. Legal documents often contain special characters, inconsistent whitespace, and repeated phrases that appear in different contexts. Getting the phrase extraction and text matching to align reliably required careful prompt engineering — instructing the model to return only phrases that appear *verbatim* in the source text, and sorting matches by length before applying them to avoid partial overlaps breaking the rendering.

Another challenge was keeping the experience accessible. The temptation with an AI tool is to show off everything it can do. We stripped it back deliberately — no accounts, no storage, no jargon even in the UI itself — because the people who need this most are also the people most likely to be intimidated by a complicated interface.

## What we learned

Good prompt engineering is half the product. The difference between a summary that sounds like a lawyer wrote it and one that sounds like a friend explaining it over coffee comes down entirely to how you frame the system prompt. We also learned that the most meaningful social impact products are often the simplest ones, protecting people from misleading and harmful contract terms.

## What's next

- Support for PDF uploads
- A shareable summary link so users can send a plain English breakdown to someone else
- A clause comparison tool — paste two versions of a contract and see exactly what changed
