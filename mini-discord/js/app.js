/* ================================================================
   app.js — MiniCord
   Lógica principal de la aplicación de chat tipo Discord.
   
   ÍNDICE DE SECCIONES:
   1.  ESTADO GLOBAL (datos de la app)
   2.  USUARIOS SIMULADOS
   3.  MENSAJES INICIALES POR CANAL
   4.  FUNCIONES DE UTILIDAD
   5.  SISTEMA DE NOTIFICACIONES TOAST
   6.  HISTORIAL DE ACTIVIDAD
   7.  RENDERIZADO DE USUARIOS
   8.  RENDERIZADO DE MENSAJES
   9.  ACCIONES DE MENSAJES (editar, eliminar, fijar, reaccionar)
   10. MENSAJES FAVORITOS
   11. MENSAJES FIJADOS (sidebar)
   12. ENVÍO DE MENSAJES
   13. BUSCADOR DE MENSAJES
   14. USUARIOS SIMULADOS CON BOT AUTOMÁTICO
   15. SELECTOR DE CANALES
   16. MODALES (configuración, actividad, favoritos)
   17. EMOJI PICKER
   18. MOBILE (hamburger menu)
   19. INICIALIZACIÓN
================================================================ */

/* ================================================================
   1. ESTADO GLOBAL
   Objeto central que contiene todos los datos de la aplicación.
   Es la "fuente de verdad" de la app.
================================================================ */
const STATE = {
  currentChannel: 'general',  // Canal activo actualmente
  currentUser: {
    name: 'Yo',               // Nombre del usuario (editable en configuración)
    avatarColor: '#5865f2',   // Color del avatar
    status: 'online'
  },
  messages: {},               // Objeto: { 'general': [...msgs], 'gaming': [...] }
  pinnedMessages: [],         // Array de IDs de mensajes fijados
  favoriteMessages: [],       // Array de IDs de mensajes favoritos (desafío extra)
  activityLog: [],            // Historial de acciones (desafío extra)
  searchQuery: '',            // Texto actual en el buscador
  nextMsgId: 1000,            // ID autoincremental para mensajes nuevos
};

/* ================================================================
   2. USUARIOS SIMULADOS
   Lista de usuarios "falsos" que aparecen en el sidebar derecho
   y como autores de mensajes de bots/predefinidos.
================================================================ */
const SIMULATED_USERS = [
  { id: 'u1', name: 'Luna',    color: '#ed4245', status: 'online'  },
  { id: 'u2', name: 'Marco',   color: '#57f287', status: 'online'  },
  { id: 'u3', name: 'Zara',    color: '#eb459e', status: 'online'  },
  { id: 'u4', name: 'Pixel',   color: '#ff9500', status: 'offline' },
  { id: 'u5', name: 'Nyx',     color: '#fee75c', status: 'offline' },
  { id: 'u6', name: 'Deco',    color: '#5865f2', status: 'online'  },
];

/* ================================================================
   3. MENSAJES INICIALES POR CANAL
   Datos de ejemplo para poblar los canales cuando la app carga.
   Cada mensaje tiene: id, author, text, time, avatar, reactions,
   isPinned, isFavorite, isEdited.
================================================================ */
const INITIAL_MESSAGES = {
  general: [
    {
      id: 1, author: 'Luna', authorColor: '#ed4245', status: 'online',
      text: '¡Bienvenidos a MiniCord! 🎉 Esto es el canal general.',
      time: '10:00', reactions: { '👍': 3, '❤️': 2 },
      isPinned: true, isFavorite: false, isEdited: false, channel: 'general'
    },
    {
      id: 2, author: 'Marco', authorColor: '#57f287', status: 'online',
      text: '¿Cómo están todos hoy? 😄',
      time: '10:02', reactions: { '😂': 1 },
      isPinned: false, isFavorite: false, isEdited: false, channel: 'general'
    },
    {
      id: 3, author: 'Zara', authorColor: '#eb459e', status: 'online',
      text: '¡Muy bien! Este chat se ve increíble 🔥',
      time: '10:05', reactions: {},
      isPinned: false, isFavorite: false, isEdited: false, channel: 'general'
    },
  ],
  gaming: [
    {
      id: 10, author: 'Pixel', authorColor: '#ff9500', status: 'offline',
      text: '¿Alguien quiere jugar esta noche? 🎮',
      time: '09:30', reactions: { '🔥': 4, '👍': 2 },
      isPinned: false, isFavorite: false, isEdited: false, channel: 'gaming'
    },
    {
      id: 11, author: 'Deco', authorColor: '#5865f2', status: 'online',
      text: 'Yo me apunto, tengo el nuevo juego instalado.',
      time: '09:35', reactions: { '👍': 1 },
      isPinned: false, isFavorite: false, isEdited: false, channel: 'gaming'
    },
  ],
  memes: [
    {
      id: 20, author: 'Nyx', authorColor: '#fee75c', status: 'offline',
      text: 'Cuando el código funciona sin saber por qué 😂😂😂',
      time: '08:00', reactions: { '😂': 8, '💯': 3 },
      isPinned: false, isFavorite: false, isEdited: false, channel: 'memes'
    },
  ],
  musica: [
    {
      id: 30, author: 'Luna', authorColor: '#ed4245', status: 'online',
      text: '🎵 Escuchando lo nuevo de esta semana, ¡está buenísimo!',
      time: '11:00', reactions: { '❤️': 5 },
      isPinned: true, isFavorite: false, isEdited: false, channel: 'musica'
    },
  ],
  privado: [
    {
      id: 40, author: 'Marco', authorColor: '#57f287', status: 'online',
      text: '🔒 Este es el canal privado. Solo para mensajes especiales.',
      time: '12:00', reactions: {},
      isPinned: false, isFavorite: false, isEdited: false, channel: 'privado'
    },
  ]
};

/* ================================================================
   4. FUNCIONES DE UTILIDAD
================================================================ */

/**
 * Genera la hora actual en formato HH:MM
 * Se usa para el timestamp de los mensajes enviados ahora.
 */
function getCurrentTime() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Devuelve la inicial de un nombre (para los avatares de texto)
 * Ej: 'Luna' → 'L'
 */
function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

/**
 * Formatea una fecha/hora para el historial de actividad
 */
function getActivityTime() {
  return new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/**
 * Busca un mensaje por su ID en todos los canales
 * Retorna { msg, channel } o null si no se encuentra
 */
function findMessageById(id) {
  for (const [channel, msgs] of Object.entries(STATE.messages)) {
    const msg = msgs.find(m => m.id === id);
    if (msg) return { msg, channel };
  }
  return null;
}

/* ================================================================
   5. SISTEMA DE NOTIFICACIONES TOAST
   Muestra mensajes breves en la esquina superior derecha.
================================================================ */

/**
 * Muestra una notificación toast temporal.
 * @param {string} text    - Mensaje a mostrar
 * @param {string} type    - 'info' | 'success' | 'danger' | 'warning'
 * @param {string} emoji   - Emoji decorativo
 */
function showToast(text, type = 'info', emoji = '💬') {
  const container = document.getElementById('toast-container');

  // Crear elemento toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${emoji}</span><span>${text}</span>`;
  container.appendChild(toast);

  // Auto-cerrar después de 3 segundos con animación de salida
  setTimeout(() => {
    toast.classList.add('hiding');               // Clase que dispara animación CSS
    toast.addEventListener('animationend', () => toast.remove()); // Eliminar del DOM al terminar
  }, 3000);
}

/* ================================================================
   6. HISTORIAL DE ACTIVIDAD (Desafío Extra)
   Registra acciones del usuario para el modal de actividad.
================================================================ */

/**
 * Agrega una entrada al historial de actividad.
 * @param {string} icon    - Emoji representativo
 * @param {string} text    - Descripción de la acción
 */
function logActivity(icon, text) {
  STATE.activityLog.unshift({          // unshift: agrega al inicio del array
    icon,
    text,
    time: getActivityTime()
  });
  // Límite de 50 entradas para no consumir mucha memoria
  if (STATE.activityLog.length > 50) STATE.activityLog.pop();
}

/* ================================================================
   7. RENDERIZADO DE USUARIOS
   Muestra los usuarios en el sidebar derecho con su estado online/offline.
================================================================ */

function renderUsers() {
  const onlineList  = document.getElementById('online-users-list');
  const offlineList = document.getElementById('offline-users-list');
  const onlineCount = document.getElementById('online-count');

  onlineList.innerHTML  = '';
  offlineList.innerHTML = '';

  let onlineQty = 0;

  SIMULATED_USERS.forEach(user => {
    if (user.status === 'online') onlineQty++;

    // Construir HTML del item de usuario
    const li = document.createElement('li');
    li.className = `user-item ${user.status}`;
    li.innerHTML = `
      <div class="user-item-avatar" style="background:${user.color}">
        ${getInitial(user.name)}
        <span class="status-dot ${user.status}"></span>
      </div>
      <span class="user-item-name">${user.name}</span>
    `;

    // Agregar a la lista correspondiente según el estado
    if (user.status === 'online') {
      onlineList.appendChild(li);
    } else {
      offlineList.appendChild(li);
    }
  });

  onlineCount.textContent = onlineQty;
}

/* ================================================================
   8. RENDERIZADO DE MENSAJES
   Construye el HTML de cada mensaje y lo inyecta en el área de chat.
================================================================ */

/**
 * Renderiza todos los mensajes del canal actual en el área de mensajes.
 * Si hay búsqueda activa, filtra los mensajes.
 */
function renderMessages() {
  const area = document.getElementById('messages-area');
  const msgs = STATE.messages[STATE.currentChannel] || [];

  area.innerHTML = '';

  // Actualizar contador de mensajes del canal (desafío extra)
  document.getElementById('msg-count').textContent = msgs.length;

  // Mensaje de bienvenida si el canal está vacío
  if (msgs.length === 0) {
    area.innerHTML = `
      <div class="welcome-msg">
        <h3># ${STATE.currentChannel}</h3>
        <p>Este es el inicio del canal. ¡Empieza la conversación!</p>
      </div>`;
    return;
  }

  // Renderizar cada mensaje
  msgs.forEach(msg => {
    const el = renderSingleMessage(msg);
    area.appendChild(el);
  });

  // Aplicar filtro de búsqueda si hay una query activa
  if (STATE.searchQuery) applySearchFilter();

  // Auto-scroll al último mensaje
  scrollToBottom();
}

/**
 * Construye el elemento DOM de un mensaje individual.
 * @param {Object} msg - Objeto con datos del mensaje
 * @returns {HTMLElement}
 */
function renderSingleMessage(msg) {
  const el = document.createElement('div');

  // Clases CSS condicionales según propiedades del mensaje
  el.className = [
    'message',
    msg.isPinned   ? 'is-pinned'   : '',
    msg.isFavorite ? 'is-favorite' : '',
  ].filter(Boolean).join(' ');

  el.dataset.id = msg.id; // Guardar ID en atributo data para referencias posteriores

  // ── Construir el HTML del mensaje ──
  el.innerHTML = `
    <!-- Avatar con indicador de estado online/offline -->
    <div class="msg-avatar" style="background:${msg.authorColor || '#5865f2'}">
      ${getInitial(msg.author)}
      <span class="status-dot ${msg.status || 'offline'}"></span>
    </div>

    <div class="msg-content">
      <!-- Encabezado: nombre, hora, badge de canal privado si aplica -->
      <div class="msg-header">
        <span class="msg-author" style="color:${msg.authorColor || '#5865f2'}">
          ${msg.author}
        </span>
        <span class="msg-time">${msg.time}</span>
        ${msg.channel === 'privado' ? '<span class="channel-badge private">🔒 privado</span>' : ''}
        ${msg.isEdited ? '<span class="edited-tag">(editado)</span>' : ''}
      </div>

      <!-- Texto del mensaje -->
      <div class="msg-text" id="text-${msg.id}">${msg.text}</div>

      <!-- Barra de reacciones con emojis -->
      <div class="reactions-bar" id="reactions-${msg.id}">
        ${renderReactions(msg)}
        <!-- Botón para agregar nueva reacción -->
        <button class="add-reaction-btn" onclick="openReactionPicker(${msg.id})" title="Agregar reacción">
          +😊
        </button>
      </div>
    </div>

    <!-- Botones de acción (visibles solo en hover) -->
    <div class="message-actions">
      <!-- Reaccionar rápido -->
      <button class="action-btn" onclick="quickReact(${msg.id},'👍')" title="👍">👍</button>
      <button class="action-btn" onclick="quickReact(${msg.id},'❤️')" title="❤️">❤️</button>
      <button class="action-btn" onclick="quickReact(${msg.id},'🔥')" title="🔥">🔥</button>

      <!-- Favorito (⭐) — solo si es mensaje del usuario actual -->
      <button class="action-btn favorite ${msg.isFavorite ? 'fav-active' : ''}"
              onclick="toggleFavorite(${msg.id})"
              title="${msg.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
        ${msg.isFavorite ? '⭐' : '☆'}
      </button>

      <!-- Fijar mensaje (📌) -->
      <button class="action-btn ${msg.isPinned ? 'pinned-active' : ''}"
              onclick="togglePin(${msg.id})"
              title="${msg.isPinned ? 'Desfijar' : 'Fijar mensaje'}">
        <i data-lucide="${msg.isPinned ? 'pin-off' : 'pin'}"></i>
      </button>

      <!-- Editar mensaje (solo si es del usuario actual) -->
      ${msg.isOwn ? `
        <button class="action-btn" onclick="startEdit(${msg.id})" title="Editar">
          <i data-lucide="pencil"></i>
        </button>
      ` : ''}

      <!-- Eliminar mensaje (solo si es del usuario actual) -->
      ${msg.isOwn ? `
        <button class="action-btn delete" onclick="deleteMessage(${msg.id})" title="Eliminar">
          <i data-lucide="trash-2"></i>
        </button>
      ` : ''}
    </div>
  `;

  // Re-inicializar los íconos de Lucide dentro del nuevo elemento
  lucide.createIcons({ nodes: el.querySelectorAll('[data-lucide]') });

  return el;
}

/**
 * Genera el HTML de los botones de reacciones para un mensaje.
 * @param {Object} msg - Mensaje con su objeto reactions { emoji: count }
 * @returns {string} HTML con botones de reacción
 */
function renderReactions(msg) {
  return Object.entries(msg.reactions || {})
    .filter(([, count]) => count > 0) // Solo mostrar reacciones con count > 0
    .map(([emoji, count]) => {
      // Verificar si el usuario actual ya reaccionó con este emoji
      const reacted = (msg.userReactions || []).includes(emoji);
      return `
        <button class="reaction-btn ${reacted ? 'reacted' : ''}"
                onclick="toggleReaction(${msg.id}, '${emoji}')"
                title="Reaccionar con ${emoji}">
          ${emoji} <span class="reaction-count">${count}</span>
        </button>`;
    }).join('');
}

/**
 * Hace scroll suave hasta el último mensaje del área de chat.
 */
function scrollToBottom() {
  const area = document.getElementById('messages-area');
  area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
}

/* ================================================================
   9. ACCIONES DE MENSAJES
================================================================ */

/**
 * Elimina un mensaje del canal actual.
 * Pide confirmación antes de borrar.
 * @param {number} id - ID del mensaje a eliminar
 */
function deleteMessage(id) {
  if (!confirm('¿Eliminar este mensaje?')) return;

  const msgs = STATE.messages[STATE.currentChannel];
  const idx  = msgs.findIndex(m => m.id === id);
  if (idx === -1) return;

  const deleted = msgs.splice(idx, 1)[0]; // Eliminar del array

  // Quitar de fijados si estaba fijado
  STATE.pinnedMessages = STATE.pinnedMessages.filter(pid => pid !== id);

  // Quitar de favoritos si estaba marcado
  STATE.favoriteMessages = STATE.favoriteMessages.filter(fid => fid !== id);

  // Re-renderizar
  renderMessages();
  renderPinnedMessages();
  updateMessageCount();

  // Feedback y registro
  showToast('Mensaje eliminado', 'danger', '🗑️');
  logActivity('🗑️', `Mensaje eliminado en #${STATE.currentChannel}: "${deleted.text.substring(0, 40)}..."`);
}

/**
 * Inicia el modo de edición de un mensaje.
 * Reemplaza el texto del mensaje por un textarea editable.
 * @param {number} id - ID del mensaje a editar
 */
function startEdit(id) {
  const msg = STATE.messages[STATE.currentChannel]?.find(m => m.id === id);
  if (!msg) return;

  const textEl = document.getElementById(`text-${id}`);

  // Construir la interfaz de edición en el lugar del texto
  textEl.innerHTML = `
    <textarea class="edit-input" id="edit-input-${id}">${msg.text}</textarea>
    <div class="edit-actions">
      <button class="edit-confirm" onclick="confirmEdit(${id})">✔ Guardar</button>
      <button class="edit-cancel"  onclick="cancelEdit(${id}, \`${msg.text.replace(/`/g, '\\`')}\`)">✖ Cancelar</button>
    </div>
  `;

  // Poner foco en el textarea y posicionar cursor al final
  const ta = document.getElementById(`edit-input-${id}`);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

/**
 * Confirma y guarda la edición de un mensaje.
 * @param {number} id - ID del mensaje editado
 */
function confirmEdit(id) {
  const ta = document.getElementById(`edit-input-${id}`);
  if (!ta) return;

  const newText = ta.value.trim();
  if (!newText) { showToast('El mensaje no puede estar vacío', 'warning', '⚠️'); return; }

  // Actualizar el mensaje en el estado
  const msg = STATE.messages[STATE.currentChannel]?.find(m => m.id === id);
  if (!msg) return;

  const oldText = msg.text;
  msg.text = newText;
  msg.isEdited = true; // Marcar como editado (muestra el tag "editado")

  // Re-renderizar para reflejar los cambios
  renderMessages();

  showToast('Mensaje editado', 'success', '✏️');
  logActivity('✏️', `Mensaje editado en #${STATE.currentChannel}: "${oldText.substring(0, 30)}" → "${newText.substring(0, 30)}"`);
}

/**
 * Cancela la edición y restaura el texto original.
 * @param {number} id       - ID del mensaje
 * @param {string} original - Texto original antes de la edición
 */
function cancelEdit(id, original) {
  const textEl = document.getElementById(`text-${id}`);
  if (textEl) textEl.innerHTML = original; // Restaurar texto
}

/**
 * Alterna el estado de "fijado" de un mensaje.
 * Los mensajes fijados se muestran en el sidebar izquierdo.
 * @param {number} id - ID del mensaje
 */
function togglePin(id) {
  const result = findMessageById(id);
  if (!result) return;

  const { msg } = result;
  msg.isPinned = !msg.isPinned; // Alternar estado

  if (msg.isPinned) {
    STATE.pinnedMessages.push(id); // Agregar a la lista de fijados
    showToast('Mensaje fijado 📌', 'warning', '📌');
    logActivity('📌', `Mensaje fijado: "${msg.text.substring(0, 40)}"`);
  } else {
    STATE.pinnedMessages = STATE.pinnedMessages.filter(pid => pid !== id); // Quitar de la lista
    showToast('Mensaje desfijado', 'info', '📌');
    logActivity('📌', `Mensaje desfijado: "${msg.text.substring(0, 40)}"`);
  }

  renderMessages();
  renderPinnedMessages(); // Actualizar el sidebar de fijados
}

/**
 * Agrega o quita una reacción de un mensaje.
 * Si el usuario ya reaccionó con ese emoji, lo quita; si no, lo agrega.
 * @param {number} msgId - ID del mensaje
 * @param {string} emoji - Emoji de la reacción
 */
function toggleReaction(msgId, emoji) {
  const result = findMessageById(msgId);
  if (!result) return;

  const { msg } = result;

  // Inicializar el array de reacciones del usuario si no existe
  if (!msg.userReactions) msg.userReactions = [];

  const alreadyReacted = msg.userReactions.includes(emoji);

  if (alreadyReacted) {
    // Quitar reacción: reducir contador y quitar del array del usuario
    msg.userReactions = msg.userReactions.filter(e => e !== emoji);
    if (msg.reactions[emoji] > 0) msg.reactions[emoji]--;
    // Si el contador llega a 0, no se mostrará (filtrado en renderReactions)
  } else {
    // Agregar reacción: incrementar contador
    msg.userReactions.push(emoji);
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
  }

  // Re-renderizar solo la barra de reacciones del mensaje (más eficiente que todo)
  const reactionsBar = document.getElementById(`reactions-${msgId}`);
  if (reactionsBar) {
    reactionsBar.innerHTML = renderReactions(msg) +
      `<button class="add-reaction-btn" onclick="openReactionPicker(${msgId})" title="Agregar reacción">+😊</button>`;
  }
}

/**
 * Reacción rápida desde el menú de acciones del mensaje.
 * @param {number} msgId - ID del mensaje
 * @param {string} emoji - Emoji de la reacción rápida
 */
function quickReact(msgId, emoji) {
  toggleReaction(msgId, emoji);
  showToast(`Reaccionaste con ${emoji}`, 'success', emoji);
}

/**
 * Abre un pequeño selector de emojis para agregar reacción.
 * Usa el emoji picker global de la app (simplificado).
 * @param {number} msgId - ID del mensaje
 */
function openReactionPicker(msgId) {
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '😢', '🎉', '💯'];

  // Crear un picker temporal
  const picker = document.createElement('div');
  picker.className = 'emoji-picker';
  picker.style.cssText = 'position:fixed;z-index:99;';

  REACTION_EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-item';
    btn.textContent = emoji;
    btn.onclick = () => {
      toggleReaction(msgId, emoji);
      picker.remove();
    };
    picker.appendChild(btn);
  });

  document.body.appendChild(picker);

  // Centrar el picker en la pantalla
  const rect = picker.getBoundingClientRect();
  picker.style.top  = `${(window.innerHeight - rect.height) / 2}px`;
  picker.style.left = `${(window.innerWidth  - rect.width)  / 2}px`;

  // Cerrar picker al hacer clic fuera
  setTimeout(() => {
    document.addEventListener('click', function handler() {
      picker.remove();
      document.removeEventListener('click', handler);
    });
  }, 10);
}

/* ================================================================
   10. MENSAJES FAVORITOS (Desafío Extra)
   El usuario puede marcar mensajes con ⭐ y verlos en un modal.
================================================================ */

/**
 * Alterna el estado de "favorito" de un mensaje.
 * @param {number} id - ID del mensaje
 */
function toggleFavorite(id) {
  const result = findMessageById(id);
  if (!result) return;

  const { msg } = result;
  msg.isFavorite = !msg.isFavorite;

  if (msg.isFavorite) {
    STATE.favoriteMessages.push(id);
    showToast('Agregado a favoritos ⭐', 'warning', '⭐');
    logActivity('⭐', `Mensaje marcado como favorito: "${msg.text.substring(0, 40)}"`);
  } else {
    STATE.favoriteMessages = STATE.favoriteMessages.filter(fid => fid !== id);
    showToast('Quitado de favoritos', 'info', '☆');
  }

  renderMessages();
}

/**
 * Renderiza el modal de mensajes favoritos.
 * Muestra todos los mensajes marcados con ⭐ en todos los canales.
 */
function renderFavoritesModal() {
  const list = document.getElementById('favorites-list');
  list.innerHTML = '';

  // Recopilar todos los mensajes favoritos de todos los canales
  const favMsgs = [];
  for (const [channel, msgs] of Object.entries(STATE.messages)) {
    msgs.filter(m => m.isFavorite).forEach(m => favMsgs.push({ ...m, channel }));
  }

  if (favMsgs.length === 0) {
    list.innerHTML = '<p class="fav-empty">No tienes mensajes favoritos aún. Marca mensajes con ⭐</p>';
    return;
  }

  // Renderizar cada mensaje favorito
  favMsgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'fav-item';
    div.innerHTML = `
      <div class="fav-item-header">
        <div class="fav-item-avatar" style="background:${msg.authorColor}">${getInitial(msg.author)}</div>
        <span class="fav-author" style="color:${msg.authorColor}">${msg.author}</span>
        <span class="fav-channel">#${msg.channel} · ${msg.time}</span>
      </div>
      <div class="fav-text">${msg.text}</div>
    `;
    list.appendChild(div);
  });
}

/* ================================================================
   11. MENSAJES FIJADOS — Sidebar izquierdo
   Muestra los mensajes fijados en la sección del sidebar.
================================================================ */

function renderPinnedMessages() {
  const container = document.getElementById('pinned-list');
  container.innerHTML = '';

  // Recopilar todos los mensajes fijados de todos los canales
  const pinned = [];
  for (const [channel, msgs] of Object.entries(STATE.messages)) {
    msgs.filter(m => m.isPinned).forEach(m => pinned.push({ ...m, channel }));
  }

  if (pinned.length === 0) {
    container.innerHTML = '<p class="pinned-empty">Sin mensajes fijados</p>';
    return;
  }

  // Renderizar cada mensaje fijado como item clickeable
  pinned.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'pinned-item';
    div.title = msg.text;
    div.innerHTML = `
      <div class="pinned-author" style="color:${msg.authorColor}">${msg.author} · #${msg.channel}</div>
      <div>${msg.text.substring(0, 60)}${msg.text.length > 60 ? '...' : ''}</div>
    `;
    // Al hacer clic, ir al canal del mensaje fijado
    div.onclick = () => switchChannel(msg.channel);
    container.appendChild(div);
  });
}

/* ================================================================
   12. ENVÍO DE MENSAJES
================================================================ */

/**
 * Envía el mensaje escrito por el usuario.
 * Crea un nuevo objeto de mensaje y lo agrega al canal actual.
 */
function sendMessage() {
  const input = document.getElementById('message-input');
  const text  = input.value.trim();

  if (!text) return; // No enviar mensajes vacíos

  // Crear objeto del nuevo mensaje
  const newMsg = {
    id:          STATE.nextMsgId++,          // ID único autoincremental
    author:      STATE.currentUser.name,
    authorColor: STATE.currentUser.avatarColor,
    status:      'online',
    text,
    time:        getCurrentTime(),
    reactions:   {},
    userReactions: [],
    isPinned:    false,
    isFavorite:  false,
    isEdited:    false,
    isOwn:       true,                       // Marcado como propio (habilita editar/eliminar)
    channel:     STATE.currentChannel
  };

  // Agregar al array del canal actual
  STATE.messages[STATE.currentChannel].push(newMsg);

  // Limpiar input y resetear altura
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('char-counter').textContent = '0/2000';

  // Re-renderizar mensajes y actualizar contador
  renderMessages();
  updateMessageCount();
  logActivity('💬', `Mensaje enviado en #${STATE.currentChannel}: "${text.substring(0, 40)}"`);

  // Simular que otro usuario responde después de un tiempo aleatorio
  simulateResponse();
}

/**
 * Actualiza el contador de mensajes en el header del canal.
 */
function updateMessageCount() {
  const count = (STATE.messages[STATE.currentChannel] || []).length;
  document.getElementById('msg-count').textContent = count;
}

/* ================================================================
   13. BUSCADOR DE MENSAJES
   Filtra los mensajes del canal actual según el texto ingresado.
================================================================ */

/**
 * Aplica el filtro de búsqueda sobre los mensajes renderizados.
 * Oculta los mensajes que no coinciden y resalta el texto encontrado.
 */
function applySearchFilter() {
  const query = STATE.searchQuery.toLowerCase().trim();
  const area  = document.getElementById('messages-area');

  // Obtener todos los elementos de mensaje
  const allMsgs = area.querySelectorAll('.message');

  if (!query) {
    // Sin búsqueda: mostrar todos y quitar highlights
    allMsgs.forEach(el => {
      el.classList.remove('search-match', 'search-hidden');
      // Restaurar el texto sin el tag <mark>
      const textEl = el.querySelector('.msg-text');
      const msgId  = parseInt(el.dataset.id);
      const msg    = findMessageById(msgId)?.msg;
      if (msg && textEl) textEl.innerHTML = msg.text;
    });
    area.classList.remove('search-active');
    return;
  }

  area.classList.add('search-active'); // Clase que aplica opacidad a los no-coincidentes

  allMsgs.forEach(el => {
    const msgId  = parseInt(el.dataset.id);
    const result = findMessageById(msgId);
    if (!result) return;

    const { msg } = result;
    const textEl  = el.querySelector('.msg-text');

    // Buscar coincidencia en el texto del mensaje (insensible a mayúsculas)
    if (msg.text.toLowerCase().includes(query)) {
      el.classList.add('search-match');
      el.classList.remove('search-hidden');

      // Resaltar el texto encontrado con <mark>
      if (textEl) {
        const regex      = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        textEl.innerHTML = msg.text.replace(regex, '<mark>$1</mark>');
      }
    } else {
      el.classList.remove('search-match');
      el.classList.add('search-hidden');
    }
  });
}

/* ================================================================
   14. SIMULACIÓN DE RESPUESTAS AUTOMÁTICAS (Bot)
   Simula que otros usuarios escriben y responden mensajes.
================================================================ */

/**
 * Simula que un usuario bot responde al mensaje enviado.
 * Muestra el indicador de escritura y luego agrega el mensaje.
 */
function simulateResponse() {
  // Solo responder con cierta probabilidad (50%)
  if (Math.random() < 0.5) return;

  // Elegir un usuario online al azar (excluyendo el actual)
  const onlineUsers = SIMULATED_USERS.filter(u => u.status === 'online');
  if (onlineUsers.length === 0) return;

  const botUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];

  // Respuestas predefinidas por canal
  const RESPONSES = {
    general: ['¡Interesante! 👀', 'Totalmente de acuerdo 🙌', '¡Buena idea!', '¿En serio? Cuéntame más.', '¡Genial! 🔥'],
    gaming:  ['¿Jugamos hoy? 🎮', '¡Ese juego es épico!', 'Pro gamer move 💪', 'gg ez 😂'],
    memes:   ['😂😂😂', '💀💀💀', 'No puedo más de risa', 'Clásico.', 'Esto me representa.'],
    musica:  ['🎵 Buenísimo', '¡Me encanta ese artista!', '¿Qué género es?', 'Top canción 🔥'],
    privado: ['😏', 'Shh, es privado.', '🤫', 'Solo para nosotros.'],
  };

  const channelResponses = RESPONSES[STATE.currentChannel] || RESPONSES.general;
  const responseText = channelResponses[Math.floor(Math.random() * channelResponses.length)];

  // Mostrar indicador de "está escribiendo..." después de 800ms
  const delay = 800 + Math.random() * 1200; // Entre 0.8 y 2 segundos
  setTimeout(() => {
    // Mostrar indicador de escritura
    const indicator = document.getElementById('typing-indicator');
    document.getElementById('typing-user-name').textContent = botUser.name;
    indicator.style.display = 'flex';

    // Después de otro delay, enviar el mensaje del bot y ocultar el indicador
    setTimeout(() => {
      indicator.style.display = 'none';

      const botMsg = {
        id:          STATE.nextMsgId++,
        author:      botUser.name,
        authorColor: botUser.color,
        status:      'online',
        text:        responseText,
        time:        getCurrentTime(),
        reactions:   {},
        userReactions: [],
        isPinned:    false,
        isFavorite:  false,
        isEdited:    false,
        isOwn:       false, // No es del usuario actual → sin botones editar/eliminar
        channel:     STATE.currentChannel
      };

      // Solo agregar si el usuario sigue en el mismo canal
      if (STATE.messages[STATE.currentChannel]) {
        STATE.messages[STATE.currentChannel].push(botMsg);
        renderMessages();
        updateMessageCount();

        // Notificación toast de nuevo mensaje
        showToast(`${botUser.name}: ${responseText}`, 'info', '💬');
      }
    }, 1000 + Math.random() * 500);

  }, delay);
}

/**
 * Simula notificaciones de usuarios conectándose o desconectándose.
 * Se ejecuta periódicamente en intervalos aleatorios.
 */
function simulateUserActivity() {
  setInterval(() => {
    const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];

    // Alternar estado del usuario seleccionado
    if (user.status === 'online') {
      user.status = 'offline';
      showToast(`${user.name} se desconectó`, 'danger', '🔴');
    } else {
      user.status = 'online';
      showToast(`${user.name} se conectó`, 'success', '🟢');
      logActivity('🟢', `${user.name} se conectó`);
    }

    renderUsers(); // Actualizar la lista de usuarios

  }, 15000 + Math.random() * 15000); // Cada 15-30 segundos
}

/**
 * Simula mensajes automáticos en otros canales (para mostrar badges de no-leídos).
 */
function simulateOtherChannelMessages() {
  const channels = Object.keys(STATE.messages);

  setInterval(() => {
    // Elegir un canal diferente al actual
    const otherChannels = channels.filter(c => c !== STATE.currentChannel);
    if (otherChannels.length === 0) return;

    const targetChannel = otherChannels[Math.floor(Math.random() * otherChannels.length)];
    const botUser = SIMULATED_USERS.filter(u => u.status === 'online')[0];
    if (!botUser) return;

    // Incrementar badge del canal
    const badge = document.getElementById(`badge-${targetChannel}`);
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      badge.textContent = current + 1;
      badge.style.display = 'block'; // Hacer visible el badge
    }

    showToast(`Nuevo mensaje en #${targetChannel}`, 'info', '🔔');

  }, 25000 + Math.random() * 20000); // Cada 25-45 segundos
}

/* ================================================================
   15. SELECTOR DE CANALES
   Cambia el canal activo cuando el usuario hace clic en un canal.
================================================================ */

/**
 * Cambia al canal indicado y actualiza toda la UI.
 * @param {string} channelName - Nombre del canal a activar
 */
function switchChannel(channelName) {
  if (!STATE.messages[channelName]) return;

  // Actualizar estado
  STATE.currentChannel = channelName;

  // Actualizar clases activas en la lista de canales
  document.querySelectorAll('.channel-item').forEach(item => {
    item.classList.toggle('active', item.dataset.channel === channelName);
  });

  // Actualizar nombre del canal en el header
  document.getElementById('active-channel-name').textContent = channelName;

  // Cambiar el ícono del header según el canal
  const iconHeader = document.getElementById('channel-icon-header');
  if (channelName === 'privado') {
    iconHeader.setAttribute('data-lucide', 'lock');
  } else {
    iconHeader.setAttribute('data-lucide', 'hash');
  }
  lucide.createIcons({ nodes: [iconHeader] });

  // Actualizar placeholder del input según el canal
  document.getElementById('message-input').placeholder =
    `Escribe un mensaje en #${channelName}...`;

  // Limpiar el badge de no-leídos del canal activo
  const badge = document.getElementById(`badge-${channelName}`);
  if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }

  // Limpiar búsqueda al cambiar de canal
  STATE.searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').style.display = 'none';

  // Re-renderizar mensajes del nuevo canal
  renderMessages();

  // Cerrar sidebar en móvil al seleccionar canal
  closeMobileSidebar();
}

/* ================================================================
   16. MODALES
================================================================ */

/** Abre el modal de configuración y carga los valores actuales */
function openSettingsModal() {
  document.getElementById('settings-username').value = STATE.currentUser.name;
  document.getElementById('settings-modal').style.display = 'flex';
}

/** Cierra el modal de configuración */
function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

/** Guarda la configuración del usuario */
function saveSettings() {
  const newName  = document.getElementById('settings-username').value.trim();
  const newColor = document.querySelector('.color-swatch.active')?.dataset.color || '#5865f2';

  if (!newName) { showToast('El nombre no puede estar vacío', 'warning', '⚠️'); return; }

  // Actualizar estado global
  STATE.currentUser.name        = newName;
  STATE.currentUser.avatarColor = newColor;

  // Actualizar UI del panel de usuario
  document.getElementById('current-user-name').textContent  = newName;
  document.getElementById('current-user-avatar').textContent = getInitial(newName);
  document.getElementById('current-user-avatar').style.background = newColor;

  closeSettingsModal();
  showToast('Configuración guardada ✅', 'success', '✅');
  logActivity('⚙️', `Perfil actualizado: nombre="${newName}", color="${newColor}"`);
}

/** Abre el modal de historial de actividad */
function openActivityModal() {
  const log = document.getElementById('activity-log');
  log.innerHTML = '';

  if (STATE.activityLog.length === 0) {
    log.innerHTML = '<p class="activity-empty">Sin actividad registrada aún.</p>';
  } else {
    // Renderizar cada entrada del log
    STATE.activityLog.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <span class="activity-icon">${entry.icon}</span>
        <div>
          <div>${entry.text}</div>
          <div class="activity-time">${entry.time}</div>
        </div>`;
      log.appendChild(li);
    });
  }

  document.getElementById('activity-modal').style.display = 'flex';
  lucide.createIcons();
}

/** Abre el modal de mensajes favoritos */
function openFavoritesModal() {
  renderFavoritesModal();
  document.getElementById('favorites-modal').style.display = 'flex';
}

/** Cierra todos los modales al hacer clic en el overlay */
function closeModalOnOverlay(e, modalId) {
  if (e.target === document.getElementById(modalId)) {
    document.getElementById(modalId).style.display = 'none';
  }
}

/* ================================================================
   17. EMOJI PICKER (del input de mensajes)
================================================================ */

/** Alterna la visibilidad del picker de emojis */
function toggleEmojiPicker() {
  const picker = document.getElementById('emoji-picker');
  picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
}

/**
 * Inserta un emoji en el textarea del mensaje.
 * Agrega el emoji en la posición actual del cursor.
 * @param {string} emoji - Emoji a insertar
 */
function insertEmoji(emoji) {
  const input = document.getElementById('message-input');
  const start = input.selectionStart;
  const end   = input.selectionEnd;

  // Insertar en la posición del cursor
  input.value = input.value.substring(0, start) + emoji + input.value.substring(end);

  // Reposicionar el cursor después del emoji insertado
  input.selectionStart = input.selectionEnd = start + emoji.length;
  input.focus();

  // Ocultar el picker
  document.getElementById('emoji-picker').style.display = 'none';
}

/* ================================================================
   18. MOBILE — Menú hamburguesa
================================================================ */

/** Abre el sidebar de canales en móvil */
function openMobileSidebar() {
  document.getElementById('sidebar-channels').classList.add('open');
}

/** Cierra el sidebar de canales en móvil */
function closeMobileSidebar() {
  document.getElementById('sidebar-channels').classList.remove('open');
}

/* ================================================================
   19. INICIALIZACIÓN
   Punto de entrada de la aplicación. Se ejecuta cuando el DOM está listo.
================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Inicializar datos ── */
  // Copiar los mensajes iniciales al estado global (deep copy para evitar referencias)
  for (const [channel, msgs] of Object.entries(INITIAL_MESSAGES)) {
    STATE.messages[channel] = msgs.map(m => ({ ...m }));
  }

  // Registrar mensajes fijados iniciales
  for (const msgs of Object.values(STATE.messages)) {
    msgs.filter(m => m.isPinned).forEach(m => STATE.pinnedMessages.push(m.id));
  }

  /* ── Renderizado inicial ── */
  renderUsers();
  renderMessages();
  renderPinnedMessages();
  lucide.createIcons(); // Inicializar todos los íconos SVG de Lucide en la página

  /* ── Event listeners: Lista de canales ── */
  document.getElementById('channel-list').addEventListener('click', e => {
    const item = e.target.closest('.channel-item');
    if (item?.dataset.channel) switchChannel(item.dataset.channel);
  });

  /* ── Event listeners: Envío de mensaje con botón ── */
  document.getElementById('send-btn').addEventListener('click', sendMessage);

  /* ── Event listeners: Envío de mensaje con Enter (Shift+Enter = salto de línea) ── */
  document.getElementById('message-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evitar salto de línea al presionar Enter solo
      sendMessage();
    }
  });

  /* ── Auto-resize del textarea según el contenido ── */
  document.getElementById('message-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 160) + 'px'; // Máximo 160px de altura

    // Actualizar el contador de caracteres
    const len     = this.value.length;
    const counter = document.getElementById('char-counter');
    counter.textContent = `${len}/2000`;
    counter.classList.toggle('near-limit', len > 1800); // Rojo cuando queden < 200 chars
  });

  /* ── Event listeners: Buscador ── */
  document.getElementById('search-input').addEventListener('input', function() {
    STATE.searchQuery = this.value;
    // Mostrar/ocultar el botón X para limpiar búsqueda
    document.getElementById('search-clear').style.display = this.value ? 'flex' : 'none';
    renderMessages(); // Re-renderizar con filtro aplicado
  });

  /* ── Botón para limpiar búsqueda ── */
  document.getElementById('search-clear').addEventListener('click', () => {
    STATE.searchQuery = '';
    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').style.display = 'none';
    renderMessages();
  });

  /* ── Event listeners: Botones del header ── */
  document.getElementById('activity-btn').addEventListener('click',  openActivityModal);
  document.getElementById('favorites-btn').addEventListener('click', openFavoritesModal);

  /* ── Event listeners: Configuración de usuario ── */
  document.getElementById('settings-btn').addEventListener('click',        openSettingsModal);
  document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);
  document.getElementById('save-settings-btn').addEventListener('click',   saveSettings);
  document.getElementById('settings-modal').addEventListener('click', e => closeModalOnOverlay(e, 'settings-modal'));

  /* ── Selector de color de avatar en configuración ── */
  document.getElementById('avatar-color-picker').addEventListener('click', e => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    // Quitar clase active de todos y agregar al clickeado
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
  });

  /* ── Event listeners: Modal de actividad ── */
  document.getElementById('close-activity-modal').addEventListener('click',
    () => document.getElementById('activity-modal').style.display = 'none');
  document.getElementById('activity-modal').addEventListener('click',
    e => closeModalOnOverlay(e, 'activity-modal'));

  /* ── Event listeners: Modal de favoritos ── */
  document.getElementById('close-favorites-modal').addEventListener('click',
    () => document.getElementById('favorites-modal').style.display = 'none');
  document.getElementById('favorites-modal').addEventListener('click',
    e => closeModalOnOverlay(e, 'favorites-modal'));

  /* ── Event listeners: Emoji picker ── */
  document.getElementById('emoji-btn').addEventListener('click', e => {
    e.stopPropagation(); // Evitar que el clic cierre el picker inmediatamente
    toggleEmojiPicker();
  });
  document.getElementById('emoji-picker').addEventListener('click', e => {
    const btn = e.target.closest('.emoji-item');
    if (btn) insertEmoji(btn.dataset.emoji);
  });

  /* ── Cerrar emoji picker al hacer clic fuera ── */
  document.addEventListener('click', e => {
    const picker = document.getElementById('emoji-picker');
    const emojiBtn = document.getElementById('emoji-btn');
    if (!picker.contains(e.target) && e.target !== emojiBtn) {
      picker.style.display = 'none';
    }
  });

  /* ── Event listeners: Mobile hamburger menu ── */
  document.getElementById('hamburger-btn').addEventListener('click',  openMobileSidebar);
  document.getElementById('sidebar-close-btn').addEventListener('click', closeMobileSidebar);

  /* ── Iniciar simulaciones automáticas ── */
  simulateUserActivity();           // Usuarios que se conectan/desconectan
  simulateOtherChannelMessages();   // Mensajes en otros canales (badges)

  /* ── Notificación de bienvenida ── */
  setTimeout(() => showToast('¡Bienvenido a MiniCord! 🎉', 'success', '🎉'), 500);

  /* ── Log de actividad inicial ── */
  logActivity('🚀', 'App iniciada');
  logActivity('🟢', `Conectado como "${STATE.currentUser.name}"`);

});
