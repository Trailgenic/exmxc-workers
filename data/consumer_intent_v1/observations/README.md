# Consumer Intent observation runs

Each dated file is an immutable, machine-verified collection run. Only observations that pass source-citation, recency, consumer-behavior, confidence, spam, promotion, normalization, and independent-verification gates are retained in `accepted`.

The files store short evidentiary passages and public source URLs returned through the OpenAI Responses API web-search tool. The workflow does not directly scrape origin sites. Repeated URLs and duplicate clusters are excluded from later runs.
