# ---------- Build stage ----------
FROM public.ecr.aws/lambda/nodejs:20 AS build
WORKDIR /usr/app

# Copia package.json y lockfile
COPY package*.json ./
# Instala deps (incluye dev para compilar TS)
RUN npm ci

# Copia fuentes y compila
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Reinstala solo deps de producción para runtime más liviano
RUN npm ci --omit=dev

# ---------- Runtime stage ----------
FROM public.ecr.aws/lambda/nodejs:20
# Buenas prácticas
ENV NODE_ENV=production

# Copiamos artefactos
COPY --from=build /usr/app/dist ${LAMBDA_TASK_ROOT}
COPY --from=build /usr/app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Lambda buscará el handler "lambda.handler" (archivo dist/lambda.js exporta 'handler')
CMD ["lambda.handler"]
