export default (xml) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(xml, 'application/xml');
  const error = data.querySelector('parsererror');

  if (error) throw new Error('parsingError');

  const listItems = data.querySelectorAll('item');
  const feedTitle = data.querySelector('title').textContent;
  const feedDescription = data.querySelector('description').textContent;
  const feedLink = data.querySelector('link').textContent;
  const posts = [...listItems].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return { title, description, link };
  });

  return {
    feedTitle, feedDescription, posts, feedLink,
  };
};
