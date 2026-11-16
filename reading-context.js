export const readingLinks = [
  {topic:'case', title:'Timeline of the Cornell fraternity-house investigation', publisher:'ABC News · Oct. 1, 2026', url:'https://www-cdn.abcnews.com/US/timeline-alleged-cornell-university-fraternity-house-rape-investigation/story?id=136884431', intro:'If you’re interested in how the case unfolded, try this timeline.'},
  {topic:'case', title:'Cornell accuser’s lawyer on the initial investigation', publisher:'NBC News / NBC Boston · Sept. 29, 2026', url:'https://www.nbcboston.com/news/national-international/cornell-rape-accuser-attorney-says-school-and-law-enforcement-failed-young-woman/4022417/', intro:'For another reported perspective on the investigation, read this interview with Doe’s attorney.'},
  {topic:'consent', title:'Consent 101: Respect, Boundaries, and Building Trust', publisher:'RAINN · Explainer', url:'https://rainn.org/share-the-facts/consent-101-respect-boundaries-and-building-trust', intro:'If you’re interested in consent, this guide explores boundaries and communication.'},
  {topic:'bystander', title:'Stop Sexual Violence: Step In With CARE', publisher:'RAINN · Bystander guide', url:'https://rainn.org/show-up-speak-out-step-in/stop-sexual-violence-step-in-with-care/', intro:'If you’re thinking about how a bystander can help, try this practical guide.'},
];
export function relatedReading(question) {
  const q = question.toLowerCase();
  if (/consent|incapacitat|alcohol|ketamine|drug/.test(q)) return [readingLinks[2], readingLinks[0]];
  if (/bystander|support|help|sorority|rumor|sham/.test(q)) return [readingLinks[3], readingLinks[2]];
  return readingLinks.slice(0, /related|recommend|read next|other articles/.test(q) ? 4 : 2);
}
export function appendRelatedReading(container, question) {
  const section = document.createElement('div');
  section.className = 'related-reading';
  const label = document.createElement('p'); label.textContent = 'READ FURTHER'; section.append(label);
  for (const item of relatedReading(question)) {
    const intro = document.createElement('p'); intro.textContent = item.intro;
    const link = document.createElement('a'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${item.title} ↗`;
    const publisher = document.createElement('small'); publisher.textContent = item.publisher;
    section.append(intro, link, publisher);
  }
  container.append(section);
}
export function questionsForPassage() { return ['What is the current status?', 'Give me the timeline', 'What did Cornell do?']; }
export const glossary = {
  'title ix':'A U.S. federal law prohibiting sex discrimination in education programs that receive federal funding. This article describes a university investigation under that framework.',
  'alleged':'Reported or claimed to have happened, but not established as fact in this reporting.',
  'allegations':'Claims that someone did something wrong; claims are not themselves findings of guilt.',
  'allegation':'A claim that someone did something wrong; a claim is not itself a finding of guilt.',
  'corroborated':'Supported by additional evidence or information.',
  'repercussions':'Consequences or effects that follow an action, often unwelcome ones.',
  'sanctions':'Penalties imposed by an authority. Here, the article describes university discipline, separate from criminal charges.',
  'prosecutor':'A lawyer who represents the government in criminal cases.',
  'defendants':'People or organizations against whom a legal action has been brought.',
  'lawsuit':'A legal dispute brought before a court.',
  'inquiry':'An investigation or examination of an issue.',
  'fraternity':'A membership organization; here, a college social organization.',
  'sorority':'A college membership organization traditionally for women.',
  'anonymous':'Not identified by name.',
  'anonymity':'The state of not being identified by name.',
  'consent':'Freely given agreement to participate. In a sexual context it is specific and ongoing, and may be withdrawn.',
  'ketamine':'A drug used medically as an anesthetic. The article reports allegations involving its use; this definition does not establish what happened in this case.',
  'bystander':'Someone present or aware of a situation who is not directly involved.',
  'betrayed':'Let down by someone or something in which trust was placed.',
  'expelled':'Removed from an institution or organization.',
  'criminality':'The quality of being criminal; in this article, the word appears in the prosecutor’s explanation of his initial charging decision.',
};
export function normalizeWord(word) { return word.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, ''); }
