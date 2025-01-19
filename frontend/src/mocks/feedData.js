export const MOCK_ARTICLES = {
  'https://b.hatena.ne.jp/entrylist/it.rss': [
    {
      title: '[テスト] はてなブックマーク - 人気エントリー',
      link: 'https://example.com/test1',
      published: new Date().toISOString(),
      summary: 'テスト用のサマリーテキストです。',
      feedName: 'はてなブックマーク',
      feedUrl: 'https://b.hatena.ne.jp/entrylist/it.rss'
    },
    {
      title: '[テスト] 新しい技術記事',
      link: 'https://example.com/test2',
      published: new Date(Date.now() - 3600000).toISOString(), // 1時間前
      summary: 'テスト用の技術記事です。',
      feedName: 'はてなブックマーク',
      feedUrl: 'https://b.hatena.ne.jp/entrylist/it.rss'
    }
  ],
  'https://aws.amazon.com/jp/blogs/aws/feed/': [
    {
      title: '[テスト] AWS 新機能発表',
      link: 'https://example.com/test3',
      published: new Date().toISOString(),
      summary: 'AWSの新機能に関するテスト記事です。',
      feedName: 'AWS Blog',
      feedUrl: 'https://aws.amazon.com/jp/blogs/aws/feed/'
    }
  ],
  'https://azure.microsoft.com/ja-jp/blog/feed/': [
    {
      title: '[テスト] Azure 最新アップデート',
      link: 'https://example.com/test4',
      published: new Date().toISOString(),
      summary: 'Azureの最新情報に関するテスト記事です。',
      feedName: 'Azure Blog',
      feedUrl: 'https://azure.microsoft.com/ja-jp/blog/feed/'
    }
  ]
}; 