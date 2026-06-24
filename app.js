/* ==========================================================================
   PRODUCTION ERP - CORE LOGIC (JAVASCRIPT)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     1. STATE & DUMMY DATA MODEL (ERP SIMULATION)
     ========================================================================== */
  
  // Current user state
  const state = {
    currentRole: "superleader", // superleader, leader, coleader, servant
    activeTab: "dashboard",
    scheduleFilter: "all", // all, sunday, wednesday
    selectedPillar: "live", // chosen during intro
    specialEvents: [] // Cargados dinámicamente de PostgreSQL
  };

  // User descriptions & permissions for each role
  const roleMetadata = {
    admin: {
      name: "Administrador General",
      description: "Eres el Administrador General del sistema. Tienes acceso invisible y absoluto a todas las funciones del ERP. Puedes auditar, crear, deshacer y supervisar todas las áreas sin restricciones.",
      permissions: [
        "Acceso invisible y total a todo el proyecto.",
        "Crear, modificar y eliminar cualquier evento especial.",
        "Cambiar líderes, co-líderes y asignar turnos.",
        "Auditar y deshacer cambios en tiempo real."
      ]
    },
    superleader: {
      name: "Superlíder (Dirección General)",
      description: "Tienes control total sobre la plataforma de producción. Eres el encargado de autorizar y planificar eventos especiales, ordenar requerimientos a los líderes de área y supervisar las rotaciones de los domingos.",
      permissions: [
        "Programar eventos especiales y definir fechas.",
        "Designar líderes y co-líderes de área.",
        "Asignar y reorganizar siervos en cualquier servicio.",
        "Visualizar reportes de asistencia general."
      ]
    },
    leader: {
      name: "Líder de Área",
      description: "Administras un área técnica específica. Recibes órdenes del Superlíder sobre eventos especiales y eres responsable de convocar y asignar a los siervos de tu equipo para cumplir con los servicios dominicales.",
      permissions: [
        "Asignar siervos de su propia área a los turnos.",
        "Confirmar asistencia de su equipo.",
        "Proponer coordinaciones con otras áreas.",
        "Visualizar cronograma general y eventos especiales."
      ]
    },
    coleader: {
      name: "Co-líder de Área",
      description: "Apoyas al Líder de Área en la gestión del equipo. Tienes permisos para coordinar turnos y reportar asistencia cuando el líder no está disponible.",
      permissions: [
        "Asignar siervos a turnos en ausencia del Líder.",
        "Marcar asistencia de siervos asignados.",
        "Visualizar cronograma general.",
        "Consultar lista de miembros activos."
      ]
    },
    servant: {
      name: "Siervo (Equipo Técnico)",
      description: "Eres el corazón del equipo de producción. Puedes ver en qué servicios estás asignado (Domingos o Miércoles), confirmar tu asistencia y postularte a las convocatorias de eventos especiales.",
      permissions: [
        "Ver cronograma de turnos asignados.",
        "Confirmar o declinar asistencia a un servicio.",
        "Postularse a participar en eventos especiales creados.",
        "Ver información de contacto de sus líderes."
      ]
    }
  };

  // The 14 Areas grouped by Pillar
  const areasData = [
    // Pillar: Live Production (live)
    { id: "arena", name: "Arena", pillar: "live", leader: "Carlos Gómez", coleader: "Mateo Díaz", servants: ["Juan P.", "Andrés F.", "Santiago L.", "Felipe M."] },
    { id: "presenter", name: "Presenter", pillar: "live", leader: "Sofía Martínez", coleader: "Lucía Torres", servants: ["Camila G.", "Paula V.", "Valentina H."] },
    { id: "luces", name: "Luces", pillar: "live", leader: "David Rojas", coleader: "Kevin Vega", servants: ["Esteban R.", "Mateo S.", "Nico B."] },
    { id: "switchers", name: "Switchers y Cámaras", pillar: "live", leader: "Andrés Pinzón", coleader: "Daniela Ruiz", servants: ["José L. (Switcher)", "Camilo A. (Cámara)", "David M. (Switcher)", "Laura P. (Cámara)", "Sergio C. (Switcher)"] },
    { id: "streaming", name: "Streaming", pillar: "live", leader: "Lucas Morales", coleader: "Samuel Ortíz", servants: ["Diego S.", "Julián G.", "Martín C."] },
    
    // Pillar: Media & AV (media)
    { id: "fotografia", name: "Fotografía", pillar: "media", leader: "Valeria Guerrero", coleader: "Mariana Silva", servants: ["Gabriela N.", "Daniel F.", "Sara L."] },
    { id: "edicion", name: "Edición", pillar: "media", leader: "Santiago Tovar", coleader: "Sebastián Castro", servants: ["Camilo V.", "Alejandro B.", "Mateo R."] },
    { id: "filmaking", name: "Filmaking", pillar: "media", leader: "Esteban Herrera", coleader: "Diana Cárdenas", servants: ["Juan M.", "Nicolás P.", "Felipe G."] },
    
    // Pillar: Creative & Design (creative)
    { id: "disenoweb", name: "Diseño Web", pillar: "creative", leader: "Laura Fonseca", coleader: "Andrés Osorio", servants: ["Cristian D.", "Mauricio T."] },
    { id: "disenografico", name: "Diseño Gráfico", pillar: "creative", leader: "Paola Méndez", coleader: "Isabella R.", servants: ["Natalia C.", "Daniela M.", "Sofía Q."] },
    { id: "redaccion", name: "Redacción", pillar: "creative", leader: "Camila Restrepo", coleader: "Manuela B.", servants: ["Catalina F.", "David A."] },
    { id: "redes", name: "Redes", pillar: "creative", leader: "Juliana Pérez", coleader: "Sara Giraldo", servants: ["Paula B.", "Mateo J.", "Mariana E."] },

    // Pillar: Logistics & Protocol (logistics)
    { id: "coordinacion", name: "Coordinación", pillar: "logistics", leader: "Mariana Ospina", coleader: "Felipe Cardona", servants: ["Andrés G.", "Lorena M."] },
    { id: "protocolo", name: "Protocolo", pillar: "logistics", leader: "David Kim", coleader: "Andrea Londoño", servants: ["Camilo R.", "Laura S.", "Jhon D.", "Nathalia P.", "Esteban V.", "Mariana T."] }
  ];

  // Schedule template for Sundays and Wednesdays
  const weeklyServices = [
    { id: "dom-8am", name: "Servicio Domingo - 8:00 AM", day: "Domingo", time: "08:00", description: "Primer servicio de la mañana", keyAreas: ["Arena", "Presenter", "Luces", "Switchers y Cámaras", "Streaming", "Coordinación", "Protocolo"] },
    { id: "dom-11am", name: "Servicio Domingo - 11:00 AM", day: "Domingo", time: "11:00", description: "Segundo servicio (Mayor afluencia)", keyAreas: ["Arena", "Presenter", "Luces", "Switchers y Cámaras", "Streaming", "Coordinación", "Protocolo", "Fotografía", "Filmaking"] },
    { id: "dom-1pm", name: "Servicio Domingo - 1:00 PM", day: "Domingo", time: "13:00", description: "Tercer servicio de la tarde", keyAreas: ["Arena", "Presenter", "Luces", "Switchers y Cámaras", "Streaming", "Coordinación", "Protocolo"] },
    { id: "dom-7pm", name: "Servicio Domingo - 7:00 PM", day: "Domingo", time: "19:00", description: "Cuarto servicio (Jóvenes)", keyAreas: ["Arena", "Presenter", "Luces", "Switchers y Cámaras", "Streaming", "Coordinación", "Protocolo", "Fotografía", "Filmaking", "Redes"] },
    { id: "mie-730pm", name: "Servicio Miércoles - 7:30 PM", day: "Miércoles", time: "19:30", description: "Reunión de oración a mitad de semana", keyAreas: ["Arena", "Presenter", "Luces", "Switchers y Cámaras", "Streaming", "Coordinación", "Protocolo"] }
  ];

  // Assignments database (simulated)
  const serviceAssignments = {
    "dom-8am": { "Arena": "Juan P.", "Presenter": "Paula V.", "Luces": "Esteban R.", "Switchers y Cámaras": "José L. (Switcher)", "Streaming": "Diego S.", "Coordinación": "Andrés G.", "Protocolo": "Camilo R." },
    "dom-11am": { "Arena": "Andrés F.", "Presenter": "Camila G.", "Luces": "Mateo S.", "Switchers y Cámaras": "Camilo A. (Cámara)", "Streaming": "Julián G.", "Coordinación": "Lorena M.", "Protocolo": "Laura S.", "Fotografía": "Gabriela N.", "Filmaking": "Juan M." },
    "dom-1pm": { "Arena": "Santiago L.", "Presenter": "Valentina H.", "Luces": "Nico B.", "Switchers y Cámaras": "David M. (Switcher)", "Streaming": "Martín C.", "Coordinación": "Andrés G.", "Protocolo": "Jhon D." },
    "dom-7pm": { "Arena": "Felipe M.", "Presenter": "Paula V.", "Luces": "Esteban R.", "Switchers y Cámaras": "Laura P. (Cámara)", "Streaming": "Diego S.", "Coordinación": "Felipe Cardona", "Protocolo": "Nathalia P.", "Fotografía": "Daniel F.", "Filmaking": "Nicolás P.", "Redes": "Paula B." },
    "mie-730pm": { "Arena": "Juan P.", "Presenter": "Lucía Torres", "Luces": "Kevin Vega", "Switchers y Cámaras": "Sergio C. (Switcher)", "Streaming": "Samuel Ortíz", "Coordinación": "Lorena M.", "Protocolo": "Esteban V." }
  };

  /* ==========================================================================
     2. NAVIGATION & INTRO PAGE INTERACTIVITY & LOGIN/REGISTRATION MODALS
     ========================================================================== */

  // Modal elements
  const loginModal = document.getElementById("login-modal");
  const btnCloseLogin = document.getElementById("btn-close-login");
  const btnCancelLoginDialog = document.getElementById("btn-cancel-login-dialog");
  const loginForm = document.getElementById("login-form");
  const btnGoogleLoginDirect = document.getElementById("btn-google-login-direct");
  const linkToRegister = document.getElementById("link-to-register");

  const registerModal = document.getElementById("register-modal");
  const btnCloseRegister = document.getElementById("btn-close-register");
  const btnCancelRegister = document.getElementById("btn-cancel-register");
  const registerForm = document.getElementById("register-form");
  const linkToLogin = document.getElementById("link-to-login");

  const introScreen = document.getElementById("intro-screen");
  const appScreen = document.getElementById("app-screen");

  // Keep track of the area associated with the clicked panel
  let selectedAreaPreselect = "Arena";

  // Accordion panel click handler to open LOGIN modal first
  const panels = document.querySelectorAll(".panel");
  panels.forEach(panel => {
    panel.addEventListener("click", () => {
      // Find the clicked pillar's title to establish area context
      const titleElement = panel.querySelector(".panel-title");
      if (!titleElement) return;
      const titleText = titleElement.textContent.trim();
      
      // Determine default preselected area based on clicked pilar title
      if (titleText === "Producción en Vivo") selectedAreaPreselect = "Arena";
      else if (titleText === "Medios y Audiovisual") selectedAreaPreselect = "Fotografía";
      else if (titleText === "Diseño y Creatividad") selectedAreaPreselect = "Diseño Web";
      else if (titleText === "Logística y Protocolo") selectedAreaPreselect = "Coordinación";

      // Open the login modal
      loginModal.classList.remove("hidden");
    });
  });

  // Modal closing logic
  const closeLoginModal = () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
  };

  const closeRegisterModal = () => {
    registerModal.classList.add("hidden");
    registerForm.reset();
  };

  if (btnCloseLogin) btnCloseLogin.addEventListener("click", closeLoginModal);
  if (btnCancelLoginDialog) btnCancelLoginDialog.addEventListener("click", closeLoginModal);
  
  if (btnCloseRegister) btnCloseRegister.addEventListener("click", closeRegisterModal);
  if (btnCancelRegister) btnCancelRegister.addEventListener("click", closeRegisterModal);

  // Close modals when clicking on their background overlay
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) closeLoginModal();
  });
  registerModal.addEventListener("click", (e) => {
    if (e.target === registerModal) closeRegisterModal();
  });

  // Toggle from Login Modal to Registration Modal
  if (linkToRegister) {
    linkToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      closeLoginModal();
      
      // Pre-select the area dropdown inside registration modal
      const areaSelect = document.getElementById("reg-area");
      if (areaSelect && selectedAreaPreselect) {
        areaSelect.value = selectedAreaPreselect;
        handleRegAreaChange(selectedAreaPreselect);
      }
      
      registerModal.classList.remove("hidden");
    });
  }

  // Toggle from Registration Modal back to Login Modal
  if (linkToLogin) {
    linkToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      closeRegisterModal();
      loginModal.classList.remove("hidden");
    });
  }

  const regAreaSelect = document.getElementById("reg-area");
  const subAreaContainer = document.getElementById("sub-area-container");
  const regSubAreaSelect = document.getElementById("reg-sub-area");

  if (regAreaSelect) {
    regAreaSelect.addEventListener("change", () => {
      handleRegAreaChange(regAreaSelect.value);
    });
  }

  function handleRegAreaChange(value) {
    if (!subAreaContainer || !regSubAreaSelect) return;
    if (value === "Switchers y Cámaras") {
      subAreaContainer.classList.remove("hidden");
      regSubAreaSelect.setAttribute("required", "required");
    } else {
      subAreaContaine  // Direct login with Google inside Login Modal
  if (btnGoogleLoginDirect) {
    btnGoogleLoginDirect.addEventListener("click", () => {
      alert("La autenticación de Google está simulada. Iniciando sesión como Siervo de prueba.");
      closeLoginModal();
      loginUserSession("Juan Pérez", "juan.perez", "servant", "Miraflores", "Arena");
    });
  }

  // Handle login form submission (Credentials matching real backend)
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar sesión en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      closeLoginModal();
      loginUserSession(data.user.nombre, data.user.alias, data.user.rol, data.user.distrito, data.user.area);
    } catch (err) {
      alert(`Error de Login: ${err.message}`);
    }
  });

  // Handle registration form submission (Creating in PostgreSQL)
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const alias = document.getElementById("reg-alias").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;
    const district = document.getElementById("reg-district").value;
    const areaName = document.getElementById("reg-area").value;
    const subRol = document.getElementById("reg-sub-area") ? document.getElementById("reg-sub-area").value : null;

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor, verifícalas.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias,
          nombre: name,
          correo: email,
          password,
          telefono: phone,
          distrito: district,
          area: areaName,
          sub_rol: subRol
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Guardar sesión en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      closeRegisterModal();
      alert(`¡Registro Exitoso! Bienvenido al equipo de ProDucción, ${name}.`);
      loginUserSession(data.user.nombre, data.user.alias, data.user.rol, data.user.distrito, data.user.area);
    } catch (err) {
      alert(`Error de Registro: ${err.message}`);
    }
  });

  // Common function to transition into ERP Dashboard for logged-in user
  function loginUserSession(name, alias, role, district, areaName, skipAnimation = false) {
    // Set active role state
    state.currentRole = role;
    roleSelector.value = role;

    const setupUI = () => {
      introScreen.classList.add("hidden");
      appScreen.classList.remove("hidden");
      
      // Initialize dashboard elements
      initializeDashboard();
      
      // Customize Dashboard welcome text
      userNameText.textContent = name;
      
      // Get initials for profile badge avatar
      const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      avatarText.textContent = initials;
      
      // Dynamic avatar styling based on role
      if (role === "admin") {
        avatarText.style.background = "linear-gradient(135deg, #ec008c, #7f00ff)";
      } else if (role === "superleader") {
        avatarText.style.background = "linear-gradient(135deg, #f59e0b, #ef4444)";
      } else if (role === "leader") {
        avatarText.style.background = "linear-gradient(135deg, #00f2fe, #4facfe)";
      } else if (role === "coleader") {
        avatarText.style.background = "linear-gradient(135deg, #a855f7, #ec008c)";
      } else {
        avatarText.style.background = "linear-gradient(135deg, #10b981, #059669)"; // Green for servants
      }

      if (welcomeRole) {
        welcomeRole.textContent = role === "admin" ? "Administrador General" : role === "superleader" ? "Superlíder" : role === "leader" ? "Líder de Área" : role === "coleader" ? "Co-líder" : name;
      }
      
      // Customize role info text card
      if (roleDescText) {
        if (role === "admin") {
          roleDescText.innerHTML = `
            ¡Bienvenido, <strong>${name}</strong>! Has ingresado como <strong>Administrador General</strong> del sistema.
            Tienes privilegios absolutos para ver, programar y deshacer cualquier cambio. Tu alias de acceso es <strong>${alias}</strong>.
          `;
        } else if (role === "servant") {
          roleDescText.innerHTML = `
            ¡Bienvenido, <strong>${name}</strong>! Has ingresado en el área de <strong>${areaName}</strong>. 
            Vives en <strong>${district}</strong>. Tu alias es <strong>${alias}</strong> y tu rol actual es <strong>Siervo</strong>.
            <br><br>
            Puedes consultar tus asignaciones de turnos para los Domingos y Miércoles en las secciones del ERP.
          `;
        } else {
          const meta = roleMetadata[role];
          roleDescText.textContent = meta.description;
        }
      }

      // Mostrar el widget del Asistente de IA si está en sesión
      const aiWidget = document.getElementById("ai-assistant-widget");
      if (aiWidget) {
        aiWidget.classList.remove("hidden");
      }
      
      console.log(`Sesión iniciada con éxito para el usuario: ${name} (Rol: ${role})`);
    };

    if (skipAnimation) {
      setupUI();
    } else {
      // Transition animation
      introScreen.style.transition = "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s";
      introScreen.style.transform = "translateY(-100vh)";
      introScreen.style.opacity = "0";
      setTimeout(setupUI, 700);
    }
  }

  // Logout / Return to Intro logic (Clear token from localStorage)
  const btnLogout = document.getElementById("btn-logout");
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    appScreen.classList.add("hidden");
    introScreen.classList.remove("hidden");

    // Ocultar widget del Asistente de IA
    const aiWidget = document.getElementById("ai-assistant-widget");
    if (aiWidget) {
      aiWidget.classList.add("hidden");
      // Cerrar la ventana del chat si estaba abierta
      const aiChatWindow = document.getElementById("ai-chat-window");
      if (aiChatWindow) aiChatWindow.classList.add("hidden");
    }
    
    // Reset positions
    setTimeout(() => {
      introScreen.style.transform = "translateY(0)";
      introScreen.style.opacity = "1";
    }, 50);
  });   // Reset positions
    setTimeout(() => {
      introScreen.style.transform = "translateY(0)";
      introScreen.style.opacity = "1";
    }, 50);
  });

  // Tab switching logic
  const menuItems = document.querySelectorAll(".menu-item");
  const tabPanels = document.querySelectorAll(".tab-panel");

  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      state.activeTab = tabId;

      // Update menu items
      menuItems.forEach(mi => mi.classList.remove("active"));
      item.classList.add("active");

      // Update panels
      tabPanels.forEach(panel => panel.classList.remove("active"));
      const targetPanel = document.getElementById(`tab-${tabId}`);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Update header page title
      const pageTitle = document.getElementById("page-title");
      if (tabId === "dashboard") pageTitle.textContent = "Dashboard General";
      if (tabId === "schedules") pageTitle.textContent = "Servicios y Turnos";
      if (tabId === "special-events") pageTitle.textContent = "Eventos Especiales";
      if (tabId === "teams") pageTitle.textContent = "Equipos y Áreas";

      // Refresh corresponding content
      renderTabContent(tabId);
    });
  });

  /* ==========================================================================
     3. ROLE SELECTOR LOGIC (DYNAMIC PERMISSION SHIFTS)
     ========================================================================== */
  const roleSelector = document.getElementById("role-selector");
  const welcomeRole = document.getElementById("welcome-role");
  const roleBadgeDisplay = document.getElementById("role-badge-display");
  const roleDescText = document.getElementById("role-description-text");
  const rolePermissionsUl = document.getElementById("role-permissions-ul");
  const userNameText = document.getElementById("user-name");
  const avatarText = document.querySelector(".user-profile-badge .avatar");

  roleSelector.addEventListener("change", (e) => {
    const selected = e.target.value;
    state.currentRole = selected;
    
    updateRoleUI(selected);
  });

  function updateRoleUI(role) {
    const meta = roleMetadata[role];
    
    // Update Name & Avatar
    if (role === "admin") {
      userNameText.textContent = "ALeonnnc";
      avatarText.textContent = "AL";
      avatarText.style.background = "linear-gradient(135deg, #ec008c, #7f00ff)"; // Cool pink/purple admin
    } else if (role === "superleader") {
      userNameText.textContent = "Marcos Salazar";
      avatarText.textContent = "MS";
      avatarText.style.background = "linear-gradient(135deg, #f59e0b, #ef4444)"; // Gold/red
    } else if (role === "leader") {
      userNameText.textContent = "Carlos Gómez"; // Leader of Arena
      avatarText.textContent = "CG";
      avatarText.style.background = "linear-gradient(135deg, #00f2fe, #4facfe)"; // Blue/Cyan
    } else if (role === "coleader") {
      userNameText.textContent = "Mateo Díaz"; // Coleader of Arena
      avatarText.textContent = "MD";
      avatarText.style.background = "linear-gradient(135deg, #a855f7, #ec008c)"; // Purple/Pink
    } else {
      userNameText.textContent = "Juan Pérez"; // Servant
      avatarText.textContent = "JP";
      avatarText.style.background = "linear-gradient(135deg, #6b7280, #9ca3af)"; // Grey
    }

    // Update Welcome Title
    if (welcomeRole) {
      welcomeRole.textContent = role === "admin" ? "Administrador General" : role === "superleader" ? "Superlíder" : role === "leader" ? "Líder de Área" : role === "coleader" ? "Co-líder" : "Siervo";
    }

    // Update Info Box Right Column
    if (roleBadgeDisplay) {
      roleBadgeDisplay.textContent = role === "admin" ? "Administrador" : role === "superleader" ? "Superlíder" : role === "leader" ? "Líder de Área" : role === "coleader" ? "Co-líder" : "Siervo";
      // Dynamic colors for badge
      roleBadgeDisplay.style.background = 
        role === "admin" ? "linear-gradient(135deg, #ec008c, #7f00ff)" :
        role === "superleader" ? "linear-gradient(135deg, #f59e0b, #ef4444)" :
        role === "leader" ? "linear-gradient(135deg, #00f2fe, #4facfe)" :
        role === "coleader" ? "linear-gradient(135deg, #a855f7, #ec008c)" :
        "linear-gradient(135deg, #6b7280, #9ca3af)";
    }

    if (roleDescText) {
      roleDescText.textContent = meta.description;
    }

    // Update permissions list
    if (rolePermissionsUl) {
      rolePermissionsUl.innerHTML = "";
      meta.permissions.forEach(perm => {
        const li = document.createElement("li");
        li.textContent = perm;
        rolePermissionsUl.appendChild(li);
      });
    }

    // Toggle Action Buttons on Dashboard / Navigation based on Role
    const superleaderActions = document.getElementById("superleader-action-panel");
    const specialEventNav = document.getElementById("nav-special-events");
    const createEventHeader = document.getElementById("special-events-action-header");

    if (role === "superleader" || role === "admin") {
      if (superleaderActions) superleaderActions.classList.remove("hidden");
      if (createEventHeader) createEventHeader.classList.remove("hidden");
    } else {
      if (superleaderActions) superleaderActions.classList.add("hidden");
      if (createEventHeader) createEventHeader.classList.add("hidden");
    }

    // Refresh current view since roles affect actions available (like "Assign" button)
    renderTabContent(state.activeTab);
  }


  /* ==========================================================================
     4. RENDERERS FOR DYNAMIC DATA VIEWS
     ========================================================================== */

  function initializeDashboard() {
    // Set default selected role
    roleSelector.value = state.currentRole;
    updateRoleUI(state.currentRole);

    // Initial renders
    renderSundayServicesDashboard();
    renderSpecialEventsList();
    renderWeeklyCalendar();
    renderTeamsGrid();
  }

  function renderTabContent(tabId) {
    if (tabId === "dashboard") {
      renderSundayServicesDashboard();
    } else if (tabId === "schedules") {
      renderWeeklyCalendar();
    } else if (tabId === "special-events") {
      renderSpecialEventsList();
    } else if (tabId === "teams") {
      renderTeamsGrid();
    }
  }

  // A. RENDER: Sunday Services List on main Dashboard
  function renderSundayServicesDashboard() {
    const container = document.getElementById("services-list-container");
    if (!container) return;

    container.innerHTML = "";
    
    // Filter only Sunday services
    const sundays = weeklyServices.filter(s => s.day === "Domingo");

    sundays.forEach(service => {
      const assignments = serviceAssignments[service.id] || {};
      
      const row = document.createElement("div");
      row.className = "service-row";
      
      // Avatars colors based on area type
      const avatarsHTML = service.keyAreas.slice(0, 4).map(area => {
        let colorClass = "blue";
        if (area === "Fotografía" || area === "Filmaking") colorClass = "pink";
        if (area === "Diseño Gráfico" || area === "Redes") colorClass = "yellow";
        if (area === "Coordinación" || area === "Protocolo") colorClass = "purple";
        
        const firstLetter = area.charAt(0);
        return `<div class="team-badge-circle ${colorClass}" title="${area}: ${assignments[area] || 'Sin asignar'}">${firstLetter}</div>`;
      }).join("");

      const extraCount = service.keyAreas.length - 4;
      const extraBadgeHTML = extraCount > 0 ? `<div class="team-badge-circle" title="Y ${extraCount} áreas más">+${extraCount}</div>` : "";

      // Check current role to adjust button text/function
      let actionBtnHTML = "";
      if (state.currentRole === "superleader" || state.currentRole === "leader" || state.currentRole === "coleader" || state.currentRole === "admin") {
        actionBtnHTML = `<button class="btn-assign" onclick="alert('Funcionalidad ERP: Abrir asignador de siervos para el turno ${service.name}')">Gestionar Equipo</button>`;
      } else {
        // Servant role
        const assignedToMe = Object.values(assignments).includes("Juan Pérez");
        if (assignedToMe) {
          actionBtnHTML = `<span class="badge-status online" style="margin-left:auto; margin-right:10px;">Asignado</span>
                           <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="alert('Asistencia Confirmada')">Confirmar</button>`;
        } else {
          actionBtnHTML = `<button class="btn-assign" onclick="alert('Te has postulado para cubrir vacante en este servicio!')">Postularse</button>`;
        }
      }

      row.innerHTML = `
        <div class="service-main">
          <div class="service-time-box">
            <span class="time">${service.time}</span>
            <span class="day">DOM</span>
          </div>
          <div class="service-title">
            <h3>${service.name}</h3>
            <p>${service.description}</p>
          </div>
        </div>
        <div class="service-teams-preview">
          <div class="team-avatar-stack">
            ${avatarsHTML}
            ${extraBadgeHTML}
          </div>
          ${actionBtnHTML}
        </div>
      `;
      container.appendChild(row);
    });
  }

  // B. RENDER: Weekly calendar / schedules tab
  function renderWeeklyCalendar() {
    const container = document.getElementById("schedule-calendar-container");
    if (!container) return;

    container.innerHTML = "";

    // Group services by day
    const sundays = weeklyServices.filter(s => s.day === "Domingo");
    const wednesdays = weeklyServices.filter(s => s.day === "Miércoles");

    const daysToRender = [];
    if (state.scheduleFilter === "all" || state.scheduleFilter === "sunday") {
      daysToRender.push({ dayName: "Domingos (4 Servicios)", list: sundays });
    }
    if (state.scheduleFilter === "all" || state.scheduleFilter === "wednesday") {
      daysToRender.push({ dayName: "Miércoles (Reunión Oración)", list: wednesdays });
    }

    daysToRender.forEach(group => {
      const col = document.createElement("div");
      col.className = "schedule-day-column";
      
      let slotsHTML = "";
      group.list.forEach(service => {
        const assignments = serviceAssignments[service.id] || {};
        
        let reqHTML = "";
        service.keyAreas.forEach(area => {
          const assigned = assignments[area];
          const assignedText = assigned ? `<span class="req-member">${assigned}</span>` : `<span class="req-member vacant">Vacante</span>`;
          reqHTML += `
            <div class="req-badge">
              <span class="req-name">${area}</span>
              ${assignedText}
            </div>
          `;
        });

        slotsHTML += `
          <div class="slot-item">
            <div class="slot-header flex-between">
              <span class="slot-time">${service.name}</span>
              <button class="btn-tab-filter" style="padding: 4px 10px; font-size:0.75rem;" onclick="alert('Detalle completo del servicio')">Ver Todo</button>
            </div>
            <div class="slot-requirements">
              ${reqHTML}
            </div>
          </div>
        `;
      });

      col.innerHTML = `
        <div class="day-column-header">${group.dayName}</div>
        <div class="slots-container">
          ${slotsHTML}
        </div>
      `;
      container.appendChild(col);
    });

    // Wire filter button listeners inside schedules tab
    const filterAll = document.getElementById("btn-filter-all");
    const filterSunday = document.getElementById("btn-filter-sunday");
    const filterWednesday = document.getElementById("btn-filter-wednesday");

    if (filterAll && filterSunday && filterWednesday) {
      filterAll.onclick = () => {
        state.scheduleFilter = "all";
        toggleFilterButtonsActive(filterAll);
        renderWeeklyCalendar();
      };
      filterSunday.onclick = () => {
        state.scheduleFilter = "sunday";
        toggleFilterButtonsActive(filterSunday);
        renderWeeklyCalendar();
      };
      filterWednesday.onclick = () => {
        state.scheduleFilter = "wednesday";
        toggleFilterButtonsActive(filterWednesday);
        renderWeeklyCalendar();
      };
    }
  }

  function toggleFilterButtonsActive(activeBtn) {
    const filters = document.querySelectorAll(".btn-tab-filter");
    filters.forEach(f => f.classList.remove("active"));
    activeBtn.classList.add("active");
  }

  // C. RENDER: Special Events List tab (Petición Fetch a la API)
  async function renderSpecialEventsList() {
    const container = document.getElementById("special-events-container");
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;">
                             Cargando eventos de la base de datos...
                           </div>`;
    
    try {
      const response = await fetch('/api/events');
      const events = await response.json();
      state.specialEvents = events;

      // Update dashboard counter
      const statCounter = document.getElementById("stat-special-count");
      if (statCounter) statCounter.textContent = state.specialEvents.length;

      if (state.specialEvents.length === 0) {
        container.innerHTML = `<div class="service-row" style="justify-content:center; padding: 40px; color: var(--text-muted);">No hay eventos especiales programados en este momento.</div>`;
        return;
      }

      container.innerHTML = "";
      state.specialEvents.forEach(event => {
        // Build assignments badges
        let assignmentsHTML = "";
        event.areasRequired.forEach(area => {
          const assignedUser = event.assignments[area];
          const assignedUserText = assignedUser 
            ? `<span class="assign-name">${assignedUser}</span>`
            : `<span class="assign-name" style="color:#ef4444; font-style:italic;">Por asignar</span>`;
          
          assignmentsHTML += `
            <div class="assignment-badge">
              <span class="assign-role">${area}</span>
              ${assignedUserText}
            </div>
          `;
        });

        // Special action buttons depending on user role
        let ctaBtnHTML = "";
        if (state.currentRole === "admin") {
          ctaBtnHTML = `
            <button class="btn-assign" style="background:#f59e0b; color:black; font-weight:700; margin-right:8px;" onclick="alert('Notificación enviada a los líderes de área')">Notificar</button>
            <button class="btn-assign" style="background:#ef4444; color:white; font-weight:700;" onclick="deleteSpecialEvent(${event.id})">Deshacer</button>
          `;
        } else if (state.currentRole === "superleader") {
          ctaBtnHTML = `<button class="btn-assign" style="background:#f59e0b; color:black; font-weight:700;" onclick="alert('Notificación enviada a los líderes de área')">Notificar a Líderes</button>`;
        } else if (state.currentRole === "leader" || state.currentRole === "coleader") {
          ctaBtnHTML = `<button class="btn-assign" onclick="alert('Asignar servidor de tu área para este evento especial')">Asignar Servidor</button>`;
        } else {
          // Servant can join/apply
          ctaBtnHTML = `<button class="btn-join-event" onclick="alert('Solicitud enviada al líder de tu área para participar!')">Postularse para Evento</button>`;
        }

        const card = document.createElement("div");
        card.className = "special-event-card";
        card.innerHTML = `
          <div class="event-card-header">
            <div class="event-info-main">
              <h3>${event.title}</h3>
              <div class="event-meta">
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${event.date}</span>
                </div>
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${event.time}</span>
                </div>
                <div class="event-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Creado por: ${event.creator}</span>
                </div>
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <span class="badge-event-status">${event.status}</span>
              ${ctaBtnHTML}
            </div>
          </div>
          <p class="event-description-text">${event.description}</p>
          <div class="event-team-assignments">
            <h4>Asignación y Requerimientos de Coordinación</h4>
            <div class="assignments-grid-flex">
              ${assignmentsHTML}
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444; font-size: 0.9rem;">Error al conectar con la base de datos de eventos: ${err.message}</div>`;
    }
  }

  // Global function for admin to delete special event (Calling API)
  window.deleteSpecialEvent = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar y deshacer este evento especial de la base de datos?")) {
      try {
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al eliminar el evento');
        }

        await renderSpecialEventsList();
        renderSundayServicesDashboard(); // update counter if visible
      } catch (err) {
        alert(`Error al eliminar evento: ${err.message}`);
      }
    }
  };

  // D. RENDER: Teams and Members list (Fetch real de la base de datos)
  async function renderTeamsGrid() {
    const container = document.getElementById("teams-grid-container");
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;">
                             Cargando servidores registrados...
                           </div>`;

    try {
      const response = await fetch('/api/teams');
      const teams = await response.json();

      container.innerHTML = "";

      teams.forEach(area => {
        const card = document.createElement("div");
        card.className = "team-area-card";
        
        // Determine pilar color class
        let pillarClass = "live";
        let pillarSpanishName = "Producción";
        if (area.pillar === "media") { pillarClass = "media"; pillarSpanishName = "Medios"; }
        else if (area.pillar === "creative") { pillarClass = "creative"; pillarSpanishName = "Diseño"; }
        else if (area.pillar === "logistics") { pillarClass = "logistics"; pillarSpanishName = "Logística"; }

        let servantsHTML = "";
        let headerChevronHTML = "";

        if (area.id === "switchers") {
          card.classList.add("collapsible-card");
          
          // Add click listener to toggle is-expanded class
          card.addEventListener("click", () => {
            card.classList.toggle("is-expanded");
          });
          
          headerChevronHTML = `
            <svg class="chevron-icon" style="width:16px; height:16px; transition: transform var(--transition-fast); margin-left: 6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          `;

          const switchers = area.servants.filter(s => s.toLowerCase().includes("switcher"));
          const cameras = area.servants.filter(s => s.toLowerCase().includes("cámara") || s.toLowerCase().includes("camara"));
          const otherServants = area.servants.filter(s => !s.toLowerCase().includes("switcher") && !s.toLowerCase().includes("cámara") && !s.toLowerCase().includes("camara"));

          if (switchers.length > 0) {
            servantsHTML += `
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin: 10px 0 6px 0; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #00f2fe;"></span>Switchers
              </div>
            `;
            servantsHTML += switchers.map(serv => `
              <div class="member-row">
                <span class="member-name">${serv}</span>
                <span class="member-name-badge servant" style="background: rgba(0, 242, 254, 0.1); color: #00f2fe; border: 1px solid rgba(0, 242, 254, 0.25);">Switcher</span>
              </div>
            `).join("");
          }

          if (cameras.length > 0) {
            servantsHTML += `
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin: 14px 0 6px 0; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #ec008c;"></span>Cámaras
              </div>
            `;
            servantsHTML += cameras.map(serv => `
              <div class="member-row">
                <span class="member-name">${serv}</span>
                <span class="member-name-badge servant" style="background: rgba(236, 0, 140, 0.1); color: #ec008c; border: 1px solid rgba(236, 0, 140, 0.25);">Cámara</span>
              </div>
            `).join("");
          }

          if (otherServants.length > 0) {
            servantsHTML += `
              <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin: 14px 0 6px 0; letter-spacing: 0.05em;">Otros Siervos</div>
            `;
            servantsHTML += otherServants.map(serv => `
              <div class="member-row">
                <span class="member-name">${serv}</span>
                <span class="member-name-badge servant">Siervo</span>
              </div>
            `).join("");
          }
        } else {
          servantsHTML = `
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; margin-top: 8px; margin-bottom:4px;">Siervos del Equipo</div>
            ` + (area.servants.length > 0 ? area.servants.map(serv => `
            <div class="member-row">
              <span class="member-name">${serv}</span>
              <span class="member-name-badge servant">Siervo</span>
            </div>
          `).join("") : `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic; padding: 4px 0;">Sin siervos registrados</div>`);
        }

        if (area.id === "switchers") {
          card.innerHTML = `
            <div class="team-area-header">
              <h3 style="display:flex; align-items:center; gap: 4px;">
                ${area.name}
                ${headerChevronHTML}
              </h3>
              <span class="pillar-indicator-badge ${pillarClass}">${pillarSpanishName}</span>
            </div>
            <div class="team-members-list">
              <div class="member-row">
                <span class="member-role">Líder</span>
                <span class="member-name-badge leader">${area.leader}</span>
              </div>
              <div class="member-row">
                <span class="member-role">Co-Líder</span>
                <span class="member-name-badge coleader">${area.coleader}</span>
              </div>
              <div style="height: 1px; background:var(--border-color); margin: 8px 0 4px 0;"></div>
              
              <div class="expand-prompt" style="font-size: 0.72rem; text-align: center; color: #00f2fe; background: rgba(0,242,254,0.06); padding: 4px; border-radius: 4px; border: 1px dashed rgba(0,242,254,0.2); font-weight: 600; margin: 4px 0; letter-spacing:0.02em;">
                Presiona para ver sub-áreas
              </div>
              
              <div class="collapsible-content">
                ${servantsHTML}
              </div>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="team-area-header">
              <h3>${area.name}</h3>
              <span class="pillar-indicator-badge ${pillarClass}">${pillarSpanishName}</span>
            </div>
            <div class="team-members-list">
              <div class="member-row">
                <span class="member-role">Líder</span>
                <span class="member-name-badge leader">${area.leader}</span>
              </div>
              <div class="member-row">
                <span class="member-role">Co-Líder</span>
                <span class="member-name-badge coleader">${area.coleader}</span>
              </div>
              <div style="height: 1px; background:var(--border-color); margin: 8px 0 4px 0;"></div>
              ${servantsHTML}
            </div>
          `;
        }

        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444; font-size: 0.9rem;">Error al conectar con la base de datos de equipos: ${err.message}</div>`;
    }
  }

  /* ==========================================================================
     5. MODAL SYSTEM & SPECIAL EVENT CREATION
     ========================================================================== */
  const btnCreateSpecialDashboard = document.getElementById("btn-create-special-dashboard");
  const btnOpenCreateSpecialModal = document.getElementById("btn-open-create-special-modal");
  const specialEventModal = document.getElementById("special-event-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const specialEventForm = document.getElementById("special-event-form");

  // Show Modal triggers
  const openModal = () => {
    specialEventModal.classList.remove("hidden");
    // Set default date to next Friday
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7));
    document.getElementById("event-date").value = nextFriday.toISOString().split('T')[0];
    document.getElementById("event-time").value = "19:00";
  };

  const closeModal = () => {
    specialEventModal.classList.add("hidden");
    specialEventForm.reset();
  };

  if (btnCreateSpecialDashboard) btnCreateSpecialDashboard.addEventListener("click", openModal);
  if (btnOpenCreateSpecialModal) btnOpenCreateSpecialModal.addEventListener("click", openModal);
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

  // Close modal clicking outside
  specialEventModal.addEventListener("click", (e) => {
    if (e.target === specialEventModal) closeModal();
  });

  // Handle new special event submission (Saving in PostgreSQL)
  specialEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title").value;
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const description = document.getElementById("event-description").value;

    // Get checked areas
    const checkedAreaCheckboxes = document.querySelectorAll("input[name='event-areas']:checked");
    const areasRequired = Array.from(checkedAreaCheckboxes).map(cb => cb.value);

    if (areasRequired.length === 0) {
      alert("Por favor, selecciona al menos un área requerida para la coordinación.");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          time,
          description,
          areasRequired,
          creatorId: currentUser.id || null
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al programar el evento especial');
      }

      // Close and refresh
      closeModal();
      await renderSpecialEventsList();
      renderSundayServicesDashboard(); // update counter if visible

      alert(`¡Evento especial "${title}" programado de manera exitosa en PostgreSQL!`);
    } catch (err) {
      alert(`Error al crear evento especial: ${err.message}`);
    }
  });

  // ==========================================================================
  // 6. INICIALIZACIÓN AUTOMÁTICA DE SESIÓN (AUTOLOGIN)
  // ==========================================================================
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (savedToken && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      loginUserSession(user.nombre, user.alias, user.rol, user.distrito, user.area, true);
    } catch (err) {
      console.warn("No se pudo restaurar la sesión guardada en localStorage.");
      localStorage.clear();
    }
  }

  // ==========================================================================
  // 7. LÓGICA DE INTERACTIVIDAD DEL ASISTENTE DE IA (GEMINI CHAT WIDGET)
  // ==========================================================================
  const aiWidgetTrigger = document.getElementById("ai-widget-trigger");
  const aiChatWindow = document.getElementById("ai-chat-window");
  const btnCloseAiChat = document.getElementById("btn-close-ai-chat");
  const aiChatForm = document.getElementById("ai-chat-form");
  const aiChatInput = document.getElementById("ai-chat-input");
  const aiChatMessages = document.getElementById("ai-chat-messages");

  // Toggle chat window open/close
  if (aiWidgetTrigger) {
    aiWidgetTrigger.addEventListener("click", () => {
      aiChatWindow.classList.toggle("hidden");
      scrollToBottom();
      aiChatInput.focus();
    });
  }

  if (btnCloseAiChat) {
    btnCloseAiChat.addEventListener("click", () => {
      aiChatWindow.classList.add("hidden");
    });
  }

  // Auto scroll messages to bottom
  function scrollToBottom() {
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  // AI Typing Effect (Efecto de máquina de escribir premium)
  function typeMessage(element, text, callback) {
    let index = 0;
    element.innerHTML = "";
    
    function typeChar() {
      if (index < text.length) {
        element.innerHTML += text.charAt(index);
        index++;
        scrollToBottom();
        setTimeout(typeChar, 12); // Velocidad de escritura en ms
      } else {
        if (callback) callback();
      }
    }
    typeChar();
  }

  // Handle chat message submit
  if (aiChatForm) {
    aiChatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const question = aiChatInput.value.trim();
      if (!question) return;

      // Clear input field
      aiChatInput.value = "";

      // 1. Render user message bubble
      const userBubble = document.createElement("div");
      userBubble.className = "ai-message user";
      userBubble.textContent = question;
      aiChatMessages.appendChild(userBubble);
      scrollToBottom();

      // 2. Render assistant loading bubble
      const loadingBubble = document.createElement("div");
      loadingBubble.className = "ai-message assistant loading-bubble";
      loadingBubble.innerHTML = `
        <div class="ai-loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      aiChatMessages.appendChild(loadingBubble);
      scrollToBottom();

      try {
        // 3. Request Gemini response from Server Proxy
        const response = await fetch('/api/ia/consultar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pregunta: question })
        });
        const data = await response.json();

        // Remove loading bubble
        loadingBubble.remove();

        // 4. Render response bubble with typing effect
        const assistantBubble = document.createElement("div");
        assistantBubble.className = "ai-message assistant";
        aiChatMessages.appendChild(assistantBubble);
        scrollToBottom();

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo conectar con el servicio de IA');
        }

        typeMessage(assistantBubble, data.respuesta);
      } catch (err) {
        loadingBubble.remove();
        
        const errorBubble = document.createElement("div");
        errorBubble.className = "ai-message assistant";
        errorBubble.style.color = "#ef4444";
        errorBubble.style.border = "1px solid rgba(239, 68, 68, 0.2)";
        aiChatMessages.appendChild(errorBubble);
        scrollToBottom();
        
        typeMessage(errorBubble, `Lo siento, ocurrió un error: ${err.message}. Asegúrate de tener levantado el servidor backend con tu base de datos y la clave GEMINI_API_KEY configurada en tu .env.`);
      }
    });
  }
});
