FROM node:16 AS base

RUN \
	set -x \
	&& apt-get update \
	&& apt-get install -y net-tools build-essential python3 python3-pip valgrind

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

FROM base AS development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN yarn install --frozen-lockfile

COPY . .

CMD [ "yarn", "start:dev" ]

FROM base AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN yarn install --frozen-lockfile --production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
