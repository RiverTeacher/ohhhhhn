
## API Reference

#### ランダムなクイズを取得します。

```http
  GET /quiz
```

応答例:
```json
{
  "time": "8/31/2023 17:52:58",
  "topic": "マニアック",
  "quiz": "oranginaの読み方。ひらがなで",
  "answer": "おらんじーな",
  "explanation": "俺の目の前にあるジュースです。",
  "agree": "同意",
  "topicLink": "HIDE",
  "image": "画像なし"
}
```



#### 手動で指定したクイズデータを取得します。

```http
  GET /quiz?no=${number}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `number`      | `string` | **Required**. クイズ番号 |



