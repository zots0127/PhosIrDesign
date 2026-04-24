FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY . /app

ENV PHOSIR_MODEL_DIR=/app/backend/model_artifacts
ENV PHOSIR_DATA_PATH=/app/data/PhosIrDB.csv
ENV PORT=8000

CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}"]
