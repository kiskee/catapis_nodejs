# 🐱 Cat API Gateway (NestJS + MongoDB + AWS Lambda)

Backend desarrollado en NestJS que funciona como gateway hacia TheCatAPI, con autenticación JWT, documentación en Swagger y despliegue en AWS Lambda + API Gateway.  
Este README.md contiene toda la documentación completa: arquitectura, instalación, despliegue, variables, comandos y todos los endpoints documentados con ejemplos.

---

## 📋 Descripción

La API provee:

- Registro y login de usuarios con JWT.  
- Listado, búsqueda y detalle de razas de gatos.  
- Búsqueda de imágenes de gatos filtradas por raza y otros parámetros.  

Toda la API (excepto `auth`) está protegida con JWT Bearer Token.

---

## 🏗️ Arquitectura y buenas prácticas

- NestJS modular: módulos AuthModule, CatsModule, ImagesModule.  
- Adapter Pattern: IHttpAdapter para desacoplar el cliente HTTP.  
- JWT Strategy (Passport): protección de endpoints.  
- Decoradores personalizados:  
  - @Public() → permite acceso sin token.  
  - @Auth() → exige token JWT y documenta en Swagger.  
- DTOs + ValidationPipe: validación con class-validator y transformación con class-transformer.  
- Errores controlados: try/catch con HttpException.  
- Seguridad:  
  - Contraseñas con bcrypt.  
  - JWT firmado con secret configurable.  
  - Middleware de seguridad (helmet, compression).  

---

## ⚙️ Variables de entorno

Ejemplo de `.env`:

MONGO_URI=mongodb+srv://.../catapis  
JWT_SECRET=super-secreto  
JWT_EXPIRES=1d  
HTTP_BASE_URL=https://api.thecatapi.com/v1  
CAT_API_KEY=<opcional>  
PORT=3000  
NODE_ENV=development  

---

## 🚀 Ejecución local

npm install  
npm run start:dev  
Swagger disponible en: http://localhost:3000/docs  

---

## 🐳 Docker

docker build -t catapis_nodejs:latest .  
docker run -p 3000:3000 --env-file .env catapis_nodejs:latest  

---

## ☁️ Despliegue AWS

1. Subir la imagen a ECR:  

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com  
docker tag catapis_nodejs:latest <account>.dkr.ecr.us-east-1.amazonaws.com/catapis_nodejs:latest  
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/catapis_nodejs:latest  

2. Crear función Lambda desde la imagen.  
3. Conectar un API Gateway (HTTP API).  
4. Usar el stage $default para URLs limpias.  

---

## 🔑 Autenticación JWT

1. Regístrate o haz login para obtener el accessToken.  
2. En cada request protegido envía:  

Authorization: Bearer <token>  

3. En Swagger, usa Authorize y pega el token.  

---

## 🧾 Errores

Ejemplo:

{  
  "statusCode": 400,  
  "message": ["email must be an email"],  
  "error": "Bad Request"  
}  

- 400: Validación fallida / email duplicado.  
- 401: Token faltante o inválido.  
- 404: Recurso no encontrado.  
- 502: Error externo (TheCatAPI).  

---

## 📖 Documentación Swagger

- Local: http://localhost:3000/docs  
- AWS (stage $default): https://<api-id>.execute-api.<region>.amazonaws.com/docs  

---

## 🌐 Endpoints

### Auth (público)

POST /auth/register  
Body: { "email": "user@example.com", "password": "MiClaveSegura123" }  
201 Created: devuelve usuario + accessToken  
400: Email ya registrado  

POST /auth/login  
Body: { "email": "user@example.com", "password": "MiClaveSegura123" }  
200 OK: devuelve usuario + accessToken  
401: Credenciales inválidas  

---

### Breeds (JWT requerido)

GET /breeds  
→ Lista todas las razas  

GET /breeds/search?q=sib&attach_image=1  
→ Busca razas por query  

GET /breeds/:breed_id  
→ Obtiene detalle de una raza  

---

### Images (JWT requerido)

GET /imagesbybreedid  
Query params:  
- breed_id (requerido)  
- limit (default=5, max=25)  
- size (thumb|small|med|full)  
- order (RANDOM|ASC|DESC)  
- mime_types (opcional)  
- page, include_breeds, has_breeds  

Ejemplo: /imagesbybreedid?breed_id=abys&limit=2&include_breeds=1  

---

## 📌 Resumen de endpoints

Auth:  
- POST /auth/register  
- POST /auth/login  

Breeds:  
- GET /breeds  
- GET /breeds/search  
- GET /breeds/:breed_id  

Images:  
- GET /imagesbybreedid  

---

## ✅ Próximos pasos

- Agregar cache con Redis.  
- Tests unitarios con Jest.  
- CI/CD con GitHub Actions.  
- Roles y permisos en JWT.  

---

✍️ Proyecto desarrollado aplicando NestJS, MongoDB, SOLID, Clean Architecture, JWT y desplegado en AWS Lambda.
