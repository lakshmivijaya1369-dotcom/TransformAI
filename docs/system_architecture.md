# System Architecture

```text
                 USER
                   |
                   v
        HTML / CSS / JavaScript
                   |
          HTTP requests (JSON /
             multipart upload)
                   |
                   v
             FastAPI Server
              /         \
             v           v
       File Handler   AI Engine
       PDF / TXT          |
       extraction         v
                    Prompt Templates
                          |
                          v
                    Google Gemini
                          |
                          v
                  Generated response
                          |
                          v
                 Frontend result view
                          |
                          v
                   TXT download
```

## Data flow
1. The user enters text or uploads a PDF/TXT document.
2. The frontend sends the file to `/api/upload`.
3. The file handler extracts text and returns it to the frontend.
4. The user chooses a transformation type and detail level.
5. The frontend sends JSON to `/api/transform`.
6. FastAPI validates the request and calls the AI engine.
7. The AI engine combines the source with the relevant prompt template.
8. Gemini generates the requested format.
9. The API returns the generated text to the frontend.
10. The user can read and download the result.

## Main design decisions
- Frontend and backend are served from one FastAPI application to simplify local setup.
- Prompt templates are kept separate from API logic to make them easier to maintain.
- The API key is stored in a local `.env` file and is not included in source control.
