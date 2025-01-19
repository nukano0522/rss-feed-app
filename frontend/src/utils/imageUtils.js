export const extractImage = (item, feed) => {
  const getImageFromHtml = (html) => {
    if (!html) return null;
    const imgMatch = html.match(/<img.*?src="(.*?)".*?>/i);
    return imgMatch ? imgMatch[1] : null;
  };

  const possibleSources = [
    item.thumbnail,
    item.enclosure?.url,
    item.image,
    getImageFromHtml(item.description),
    getImageFromHtml(item.content),
  ];

  const validUrl = possibleSources.find(src => {
    if (!src) return false;
    try {
      if (src.startsWith('//')) {
        return `https:${src}`;
      }
      if (src.startsWith('http')) {
        return src;
      }
      return false;
    } catch {
      return false;
    }
  });

  return validUrl || feed?.defaultImage || 'data:image/svg+xml,...';
}; 