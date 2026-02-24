-- ============================================================
-- Asiste ING S.A.S. — Esquema de base de datos
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS asiste_ing_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE asiste_ing_db;

-- ── Tabla: contactos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contactos (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(150)     NOT NULL,
  telefono        VARCHAR(30)      NOT NULL,
  email           VARCHAR(200)     NOT NULL,
  codigo_postal   CHAR(10)         NOT NULL,
  mensaje         TEXT,
  acepta_terminos TINYINT(1)       NOT NULL DEFAULT 0,
  leido           TINYINT(1)       NOT NULL DEFAULT 0,
  fecha_creacion  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: aspirantes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aspirantes (
  id                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(150)   NOT NULL,
  cedula              VARCHAR(20)    NOT NULL,
  edad                TINYINT        NOT NULL,
  telefono1           VARCHAR(30)    NOT NULL,
  telefono2           VARCHAR(30),
  experiencia         ENUM(
                        'sin_experiencia',
                        'menos_6_meses',
                        '6_meses_1_anno',
                        '1_2_annos',
                        'mas_2_annos'
                      )              NOT NULL DEFAULT 'sin_experiencia',
  acepta_terminos     TINYINT(1)     NOT NULL DEFAULT 0,
  estado              ENUM(
                        'pendiente',
                        'en_revision',
                        'entrevista',
                        'seleccionado',
                        'descartado'
                      )              NOT NULL DEFAULT 'pendiente',
  notas               TEXT,
  fecha_postulacion   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cedula (cedula),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha_postulacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: blog_posts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  titulo              VARCHAR(300)   NOT NULL,
  slug                VARCHAR(300)   NOT NULL,
  resumen             TEXT,
  contenido           LONGTEXT       NOT NULL,
  categoria           VARCHAR(100),
  imagen              VARCHAR(500),
  autor               VARCHAR(150)   NOT NULL DEFAULT 'Equipo Asiste ING',
  publicado           TINYINT(1)     NOT NULL DEFAULT 0,
  vistas              INT UNSIGNED   NOT NULL DEFAULT 0,
  fecha_publicacion   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slug (slug),
  INDEX idx_publicado (publicado),
  INDEX idx_categoria (categoria),
  INDEX idx_fecha (fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Datos de ejemplo: blog_posts ──────────────────────────────
INSERT INTO blog_posts (titulo, slug, resumen, contenido, categoria, autor, publicado) VALUES
(
  '¿Qué es el BPO y por qué tu empresa lo necesita?',
  'que-es-el-bpo-y-por-que-tu-empresa-lo-necesita',
  'Descubre cómo el Business Process Outsourcing puede transformar tu operación y darte ventaja competitiva en el mercado actual.',
  '<h2>¿Qué es el BPO?</h2>
<p>El Business Process Outsourcing (BPO) es la práctica de delegar procesos de negocio a proveedores externos especializados. En lugar de gestionar internamente tareas como la atención al cliente, el soporte técnico o las ventas, las empresas confían estas funciones a socios estratégicos con la experiencia y los recursos necesarios.</p>

<h2>Beneficios del BPO para tu empresa</h2>
<p>Implementar una estrategia de BPO ofrece múltiples ventajas:</p>
<ul>
<li><strong>Reducción de costos operativos:</strong> Elimina la necesidad de invertir en infraestructura, tecnología y personal especializado.</li>
<li><strong>Acceso a expertise:</strong> Trabajas con equipos ya formados y con experiencia comprobada.</li>
<li><strong>Escalabilidad:</strong> Puedes aumentar o reducir la capacidad según las necesidades del negocio.</li>
<li><strong>Foco en el core business:</strong> Tu equipo interno se concentra en lo que realmente diferencia a tu empresa.</li>
</ul>

<h2>¿Por qué elegir a Asiste ING?</h2>
<p>En Asiste ING S.A.S. llevamos más de 3 años siendo el aliado estratégico de empresas colombianas que buscan optimizar sus operaciones de Contact Center y BPO. Nuestro equipo multidisciplinario, combinado con tecnología de vanguardia, garantiza resultados medibles desde el primer mes.</p>
<p>Contáctanos y descubre cómo podemos transformar tu operación.</p>',
  'BPO',
  'Equipo Asiste ING',
  1
),
(
  'Claves para mejorar el First Call Resolution en tu Contact Center',
  'claves-para-mejorar-el-first-call-resolution',
  'El FCR es uno de los KPIs más importantes en la industria. Aprende las estrategias más efectivas para resolverlo al primer contacto.',
  '<h2>¿Qué es el First Call Resolution (FCR)?</h2>
<p>El First Call Resolution (FCR) o Resolución en el Primer Contacto es el porcentaje de llamadas o interacciones que se resuelven satisfactoriamente sin necesidad de que el cliente vuelva a contactar por el mismo problema.</p>

<h2>¿Por qué es tan importante?</h2>
<p>Un alto FCR está directamente relacionado con:</p>
<ul>
<li>Mayor satisfacción del cliente (CSAT)</li>
<li>Reducción de costos operativos</li>
<li>Menor carga de trabajo para el equipo</li>
<li>Mejora del Net Promoter Score (NPS)</li>
</ul>

<h2>5 estrategias para mejorar tu FCR</h2>
<ol>
<li><strong>Formación continua del agente:</strong> Un agente bien entrenado puede resolver más situaciones sin escalar.</li>
<li><strong>Base de conocimiento actualizada:</strong> Acceso rápido a información precisa y actualizada.</li>
<li><strong>Escucha activa:</strong> Entender completamente el problema antes de ofrecer soluciones.</li>
<li><strong>Empoderamiento del agente:</strong> Darles autoridad para resolver casos sin necesitar aprobación constante.</li>
<li><strong>Análisis de causas raíz:</strong> Identificar los problemas frecuentes y resolverlos sistemáticamente.</li>
</ol>

<p>En Asiste ING alcanzamos consistentemente FCR superiores al 80% gracias a nuestros programas de formación y nuestros protocolos de calidad.</p>',
  'Soporte Técnico',
  'Equipo Asiste ING',
  1
),
(
  '5 técnicas de cierre de ventas para equipos de telemercadeo',
  '5-tecnicas-de-cierre-de-ventas-para-telemercadeo',
  'Eleva la tasa de conversión de tu equipo comercial con estas técnicas de cierre probadas en el entorno de ventas telefónicas.',
  '<h2>El cierre: el momento decisivo en telemercadeo</h2>
<p>En las ventas telefónicas, el cierre es el momento en que todo el trabajo previo se convierte en un resultado concreto. Dominar las técnicas de cierre puede marcar la diferencia entre un equipo promedio y uno de alto rendimiento.</p>

<h2>5 técnicas efectivas de cierre</h2>

<h3>1. Cierre por Alternativa</h3>
<p>En lugar de preguntar si el cliente quiere comprar, ofrece dos opciones positivas: "¿Prefiere el plan mensual o el anual?" Esto presupone la venta y enfoca al cliente en decidir entre opciones, no en si comprar o no.</p>

<h3>2. Cierre por Urgencia</h3>
<p>Crea un sentido de urgencia genuino: "Esta promoción termina hoy" o "Solo nos quedan 3 unidades". Importante: la urgencia debe ser real para mantener la credibilidad.</p>

<h3>3. Cierre por Resumen</h3>
<p>Resume todos los beneficios antes de cerrar: "Entonces, con este plan usted obtiene X, Y y Z, todo por solo $..." Esto refuerza el valor y ayuda al cliente a recordar por qué la decisión tiene sentido.</p>

<h3>4. Cierre de Prueba</h3>
<p>Ofrece una experiencia de prueba o garantía de devolución: "Pruébelo por 30 días sin compromiso." Reduce el riesgo percibido y facilita la decisión.</p>

<h3>5. Cierre por Silencio</h3>
<p>Después de presentar la oferta y hacer la pregunta de cierre, guarda silencio. El silencio puede ser incómodo, pero quien habla primero suele ser quien cede. Deja que el cliente procese y responda.</p>

<h2>Conclusión</h2>
<p>En Asiste ING entrenamos a nuestros equipos en estas y otras técnicas avanzadas, lo que nos ha posicionado como el #1 en efectividad en ventas de tecnología.</p>',
  'Ventas',
  'Equipo Asiste ING',
  1
),
(
  'Tendencias del Contact Center para 2025 y 2026',
  'tendencias-contact-center-2025-2026',
  'IA, omnicanalidad y experiencias personalizadas: así está evolucionando el Contact Center. Prepárate para el futuro.',
  '<h2>El Contact Center en transformación</h2>
<p>La industria del Contact Center está experimentando una revolución impulsada por la inteligencia artificial, la automatización y las crecientes expectativas de los clientes. Las empresas que no se adapten quedarán rezagadas.</p>

<h2>Tendencias clave para 2025-2026</h2>

<h3>1. Inteligencia Artificial y Chatbots avanzados</h3>
<p>Los chatbots de nueva generación, basados en modelos de lenguaje grandes (LLM), son capaces de manejar conversaciones complejas y resolver hasta el 70% de las consultas sin intervención humana.</p>

<h3>2. Omnicanalidad real</h3>
<p>Los clientes esperan una experiencia consistente sin importar el canal: voz, chat, email, redes sociales o WhatsApp. La integración de todos estos canales en una única plataforma es ya una necesidad, no una opción.</p>

<h3>3. Análisis en tiempo real</h3>
<p>Las herramientas de análisis de sentimientos y speech analytics permiten supervisar la calidad de las interacciones en tiempo real, identificando problemas antes de que escalen.</p>

<h3>4. Trabajo híbrido consolidado</h3>
<p>El modelo de agentes en casa (work from home) llegó para quedarse. Las empresas que logren gestionar equipos híbridos de forma efectiva tendrán acceso a un talento humano más amplio y diverso.</p>

<h3>5. Hiperpersonalización</h3>
<p>Usando datos del cliente, los agentes pueden ofrecer interacciones verdaderamente personalizadas, aumentando la satisfacción y las tasas de retención.</p>

<h2>¿Está tu empresa preparada?</h2>
<p>En Asiste ING ya estamos implementando estas tendencias. Contáctanos para conocer cómo podemos llevar tu Contact Center al siguiente nivel.</p>',
  'Tendencias',
  'Equipo Asiste ING',
  1
);
