FROM otomi/tools:1.1.4

ENV APP_HOME=/home/app/stack
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

COPY . .

RUN tests/lint.sh

CMD ["bin/deploy.sh"]
