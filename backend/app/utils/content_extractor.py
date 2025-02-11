from bs4 import BeautifulSoup
import re
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class ContentExtractor:
    def __init__(self):
        # 不要なタグのリスト
        self.noise_tags = {
            "script",
            "style",
            "nav",
            "header",
            "footer",
            "aside",
            "noscript",
            "iframe",
            "ad",
            "advertisement",
        }

        # 本文らしい要素のセレクタ（サイトごとに追加可能）
        self.content_selectors = {
            "default": [
                "description",
                "article",
                ".article",
                ".post-content",
                ".entry-content",
                "main",
            ],
            "hatena": [".entry-content"],
            "aws": [".blog-post"],
            "azure": [".blog-content"],
        }

    def clean_text(self, text: str) -> str:
        """テキストのクリーニング"""
        # 余分な空白と改行の削除
        text = re.sub(r"\s+", " ", text)
        # 前後の空白を削除
        text = text.strip()
        return text

    def calculate_text_density(self, element) -> float:
        """テキスト密度を計算"""
        text_length = len(self.clean_text(element.get_text()))
        if text_length == 0:
            return 0

        # リンクテキストの長さを取得
        link_text_length = sum(
            len(self.clean_text(a.get_text())) for a in element.find_all("a")
        )

        # タグの数を取得
        tags_count = len(element.find_all())
        if tags_count == 0:
            tags_count = 1

        # テキスト密度 = (総テキスト長 - リンクテキスト長) / タグ数
        density = (text_length - link_text_length) / tags_count
        return density

    def extract_content_by_density(self, soup: BeautifulSoup) -> List[str]:
        """テキスト密度による本文抽出"""
        candidates = []

        # p, div, sectionタグを評価
        for element in soup.find_all(["p", "div", "section"]):
            # ノイズとなるタグを含む要素はスキップ
            if any(element.find_all(tag) for tag in self.noise_tags):
                continue

            density = self.calculate_text_density(element)
            text = self.clean_text(element.get_text())

            # 密度と文字数で本文候補を判定
            if density > 10 and len(text) > 100:
                candidates.append(
                    {"text": text, "density": density, "element": element}
                )

        # 密度で降順ソート
        candidates.sort(key=lambda x: x["density"], reverse=True)
        return [c["text"] for c in candidates[:5]]  # 上位5つを返す

    def extract_content_by_selectors(self, soup: BeautifulSoup, url: str) -> str:
        """セレクタによる本文抽出"""
        # URLに基づいてセレクタを選択
        selectors = self.content_selectors["default"]
        for site, site_selectors in self.content_selectors.items():
            if site in url:
                selectors = site_selectors
                break

        # セレクタに一致する要素から本文を抽出
        for selector in selectors:
            content = soup.select_one(selector)
            if content:
                # 不要なタグを削除
                for tag in self.noise_tags:
                    for element in content.find_all(tag):
                        element.decompose()

                return self.clean_text(content.get_text())

        return ""

    def extract_main_content(self, html: str, url: str) -> str:
        """メイン関数: 本文を抽出"""
        try:
            soup = BeautifulSoup(html, "html.parser")

            # メタデータの削除
            for tag in self.noise_tags:
                for element in soup.find_all(tag):
                    element.decompose()

            # 1. セレクタによる抽出を試みる
            content = self.extract_content_by_selectors(soup, url)
            if content and len(content) > 200:  # 十分な長さがある場合
                return content

            # 2. テキスト密度による抽出
            contents = self.extract_content_by_density(soup)
            if contents:
                return "\n".join(contents)

            # 3. フォールバック: 単純にpタグのテキストを結合
            p_texts = [
                self.clean_text(p.get_text())
                for p in soup.find_all("p")
                if len(self.clean_text(p.get_text())) > 50
            ]
            if p_texts:
                return "\n".join(p_texts)

            return "本文を抽出できませんでした。"

        except Exception as e:
            logger.error(f"Content extraction error: {str(e)}")
            return "本文の抽出中にエラーが発生しました。"
