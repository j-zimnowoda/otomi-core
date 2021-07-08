ARG TOOLS_TAG

#-----------------------------
FROM node:14-slim as npm

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

ARG SKIP_TESTS='false'
ENV CI=true

COPY . .
COPY ./.cspell.json .

RUN if [ "$SKIP_TESTS" = 'false' ]; then \
  npm install cspell && npm run spellcheck; fi

#-----------------------------
FROM otomi/tools:$TOOLS_TAG as test

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

ARG SKIP_TESTS='false'
ENV CI=true

COPY --chown=app . .

RUN if [ "$SKIP_TESTS" = 'false' ]; then bin/ci-tests.sh; fi

#-----------------------------
FROM otomi/tools:$TOOLS_TAG as system

USER root
RUN curl -sSL https://get.docker.com/ | sh && \
  curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.11.1/kind-linux-amd64 && \
  chmod +x ./kind && \
  mv ./kind /usr/local/bin/kind

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME
COPY . .

ENV ENV_DIR=/home/app/stack/profiles/aws/env

RUN npm ci && npm run compile

#-----------------------------
FROM otomi/tools:$TOOLS_TAG as prod

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

COPY --chown=app . .
RUN npm ci && npm run compile

CMD ["dist/otomi.js"]