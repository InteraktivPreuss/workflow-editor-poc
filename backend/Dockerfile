FROM node:20-alpine
WORKDIR /app
COPY server.mjs ./
ENV PORT=8090
# Persist workflows.json here; mount a volume (or a real Nick profile dir) at /data.
ENV WORKFLOWS_FILE=/data/workflows.json
VOLUME /data
EXPOSE 8090
CMD ["node", "server.mjs"]
