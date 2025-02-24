from openai import AsyncOpenAI
from typing import Optional
import os
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class ArticleSummarizer:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

        # クライアントの初期化方法を修正
        self.client = AsyncOpenAI(api_key=api_key)
        self.max_tokens = 4096  # GPT-3.5-turboの入力制限
        self.summary_length = 200  # 要約の目標文字数

    def _truncate_text(self, text: str) -> str:
        """トークン制限に収まるようにテキストを切り詰める"""
        # 簡易的な実装として文字数で制限（実際はトークン数で制限すべき）
        return text[: self.max_tokens * 2]  # 日本語の場合、1文字≒2トークンと仮定

    @retry(
        stop=stop_after_attempt(3),  # 3回まで再試行
        wait=wait_exponential(multiplier=1, min=4, max=10),  # 指数関数的なバックオフ
    )
    async def summarize(self, text: str, lang: str = "ja") -> Optional[str]:
        """記事を要約する"""
        try:
            # テキストを適切な長さに切り詰める
            truncated_text = self._truncate_text(text)

            # プロンプトの準備
            system_prompt = f"""
            あなたは記事要約の専門家です。
            以下の制約に従って記事を要約してください：
            - {self.summary_length}文字程度で簡潔に
            - 重要なポイントを箇条書きで3-5点
            - 専門用語は必要に応じて簡単な説明を付ける
            - 出力は{lang}で行う
            """

            user_prompt = f"以下の記事を要約してください：\n\n{truncated_text}"

            # GPTによる要約の生成
            response = await self.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            logger.error(f"Summarization error: {str(e)}")
            raise

    async def summarize_batch(self, texts: list[str], lang: str = "ja") -> list[str]:
        """複数の記事を一括で要約する"""
        summaries = []
        for text in texts:
            try:
                summary = await self.summarize(text, lang)
                summaries.append(summary)
            except Exception as e:
                logger.error(f"Batch summarization error: {str(e)}")
                summaries.append(None)
        return summaries
