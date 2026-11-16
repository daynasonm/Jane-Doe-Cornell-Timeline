const unbroken = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:[-–]\d{1,2})?\b|\b[\p{L}\d]+(?:[-–][\p{L}\d]+)+\b/gu;

export function initArticleTypesetting() {
  for (const paragraph of document.querySelectorAll('.story-paragraph')) {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.textContent, matches = [...text.matchAll(unbroken)];
      if (!matches.length) continue;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      for (const match of matches) {
        fragment.append(text.slice(offset, match.index));
        const span = document.createElement('span');
        span.className = 'keep-together'; span.textContent = match[0]; fragment.append(span);
        offset = match.index + match[0].length;
      }
      fragment.append(text.slice(offset)); node.replaceWith(fragment);
    }
  }
  for (const element of document.querySelectorAll('.story-paragraph, .world-title, .reading-help')) {
    const gap = /\s+(?=\S+\s*$)/u.exec(element.textContent);
    if (!gap) continue;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let offset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode, text = node.textContent;
      if (gap.index >= offset && gap.index + gap[0].length <= offset + text.length) {
        const start = gap.index - offset;
        node.textContent = text.slice(0, start) + '\u00a0' + text.slice(start + gap[0].length);
        break;
      }
      offset += text.length;
    }
  }
}
