FROM node:14-slim as ci

ENV EXIT_FAST='true'

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

COPY package*.json ./
COPY . .
COPY ./.cspell.json .
RUN cp -r .demo/ env/ 

#-----------------------------
FROM otomi/tools:1.4.8 as prod

ENV APP_HOME=/home/app/stack
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

COPY . .

CMD ["bin/otomi"]