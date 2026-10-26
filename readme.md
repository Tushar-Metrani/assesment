clinical-scribe/
├── README.md                  # architecture, trade-offs, privacy, limitations
├── .env.example               # GROQ_API_KEY, model names, tuning values
│
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py            # FastAPI app, lifespan (loads Whisper once), CORS
│   │   ├── config.py          # settings: model size, queue depth, caps, thresholds
│   │   ├── schemas/
│   │   │   ├── ws_messages.py # WebSocket message models
│   │   │   └── clinical.py    # nine-group data model + response envelope
│   │   ├── api/
│   │   │   ├── ws.py          # /ws/session route
│   │   │   ├── summarize.py   # POST /summarize
│   │   │   └── health.py      # GET /health
│   │   ├── services/
│   │   │   ├── transcriber.py # faster-whisper wrapper, filters, confidence flags
│   │   │   ├── session.py     # per-session state: queue, prompt carry-over, cache
│   │   │   └── summarizer.py  # Groq call, validation, retry
│   │   └── prompts/
│   │       └── summarize.py   # system prompt text, kept separate from logic
│   └── tests/
│       ├── fixtures/          # sample transcripts
│       ├── test_schema.py
│       ├── test_summarize.py  # mocked LLM client
│       └── test_ws_protocol.py
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── config.js          # VAD thresholds, hangover, caps, server URL
        ├── services/
        │   ├── wsClient.js    # plain JS: connect, send, reconnect, heartbeat
        │   ├── audioCapture.js# mic + Silero VAD, emits speech segments
        │   └── api.js         # REST calls (/summarize, /health)
        ├── store/
        │   └── sessionStore.js# Zustand: status, segments, summary, errors
        ├── components/
        │   ├── TranscriptPanel.jsx   # controls, live view, editable text
        │   ├── SummaryPanel.jsx      # renders the nine groups
        │   ├── SummarySection.jsx    # reusable section renderer
        │   ├── UnclearBadge.jsx      # highlights flagged values
        │   └── StatusBar.jsx         # words, chunks, pending, connection state
        └── styles/                   # the company's CSS, kept as provided