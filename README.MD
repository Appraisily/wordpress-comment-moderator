WordPress Comment Moderator Service
Descripción
Servicio automatizado para la moderación y respuesta de comentarios en WordPress utilizando IA. El servicio clasifica automáticamente los comentarios como legítimos o spam, y genera respuestas personalizadas para los comentarios legítimos utilizando OpenAI GPT.
Características Principales
Clasificación automática de comentarios usando IA
Generación de respuestas personalizadas
Procesamiento por lotes de comentarios pendientes
Manejo automático de spam
Monitoreo y estadísticas en tiempo real
Integración segura con WordPress y OpenAI
Requisitos Previos
Node.js v14 o superior
Cuenta de WordPress con API REST habilitada
Credenciales de aplicación WordPress
Clave API de OpenAI
Google Cloud Project (para Secret Manager)
Configuración
Variables de Entorno (Secret Manager)
wp_username: Usuario de WordPress
wp_app_password: Contraseña de aplicación de WordPress
WORDPRESS_API_URL: URL base de la API de WordPress
OPENAI_API_KEY: Clave API de OpenAI
SHARED_SECRET: Secreto compartido para autenticación de webhooks
Instalación
Clonar el repositorio
git clone [url-del-repositorio]
Instalar dependencias
npm install
Iniciar el servicio
npm start
Endpoints
POST /webhook
Endpoint para recibir notificaciones de nuevos comentarios de WordPress.
Headers requeridos: x-shared-secret
Body: Datos del comentario de WordPress
Respuesta: 200 OK si el comentario fue procesado correctamente
POST /process-batch
Inicia el procesamiento por lotes de comentarios pendientes.
Respuesta:
{
"message": "Procesando lote de X comentarios.",
"count": X
}
GET /stats
Obtiene estadísticas generales del sistema.
Respuesta:
{
"total": "número total de comentarios",
"totalPages": "número total de páginas",
"currentBatch": "tamaño del lote actual"
}
GET /pending
Muestra información sobre comentarios pendientes.
Respuesta:
{
"totalPending": "número total de pendientes",
"pendingPages": "número de páginas de pendientes",
"currentBatch": "tamaño del lote actual",
"recentPending": [
{
"id": "ID del comentario",
"date": "fecha",
"postId": "ID del post",
"excerpt": "extracto del comentario..."
}
]
}
Flujo de Trabajo
Recepción de Comentarios:
Vía webhook para comentarios nuevos
Procesamiento por lotes para comentarios pendientes
Clasificación:
Análisis del comentario usando OpenAI
Clasificación como "Correcto" o "Spam"
Procesamiento:
Comentarios spam: Marcados como spam en WordPress
Comentarios correctos:
Generación de respuesta personalizada
Aprobación del comentario original
Publicación de la respuesta
Marcado como procesado
Configuración de Procesamiento por Lotes
config.BATCH_SIZE = 50; // Comentarios por lote
config.DELAY_BETWEEN_COMMENTS = 1000; // 1 segundo entre comentarios
config.DELAY_BETWEEN_BATCHES = 5000; // 5 segundos entre lotes
Monitoreo y Logs
El servicio proporciona logs detallados de:
Inicialización del servicio
Procesamiento de comentarios
Clasificaciones de IA
Respuestas generadas
Errores y excepciones
Seguridad
Autenticación básica para API WordPress
Verificación de secreto compartido para webhooks
Manejo seguro de credenciales via Secret Manager
Timeouts y reintentos configurados
Mantenimiento
El servicio incluye:
Procesamiento automático diario
Sistema de reintentos para errores
Manejo de rate limits
Procesamiento continuo de lotes grandes
Solución de Problemas
Si encuentras problemas:
Verificar logs del servicio
Comprobar credenciales en Secret Manager
Verificar permisos de WordPress
Comprobar conectividad con APIs
Contribución
Las contribuciones son bienvenidas. Por favor:
Fork del repositorio
Crear rama feature (git checkout -b feature/AmazingFeature)
Commit cambios (git commit -m 'Add AmazingFeature')
Push a la rama (git push origin feature/AmazingFeature)
Abrir Pull Request
Licencia
[Especificar licencia]