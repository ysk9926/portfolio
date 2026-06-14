---
slug: rag-series-3-tool-calling
title: "RAG 시리즈 3편 — 고정 파이프라인 vs Tool Calling, LLM에게 검색을 맡기는 패턴"
summary: "1편의 6단계 고정 파이프라인은 '안녕하세요'에도 LLM을 4번 호출해요. Tool Calling은 LLM에게 검색 도구를 쥐여주고 자율적으로 선택하게 해서 비용을 질문 복잡도에 비례시키는 패턴이에요. 두 방식의 비교, 도구 3종 설계, description 작성법, 안전장치와 함정을 정리했어요."
tags: [RAG, LLM, AI, ToolCalling, OpenAI, Backend]
status: published
thumbnail:
---

## 한 줄 요약

1편에서 만든 6단계 고정 파이프라인은 "안녕하세요"에도 LLM을 4번 호출해요. Tool Calling은 LLM에게 검색 도구를 쥐여주고 자율적으로 선택하게 해서, 비용을 질문 복잡도에 비례시키는 패턴이에요. 이 글에서는 두 방식을 비교하고, Tool Calling 기반 RAG의 핵심 구조와 함정을 정리해요.

---

## 고정 파이프라인의 비용 비효율

1편에서 본 6단계 파이프라인을 다시 한번 그려볼게요.

```
질문 → 1.질문분석 → 2.검색(전부실행) → 3.관련성검증 → 4.컨텍스트빌딩 → 5.응답생성 → 6.답변검증
```

이 흐름은 **모든 질문에 대해 동일하게 6단계를 순차 실행**해요. 사용자가 "안녕하세요"라고 보내도 똑같이 흘러요.

- 질문 분석 (LLM 1회)
- 벡터 + 키워드 + 정확 매칭 검색 실행
- 관련성 검증 (LLM 1회)
- 응답 생성 (LLM 1회, 큰 모델)
- 답변 검증 (LLM 1회)

= **인사말 한 마디에 LLM 4회 호출 + 검색 3개**

대부분의 RAG 챗봇 사용 로그를 까보면 인사·잡담·재질문이 30~50%예요. 이 트래픽에 매번 4회씩 LLM을 쓰면 비용이 빠르게 누적돼요.

---

## Tool Calling 패턴

다른 접근이 있어요. LLM에게 "이런 도구들이 있다"고 알려주고, **LLM이 직접 어떤 도구를 쓸지 결정하게** 하는 거예요.

```
질문 → LLM(도구 목록 제공) → 필요한 도구만 호출 → 결과로 답변
```

OpenAI의 `tools` 파라미터(예전 이름은 function calling)를 쓰면 돼요. 호출은 이렇게 생겼어요.

```python
response = await openai.chat.completions.create(
    model="gpt-5.4-mini",
    messages=messages,
    tools=tool_definitions,    # 사용 가능한 도구 목록
    tool_choice="auto",        # LLM이 자동으로 선택
    stream=True,
)
```

응답의 `finish_reason`이 두 가지 중 하나로 와요.

| finish_reason | 의미 | 다음 동작 |
|---------------|------|----------|
| `tool_calls` | LLM이 도구 실행을 요청 | 실행 → 결과를 messages에 추가 → 다시 LLM 호출 |
| `stop` | 최종 답변 완성 | 사용자에게 전달 |

이걸 반복하면 자율 루프가 돼요.

---

## 두 방식 비교

| 항목 | 고정 파이프라인 | Tool Calling |
|------|---------------|-------------|
| 실행 흐름 | 항상 6단계 순차 | LLM 자율 반복 루프 |
| 검색 방식 | 매번 전부 실행 | 필요한 도구만 |
| LLM 호출 수 | 고정 4회 | 가변 1~7회 |
| 인사 ("안녕") | LLM 4회 + 검색 3개 | LLM 1회, 도구 0회 |
| 단순 검색 | LLM 4회 | LLM 2회 + 도구 1회 |
| 복합 질문 | LLM 4회 | LLM 3~7회 |
| 별도 검증 컴포넌트 | 필요 (QueryPlanner, Verifier 등) | 불필요 (LLM이 직접 판단) |
| 확장성 | 파이프라인 코드 수정 | 도구 추가만으로 확장 |
| 비용 구조 | 고정 | 질문 복잡도 비례 |

핵심 차이는 **"매번 4회"가 "보통 1~3회, 가끔 7회"로 바뀐다**는 거예요. 평균 비용이 30~50% 떨어져요.

---

## 도구 3종 — RAG 챗봇 기본 세트

대부분의 RAG 챗봇은 이 3가지 도구로 시작하면 충분해요.

### (1) 의미 기반 검색 — 벡터 검색

```python
{
    "type": "function",
    "function": {
        "name": "search_documents_by_content",
        "description": """의미 기반 벡터 검색으로 관련 문서를 찾습니다.
사용자의 질문과 의미적으로 유사한 문서를 찾을 때 사용합니다.
개념적 질문, 설명 요청, 유사 사례 탐색에 적합합니다.""",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "검색 쿼리"},
                "top_k": {"type": "integer", "default": 5}
            },
            "required": ["query"]
        }
    }
}
```

내부 구현: 임베딩 생성 → 벡터DB 코사인 유사도 검색.

### (2) 메타데이터 검색 — 정형 조건

```python
{
    "type": "function",
    "function": {
        "name": "search_documents_by_metadata",
        "description": """메타데이터 조건으로 문서를 검색합니다.
특정 유형, 카테고리, 작성자, 날짜 범위 등 정확한 조건으로 검색할 때 사용합니다.
"2024년 작성된 보고서" 같은 조건부 검색에 적합합니다.""",
        "parameters": {
            "type": "object",
            "properties": {
                "document_type": {"type": "string"},
                "author": {"type": "string"},
                "date_from": {"type": "string"},
                "date_to": {"type": "string"},
                "keyword": {"type": "string"},
            }
        }
    }
}
```

내부 구현: PostgreSQL `WHERE` 쿼리.

### (3) 문서 원문 조회

```python
{
    "type": "function",
    "function": {
        "name": "get_document_detail",
        "description": """특정 문서의 전체 원문을 조회합니다.
검색 결과에서 발견한 문서의 상세 내용을 확인할 때 사용합니다.
document_id는 다른 검색 도구의 결과에서 얻을 수 있습니다.""",
        "parameters": {
            "type": "object",
            "properties": {
                "document_id": {"type": "string"}
            },
            "required": ["document_id"]
        }
    }
}
```

내부 구현: ID로 문서 + 청크 전체 조회.

도구는 **3~5개가 최적**이에요. 너무 많으면 LLM이 잘못된 도구를 고르는 빈도가 늘어요. 도메인이 다르면 여기에 1~2개만 추가하는 정도로 충분해요.

---

## description이 결정적이다

Tool Calling을 처음 깔면 십중팔구 이 문제로 막혀요.

> "LLM이 도구를 잘못 골라요."

원인은 거의 항상 `description`이에요. LLM은 이 설명만 읽고 어떤 도구를 호출할지 결정하거든요.

**나쁜 예:**
```python
"description": "문서를 검색합니다"
```

다른 검색 도구와 구분이 안 돼요. LLM이 아무거나 고르거나, 매번 같은 도구만 골라요.

**좋은 예:**
```python
"description": """의미 기반 벡터 검색으로 관련 문서를 찾습니다.
개념적 질문, 설명 요청, 유사 사례 탐색에 적합합니다.
특정 조건(작성자, 날짜 등)으로 찾으려면 search_by_metadata를 사용하세요."""
```

description을 쓸 때 챙길 4가지.

1. **용도** — 이 도구가 무엇을 하는지
2. **적합한 상황** — 어떤 질문에 이 도구를 써야 하는지
3. **다른 도구와의 차이** — 비슷한 도구가 있으면 언제 이걸 쓰는지
4. **파라미터 출처** — `document_id` 같은 값을 어디서 얻는지

description 한 줄만 다듬어도 잘못된 도구 선택률이 확 떨어져요.

---

## 반복 루프 + 안전장치

도구 호출이 끝나면 결과를 다시 LLM에 넘겨야 답이 나와요. 이 과정이 한 번에 끝날 수도 있고, "이 도구 결과를 보니까 다른 도구도 호출해야겠다"가 될 수도 있어요. 그래서 반복 루프가 필요해요.

```python
iteration = 0
while iteration < MAX_ITERATIONS:
    response = await openai.chat.completions.create(
        model="gpt-5.4-mini",
        messages=messages,
        tools=tool_definitions,
        tool_choice="auto" if iteration < MAX_ITERATIONS - 1 else "none",
        stream=True,
    )

    if response.finish_reason == "stop":
        return  # 답변 완성

    # 도구 호출 실행
    for tc in response.tool_calls:
        result = await execute_tool(tc.function.name, json.loads(tc.function.arguments))
        messages.append({"role": "assistant", "tool_calls": [tc.to_dict()]})
        messages.append({"role": "tool", "tool_call_id": tc.id, "content": result.content})

    iteration += 1
```

안전장치가 4개 박혀 있어요.

| 장치 | 역할 |
|------|------|
| `MAX_ITERATIONS` (보통 6) | 무한 루프 방지 |
| 마지막 반복 `tool_choice="none"` | 도구 호출 막고 강제로 답변 생성 |
| 도구 실행 타임아웃 (30초) | 한 도구가 통신 막혀도 전체 안 죽음 |
| 에러 → 도구 결과로 LLM에 반환 | LLM이 에러를 보고 다른 도구 시도 |

마지막 두 개가 특히 중요해요. **도구 실행 실패를 예외로 throw하지 말고, "Error: ..." 메시지를 도구 결과로 돌려주세요.** 그러면 LLM이 "아 이 도구가 실패했네, 다른 걸 써볼까" 하고 대처해요. 예외를 그냥 던지면 사용자한테 "오류가 발생했습니다"만 보여줘야 해요.

```python
async def execute_tool(name, args):
    try:
        executor = TOOL_EXECUTOR_MAP.get(name)
        if not executor:
            return ToolResult(content=f"Error: Unknown tool '{name}'", ...)
        return await asyncio.wait_for(executor(args), timeout=30)
    except asyncio.TimeoutError:
        return ToolResult(content=f"Error: Tool '{name}' timed out", ...)
    except Exception as e:
        return ToolResult(content=f"Error: {str(e)}", ...)
```

---

## SSE 이벤트로 도구 실행을 보여주기

Tool Calling RAG는 응답이 더 느릴 때도 있어요. 도구를 여러 번 호출하면 그만큼 LLM 왕복이 늘어나니까요. 사용자가 "왜 답이 안 와?"라고 느끼지 않게 **도구 실행 과정을 실시간으로 보여줘야** 해요.

SSE로 흘려보내는 이벤트 예시.

| 이벤트 | 데이터 | 발생 시점 |
|--------|--------|---------|
| `tool_call_started` | tool_name, arguments | 도구 실행 직전 |
| `tool_call_completed` | tool_name, result_count, sources | 도구 실행 완료 |
| `tool_call_error` | tool_name, error | 도구 실행 실패 |
| `sources_preview` | sources 배열 | 모든 도구 완료 후 |
| `stream_start` | — | 최종 답변 생성 시작 |
| `token` | content | 답변 토큰 |
| `stream_end` | message_id | 완료 |

프론트엔드에서는 이 이벤트를 받아서 "벡터 검색 중...", "문서 5건 찾음", "답변 작성 중..." 같은 UI를 보여줘요. 같은 5초라도 "뭔가 하고 있구나"가 보이는 5초와 빈 화면 5초는 체감이 완전히 달라요.

```typescript
type StreamPhase = "idle" | "tool_calling" | "streaming"

// 도구 호출 있는 경우
// idle → tool_calling → streaming → idle

// 도구 없이 바로 답변
// idle → streaming → idle
```

---

## 질문 유형별 비용 비교

같은 챗봇에 다양한 질문이 들어왔을 때 둘의 비용 차이.

| 질문 유형 | 고정 파이프라인 | Tool Calling |
|----------|---------------|-------------|
| "안녕하세요" | LLM 4회 + 검색 3개 | LLM 1회 |
| "AI가 뭐야?" | LLM 4회 + 검색 3개 | LLM 1회 |
| "X에 대한 사례는?" | LLM 4회 + 검색 3개 | LLM 2회 + 검색 1개 |
| "2024년 보고서" | LLM 4회 + 검색 3개 | LLM 2회 + 검색 1개 |
| "A 문서 전문 보여줘" | LLM 4회 + 검색 3개 | LLM 3회 + 검색 2개 |
| 복합 질문 | LLM 4회 + 검색 3개 | LLM 3~7회 + 검색 여러 개 |

복합 질문에서는 Tool Calling이 오히려 더 비쌀 수도 있어요. 그런데 인사·잡담·단순 검색이 전체 트래픽의 70% 이상이라면 평균은 확실히 내려가요.

---

## Tool Calling 한계와 함정

장점만 있으면 모든 RAG가 다 이걸로 갈아탔겠죠. 함정도 있어요.

**1. 디버깅이 어렵다.** 고정 파이프라인은 각 단계 로그가 명확해요. Tool Calling은 "LLM이 왜 이 도구를 골랐지?", "왜 답변 검증을 안 했지?" 같은 의문에 답하기 어려워요. LLM의 판단을 신뢰해야 하는데, 신뢰가 깨지면 디버깅이 힘들어요.

**2. 답변 검증을 LLM이 알아서 한다는 가정.** 고정 파이프라인의 6단계 답변 검증을 Tool Calling은 안 해요. 시스템 프롬프트에 "근거가 약하면 솔직히 밝혀라"를 박아두고 LLM의 판단에 맡기는 거예요. 환각이 더 자주 발생할 수 있어요.

**3. 도구 선택이 일관되지 않을 수 있다.** 같은 질문에도 LLM이 다른 도구를 고를 수 있어요. 답변 품질이 매번 미묘하게 달라져요.

**4. 컨텍스트 윈도우를 빨리 먹는다.** 도구 호출이 누적될수록 messages 배열이 커져요. 긴 대화에서는 토큰 비용이 의외로 빨리 늘어요.

그래서 현실적인 선택은 **하이브리드**예요. 인사·잡담은 Tool Calling으로 가볍게 처리하고, 중요한 답변에는 답변 검증 단계를 따로 붙이는 식으로요. 또는 사내 챗봇처럼 트래픽 패턴이 명확하면 Tool Calling, 검증이 중요한 의료·법률 도메인은 고정 파이프라인을 유지하는 분리도 가능해요.

---

## 정리

고정 파이프라인은 **모든 질문에 같은 단계를 보장**해서 품질이 안정적이지만 비용이 고정이에요. Tool Calling은 **LLM이 자율적으로 도구를 선택**해서 비용은 줄어들지만 일관성과 디버깅이 어려워요.

선택 기준은 단순해요.

- 트래픽의 큰 비중이 단순 질문·인사라면 → **Tool Calling**
- 모든 답변에 출처 검증이 중요한 도메인이라면 → **고정 파이프라인**
- 둘 다 필요하다면 → **하이브리드** (또는 도메인별 분리)

다음 편(4편)에서는 시각을 바꿔서 **운영 관점의 RAG**를 다뤄요. 검색 품질만큼 중요한 것이 "임베딩을 어떻게 채우고, 실패하면 어떻게 복구하고, 비용을 어떻게 통제할지"예요. 실제로 운영하면 만나게 되는 임베딩 파이프라인 4가지 경로와 각자의 함정을 정리할게요.

---

## 시리즈 다른 편

- [1편. RAG가 뭐고 왜 쓰는가 — 기본 파이프라인 6단계](/blog/rag-series-1-pipeline-basics)
- [2편. 청크를 어떻게 자르고 임베딩할 것인가](/blog/rag-series-2-chunking-and-embedding)
- 3편 (현재 글)
- 4편. 운영에서 만나는 RAG — 임베딩 파이프라인 4경로 (예정)
