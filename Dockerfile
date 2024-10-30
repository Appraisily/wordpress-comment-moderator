# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia los archivos de configuración y dependencias
COPY package*.json ./

# Instala solo las dependencias de producción
RUN npm install --production

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que escucha tu aplicación (opcional en Cloud Run)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
