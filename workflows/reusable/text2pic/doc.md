
## 基础信息

接口地址：https://aihub.gz4399.com/v1/chat/completions （外）

https://aihub-in.gz4399.com/v1/chat/completions （内）

模型名称：gemini-2.5-flash-image

目前支持的额外参数（都可以不传）:

temperature: 0~1

top_p: 0~1

stream: true、false

aspectRatio:

| 宽高比 | 分辨率    | 令牌 |
| ------ | --------- | ---- |
| 1:1    | 1024x1024 | 1290 |
| 2:3    | 832x1248  | 1290 |
| 3:2    | 1248x832  | 1290 |
| 3:4    | 864x1184  | 1290 |
| 4:3    | 1184x864  | 1290 |
| 4:5    | 896x1152  | 1290 |
| 5:4    | 1152x896  | 1290 |
| 9:16   | 768x1344  | 1290 |
| 16:9   | 1344x768  | 1290 |
| 21:9   | 1536x672  | 1290 |

## 2.文生图

### 流式输出

请求示例

```
API_KEY=xxx
curl 'https://aihub.gz4399.com/v1/chat/completions' \
  -H 'accept: application/json, text/event-stream' \
  --header "Authorization: Bearer ${API_KEY}" \
  -H 'content-type: application/json' \
  --data-raw '{"messages":[{"type": "text","role":"user","content":"生成图片: 一只鸡"}],"stream":true,"model":"gemini-2.5-flash-image"}' > result.log
```

响应示例

```
data: {"id":"chatcmpl-b5d29f6ebd6a4a699cdf204eeddfcdc2","object":"chat.completion.chunk","created":1761212987,"model":"gemini-2.5-flash-image","choices":[{"index":0,"delta":{"role":"assistant","content":{"type":"image_url","image_url":{"url":"iVBORw0...此次省略1万个字...kSuQmCC"}}},"logprobs":null}],"system_fingerprint":null,"usage":{"prompt_tokens":6,"completion_tokens":1290,"total_tokens":1296}}

data: [DONE]
```

图片是以base64的内容响应的，需要自行获取并解码

### 非流式输出

默认非流式输出，也可以通过 stream 参数指定。其他请求与流式输出是一样的，生成完之后base64解码即可

请求示例

```
API_KEY=xxx
curl 'https://aihub.gz4399.com/v1/chat/completions' \
  -H 'accept: application/json, text/event-stream' \
  --header "Authorization: Bearer ${API_KEY}" \
  -H 'content-type: application/json' \
  --data-raw '{"messages":[{"type": "text","role":"user","content":"生成图片: 一只鸡"}],"stream":false,"model":"gemini-2.5-flash-image"}' > result2.log
```

响应示例

```
{"id":"chatcmpl-85460920cc0949b1851d6e8fab2d6d9d","model":"gemini-2.5-flash-image","object":"chat.completion","created":1761213237,"choices":[{"index":0,"message":{"role":"assistant","content":[{0gA:"type":"image_url","image_url":{"url":"iVBORw0KGgoAAAANSUhE...此次省略1万个字...GkJggg=="}}]},"finish_reason":"stop"}],"usage":{"prompt_tokens":17,"completion_tokens":0,"total_tokens":17}}
```

还原成图片

```
cat result2.log | jq -r '.choices[0].message.content[0].image_url.url' |base64 -d > out2.png
```

## 3.图修图

图片修改是自行构造上下文进行的，把需要处理的图片先base64，然后塞进请求包体里，下面给一个修改的示例。

### 流式输出

```
# 需要修改的图片
IMG_PATH=/tmp/in.png

API_KEY="你的KEY"

if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
  B64FLAGS="--input"
else
  B64FLAGS="-w0"
fi

# 图片base64编码
IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

# 生成请求包体
cat << EOF > request.json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,${IMG_BASE64}"
          }
        },
        {
          "type": "text",
          "text": "加一只兔子"
        }
      ]
    }
  ],
  "stream": true,
  "model": "gemini-2.5-flash-image",
  "temperature": 1,
  "top_p": 0.95,
  "max_tokens": 4000
}
EOF


curl 'https://aihub.gz4399.com/v1/chat/completions' \
  -H 'accept: application/json, text/event-stream' \
  --header "Authorization: Bearer ${API_KEY}" \
  -H 'content-type: application/json' -d '@request.json' > /tmp/result.log
```

响应示例

```
data: {"id":"chatcmpl-f8f09eec830044988440adfa0fa9bd2a","object":"chat.completion.chunk","created":1767091705,"model":"gemini-2.5-flash-image","choices":[{"index":0,"delta":{"role":"assistant","content":{"image_url":{"url":"iVBOR...此处省略1万字..rkJggg=="},"type":"image_url"}},"logprobs":null}],"system_fingerprint":null,"usage":{"prompt_tokens":2583,"completion_tokens":1290,"total_tokens":3873}}

data: [DONE]

```

### 2.非流式输出

请求与流式输出一致，区别点在于 stream 参数，指定为 Flase 或者 不传都是非流式输出。

```
# 需要修改的图片
IMG_PATH=/tmp/in.png

API_KEY="你的KEY"

if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
  B64FLAGS="--input"
else
  B64FLAGS="-w0"
fi

# 图片base64编码
IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

# 生成请求包体
cat << EOF > request.json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,${IMG_BASE64}"
          }
        },
        {
          "type": "text",
          "text": "加一只兔子"
        }
      ]
    }
  ],
  "stream": false,
  "model": "gemini-2.5-flash-image",
  "temperature": 1,
  "top_p": 0.95,
  "max_tokens": 4000
}
EOF


curl 'https://aihub.gz4399.com/v1/chat/completions' \
  -H 'accept: application/json, text/event-stream' \
  --header "Authorization: Bearer ${API_KEY}" \
  -H 'content-type: application/json' -d '@request.json' > /tmp/result2.log
```

还原成图片

```
cat /tmp/result2.log | jq -r '.choices[0].message.content[0].image_url.url' |base64 -d > /tmp/out.png
```
