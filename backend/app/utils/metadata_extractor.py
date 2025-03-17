from bs4 import BeautifulSoup
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """HTMLからメタデータを抽出するユーティリティクラス"""

    def __init__(self):
        pass

    def extract_metadata(self, html: str, url: str) -> Dict[str, Any]:
        """HTMLからメタデータを抽出する"""
        try:
            soup = BeautifulSoup(html, "html.parser")
            metadata: Dict[str, Any] = {}

            # タイトルの抽出（優先順位: OGP > Twitter Cards > HTMLタイトル）
            metadata["title"] = soup.find("meta", property="og:title") or soup.find(
                "meta", attrs={"name": "twitter:title"}
            )
            if metadata["title"]:
                metadata["title"] = metadata["title"].get("content", "")
            else:
                title_tag = soup.find("title")
                metadata["title"] = title_tag.get_text() if title_tag else ""

            # 説明の抽出
            metadata["description"] = (
                soup.find("meta", property="og:description")
                or soup.find("meta", attrs={"name": "twitter:description"})
                or soup.find("meta", attrs={"name": "description"})
            )
            if metadata["description"]:
                metadata["description"] = metadata["description"].get("content", "")
            else:
                # 説明がない場合は、最初の段落を使用
                first_p = soup.find("p")
                metadata["description"] = first_p.get_text() if first_p else ""

            # 画像の抽出
            metadata["image"] = soup.find("meta", property="og:image") or soup.find(
                "meta", attrs={"name": "twitter:image"}
            )
            if metadata["image"]:
                metadata["image"] = metadata["image"].get("content", "")
                # 相対URLを絶対URLに変換
                if metadata["image"] and not metadata["image"].startswith(
                    ("http://", "https://")
                ):
                    # URLの基本部分を取得
                    base_url = "/".join(url.split("/")[:3])  # http(s)://domain.com
                    if metadata["image"].startswith("/"):
                        metadata["image"] = base_url + metadata["image"]
                    else:
                        path = "/".join(url.split("/")[3:-1])
                        if path:
                            metadata["image"] = f"{base_url}/{path}/{metadata['image']}"
                        else:
                            metadata["image"] = f"{base_url}/{metadata['image']}"
            else:
                # OGPやTwitter Cardsに画像がない場合は、最初の大きな画像を使用
                images = soup.find_all("img")
                for img in images:
                    if img.get("src") and (
                        img.get("width", "0") > "200" or img.get("height", "0") > "200"
                    ):
                        img_src = img.get("src", "")
                        # 相対URLを絶対URLに変換
                        if img_src and not img_src.startswith(("http://", "https://")):
                            base_url = "/".join(url.split("/")[:3])
                            if img_src.startswith("/"):
                                img_src = base_url + img_src
                            else:
                                path = "/".join(url.split("/")[3:-1])
                                if path:
                                    img_src = f"{base_url}/{path}/{img_src}"
                                else:
                                    img_src = f"{base_url}/{img_src}"
                        metadata["image"] = img_src
                        break

            # キーワード/カテゴリの抽出
            keywords_meta = soup.find("meta", attrs={"name": "keywords"})
            if keywords_meta:
                keywords = keywords_meta.get("content", "")
                metadata["keywords"] = [
                    k.strip() for k in keywords.split(",") if k.strip()
                ]
            else:
                # キーワードがない場合は、記事のカテゴリやタグを探す
                categories: List[str] = []
                # よくあるカテゴリ/タグのクラス名やID
                category_selectors = [
                    ".category",
                    ".tag",
                    ".topics",
                    ".keywords",
                    "#category",
                    "#tag",
                    "#topics",
                    "#keywords",
                ]
                for selector in category_selectors:
                    elements = soup.select(selector)
                    for el in elements:
                        cat_text = el.get_text().strip()
                        if cat_text and len(cat_text) < 30:  # 長すぎるものは除外
                            categories.append(cat_text)

                metadata["keywords"] = categories[:5]  # 最大5つまで

            return metadata
        except Exception as e:
            logger.error(f"Error extracting metadata from {url}: {str(e)}")
            return {"title": "", "description": "", "image": "", "keywords": []}
