(function () {
  'use strict';

  var form = document.getElementById('formRegistro');
  var inputs = {
    nombre: document.getElementById('nombre'),
    apellidos: document.getElementById('apellidos'),
    correo: document.getElementById('correo'),
    telefono: document.getElementById('telefono'),
    fecha: document.getElementById('fecha')
  };
  var btnCalcular = document.getElementById('btnCalcular');
  var btnLogin = document.getElementById('btnLogin');
  var notaLogin = document.getElementById('notaLogin');
  var avisoForm = document.getElementById('avisoForm');
  var modal = document.getElementById('modalEdad');

  var estado = { edad: null, fechaUsada: null };

  var hoy = new Date();
  inputs.fecha.max = hoy.getFullYear() + '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
    String(hoy.getDate()).padStart(2, '0');

  var reglas = {
    nombre: function (v) {
      if (!v.trim()) return 'Escribe tu nombre.';
      if (!Utileria.soloLetras(v)) return 'Usa solo letras; se aceptan acentos y ñ.';
      return '';
    },
    apellidos: function (v) {
      if (!v.trim()) return 'Escribe tus apellidos.';
      if (!Utileria.soloLetras(v)) return 'Usa solo letras; se aceptan acentos y ñ.';
      return '';
    },
    correo: function (v) {
      if (!v.trim()) return 'Escribe tu correo.';
      if (!Utileria.validarCorreo(v)) return 'El correo debe tener el formato nombre@dominio.com.';
      return '';
    },
    telefono: function (v) {
      if (!v.trim()) return 'Escribe tu teléfono.';
      if (!Utileria.validarLongitud(v, 10)) return 'Solo dígitos, máximo 10.';
      if (v.trim().length !== 10) return 'Faltan ' + (10 - v.trim().length) + ' dígitos.';
      return '';
    },
    fecha: function (v) {
      if (!v) return 'Elige tu fecha de nacimiento.';
      if (isNaN(Utileria.calcularEdad(v))) return 'La fecha no es válida o está en el futuro.';
      return '';
    }
  };

  var mensajesOk = {
    nombre: 'Nombre válido.',
    apellidos: 'Apellidos válidos.',
    correo: 'Correo válido.',
    telefono: 'Teléfono válido.',
    fecha: 'Fecha válida.'
  };

  function validarCampo(nombre, mostrarError) {
    var input = inputs[nombre];
    var campo = input.closest('.campo');
    var msg = document.getElementById('msg-' + nombre);
    var error = reglas[nombre](input.value);
    var vacio = !input.value.trim();

    campo.classList.remove('es-valido', 'es-invalido');

    if (error && mostrarError) {
      campo.classList.add('es-invalido');
      msg.textContent = error;
    } else if (!error && !vacio) {
      campo.classList.add('es-valido');
      msg.textContent = mensajesOk[nombre];
    } else {
      msg.textContent = '';
    }
    input.setAttribute('aria-invalid', error && mostrarError ? 'true' : 'false');
    return !error;
  }

  function marcar(id, valor) {
    var li = document.getElementById('t-' + id);
    var res = li.querySelector('.resultado');
    if (valor === null) {
      li.removeAttribute('data-estado');
      res.textContent = '—';
      return;
    }
    if (typeof valor === 'boolean') {
      li.setAttribute('data-estado', valor ? 'ok' : 'error');
      res.textContent = String(valor);
    } else if (typeof valor === 'string') {
      li.setAttribute('data-estado', 'ok');
      res.textContent = valor;
    } else {
      li.setAttribute('data-estado', isNaN(valor) ? 'error' : 'ok');
      res.textContent = String(valor);
    }
  }

  function actualizarTablero() {
    var n = inputs.nombre.value, a = inputs.apellidos.value;
    marcar('soloLetras', n || a ? Utileria.soloLetras(n) && Utileria.soloLetras(a) : null);
    marcar('validarCorreo', inputs.correo.value ? Utileria.validarCorreo(inputs.correo.value) : null);
    marcar('validarLongitud', inputs.telefono.value ? Utileria.validarLongitud(inputs.telefono.value, 10) : null);
    var f = inputs.fecha.value;
    marcar('calcularEdad', f ? Utileria.calcularEdad(f) : null);
    marcar('esMayorDeEdad', f ? Utileria.esMayorDeEdad(f) : null);
    var completo = (n + ' ' + a).trim();
    marcar('capitalizarNombre', completo && Utileria.soloLetras(completo) ? "'" + Utileria.capitalizarNombre(completo) + "'" : null);
  }

  function actualizarBotonLogin() {
    var calculada = estado.edad !== null && estado.fechaUsada === inputs.fecha.value;

    if (!calculada) {
      btnLogin.disabled = true;
      notaLogin.textContent = 'Calcula tu edad para habilitar el acceso al login.';
    } else if (estado.edad < 18) {
      btnLogin.disabled = true;
      notaLogin.textContent = 'El acceso al login es solo para mayores de 18 años.';
    } else {
      btnLogin.disabled = false;
      notaLogin.textContent = 'Edad verificada. Ya puedes ir al login.';
    }
  }

  Object.keys(inputs).forEach(function (nombre) {
    var input = inputs[nombre];

    input.addEventListener('input', function () {
      var yaTeniaError = input.closest('.campo').classList.contains('es-invalido');
      validarCampo(nombre, yaTeniaError);
      actualizarTablero();
      if (nombre === 'fecha') actualizarBotonLogin();
      avisoForm.hidden = true;
    });

    input.addEventListener('blur', function () {
      if ((nombre === 'nombre' || nombre === 'apellidos') && Utileria.soloLetras(input.value)) {
        input.value = Utileria.capitalizarNombre(input.value);
      }
      if (input.value.trim()) validarCampo(nombre, true);
      actualizarTablero();
    });
  });

  inputs.telefono.addEventListener('beforeinput', function (e) {
    if (e.data && /\D/.test(e.data)) e.preventDefault();
  });

  btnCalcular.addEventListener('click', function () {
    if (!validarCampo('fecha', true)) {
      inputs.fecha.focus();
      return;
    }

    var fecha = inputs.fecha.value;
    var edad = Utileria.calcularEdad(fecha);
    var mayor = Utileria.esMayorDeEdad(fecha);

    estado.edad = edad;
    estado.fechaUsada = fecha;

    document.getElementById('modalEdadNumero').textContent = edad;
    var veredicto = document.getElementById('modalVeredicto');
    veredicto.className = 'modal__veredicto ' + (mayor ? 'mayor' : 'menor');
    veredicto.textContent = mayor
      ? 'Eres mayor de edad. Puedes continuar al login.'
      : 'Eres menor de edad. No puedes continuar al login.';
    document.getElementById('modalCodigo').textContent =
      "calcularEdad('" + fecha + "') → " + edad + '   esMayorDeEdad() → ' + mayor;

    console.log('[utileria] calcularEdad("' + fecha + '") →', edad, '| esMayorDeEdad →', mayor);

    modal.showModal();
    actualizarBotonLogin();
    actualizarTablero();
  });

  document.getElementById('btnCerrarModal').addEventListener('click', function () {
    modal.close();
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.close();
  });

  btnLogin.addEventListener('click', function () {
    var campos = Object.keys(inputs);
    var todosValidos = campos.map(function (c) { return validarCampo(c, true); }).every(Boolean);
    var edadOk = estado.edad !== null && estado.fechaUsada === inputs.fecha.value && estado.edad >= 18;

    if (!todosValidos) {
      avisoForm.textContent = 'Corrige los campos marcados en rojo antes de continuar.';
      avisoForm.hidden = false;
      var primero = campos.find(function (c) { return reglas[c](inputs[c].value); });
      if (primero) inputs[primero].focus();
      return;
    }
    if (!edadOk) {
      actualizarBotonLogin();
      return;
    }

    try {
      sessionStorage.setItem('utileria:correo', inputs.correo.value.trim());
      sessionStorage.setItem('utileria:nombre', inputs.nombre.value.trim());
      sessionStorage.setItem('utileria:apellidos', inputs.apellidos.value.trim());
      sessionStorage.setItem('utileria:fecha', inputs.fecha.value);
    } catch (err) { /* almacenamiento no disponible, se continúa igual */ }

    window.location.href = 'login.html';
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  console.log('%cutileria.js', 'font-weight:bold;font-size:14px;color:#1463A3');
  console.table([
    { funcion: "validarCorreo('ana@mail.com')", resultado: Utileria.validarCorreo('ana@mail.com') },
    { funcion: "validarCorreo('ana@mail')", resultado: Utileria.validarCorreo('ana@mail') },
    { funcion: "soloLetras('José Núñez')", resultado: Utileria.soloLetras('José Núñez') },
    { funcion: "soloLetras('Ana123')", resultado: Utileria.soloLetras('Ana123') },
    { funcion: "validarLongitud('9511234567', 10)", resultado: Utileria.validarLongitud('9511234567', 10) },
    { funcion: "validarLongitud('95112345678', 10)", resultado: Utileria.validarLongitud('95112345678', 10) },
    { funcion: "calcularEdad('2000-05-15')", resultado: Utileria.calcularEdad('2000-05-15') },
    { funcion: "esMayorDeEdad('2010-01-01')", resultado: Utileria.esMayorDeEdad('2010-01-01') },
    { funcion: "validarPassword('Hola#2026')", resultado: Utileria.validarPassword('Hola#2026') },
    { funcion: "validarPassword('hola2026')", resultado: Utileria.validarPassword('hola2026') },
    { funcion: "validarPasswordPersonal('4n4L0p3z#1', {nombre:'Ana', apellidos:'López'})", resultado: Utileria.validarPasswordPersonal('4n4L0p3z#1', { nombre: 'Ana', apellidos: 'López' }) },
    { funcion: "validarPasswordPersonal('Nube#Roja27', {nombre:'Ana', apellidos:'López'})", resultado: Utileria.validarPasswordPersonal('Nube#Roja27', { nombre: 'Ana', apellidos: 'López' }) },
    { funcion: "capitalizarNombre('maría DE la luz')", resultado: Utileria.capitalizarNombre('maría DE la luz') }
  ]);
})();