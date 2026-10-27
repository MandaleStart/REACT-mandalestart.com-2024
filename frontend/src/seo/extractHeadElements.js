const headElementPattern = /<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*\/?>|<link\b[^>]*\/?>/g;

export function extractHeadElements(renderedMarkup) {
  const headElements = renderedMarkup.match(headElementPattern) || [];
  return {
    headMarkup: headElements.join('\n'),
    bodyMarkup: renderedMarkup.replace(headElementPattern, ''),
  };
}
