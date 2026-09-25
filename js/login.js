(function () {
  'use strict';

  var form = document.getElementById('formLogin');
  var correo = document.getElementById('correo');
  var password = document.getElementById('password');
  var btnVer = document.getElementById('btnVer');
  var resultado = document.getElementById('resultado');

  var datosRegistro = {};

  try {
    var correoGuardado = sessionStorage.getItem('utileria:correo');
    var nombreGuardado = sessionStorage.getItem('utileria:nombre');
    if (correoGuardado) correo.value = correoGuardado;
    datosRegistro = {
      nombre: nombreGuardado || '',
      apellidos: sessionStorage.getItem('utileria:apellidos') || '',
      fechaNacimiento: sessionStorage.getItem('utileria:fecha') || ''
    };
    if (nombreGuardado) {
      document.getElementById('saludo').textContent =
        'Hola, ' + Utileria.capitalizarNombre(nombreGuardado) + '. Escribe una contraseña segura para entrar.';
    }
  } catch (err) { }

  function pintar(input, error, textoOk) {
    var campo = input.closest('.campo');
    var msg = campo.querySelector('.mensaje');
    campo.classList.remove('es-valido', 'es-invalido');
    if (error) {
      campo.classList.add('es-invalido');
      msg.textContent = error;
    } else {
      campo.classList.add('es-valido');
      msg.textContent = textoOk;
    }
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
  }

  function revisarCorreo() {
    var v = correo.value;
    var error = '';
    if (!v.trim()) error = 'Escribe tu correo.';
    else if (!Utileria.validarCorreo(v)) error = 'El correo debe tener el formato nombre@dominio.com.';
    pintar(correo, error, 'Correo válido.');
    return !error;
  }

  function datosPersonales() {
    return {
      nombre: datosRegistro.nombre,
      apellidos: datosRegistro.apellidos,
      fechaNacimiento: datosRegistro.fechaNacimiento,
      correo: correo.value
    };
  }

  function passwordCompleta(v) {
    return Utileria.validarPassword(v) && Utileria.validarPasswordPersonal(v, datosPersonales());
  }

  function revisarPassword() {
    var v = password.value;
    var error = '';
    if (!v) error = 'Escribe tu contraseña.';
    else if (!Utileria.validarPassword(v)) error = 'La contraseña no cumple todos los requisitos.';
    else if (!Utileria.validarPasswordPersonal(v, datosPersonales())) {
      error = 'Tu contraseña incluye tu nombre, correo o fecha de nacimiento. Es fácil de adivinar.';
    }
    pintar(password, error, 'Contraseña segura.');
    return !error;
  }

  function requisitosPassword(valor) {
    return {
      longitud: valor.length >= 8,
      mayuscula: /[A-ZÁÉÍÓÚÜÑ]/.test(valor),
      minuscula: /[a-záéíóúüñ]/.test(valor),
      numero: /\d/.test(valor),
      especial: /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(valor)
    };
  }

  function actualizarRequisitos() {
    var r = requisitosPassword(password.value);
    r.personal = Utileria.validarPasswordPersonal(password.value, datosPersonales());
    document.querySelectorAll('#requisitos li').forEach(function (li) {
      li.classList.toggle('cumple', r[li.dataset.req]);
    });
  }

  correo.addEventListener('blur', function () { if (correo.value.trim()) revisarCorreo(); });
  correo.addEventListener('input', function () {
    if (correo.closest('.campo').classList.contains('es-invalido')) revisarCorreo();
    actualizarRequisitos(); 
    resultado.hidden = true;
  });

  password.addEventListener('input', function () {
    actualizarRequisitos();
    if (password.closest('.campo').classList.contains('es-invalido') || passwordCompleta(password.value)) {
      revisarPassword();
    }
    resultado.hidden = true;
  });

  btnVer.addEventListener('click', function () {
    var oculto = password.type === 'password';
    password.type = oculto ? 'text' : 'password';
    btnVer.textContent = oculto ? 'Ocultar' : 'Mostrar';
    btnVer.setAttribute('aria-pressed', String(oculto));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okCorreo = revisarCorreo();
    var okPass = revisarPassword();

    console.log('[utileria] validarCorreo →', okCorreo,
      '| validarPassword →', Utileria.validarPassword(password.value),
      '| validarPasswordPersonal →', Utileria.validarPasswordPersonal(password.value, datosPersonales()));

    resultado.hidden = false;
    if (okCorreo && okPass) {
      resultado.className = 'aviso aviso--ok';
      resultado.textContent = 'Sesión iniciada como ' + correo.value.trim() + '.';
    } else {
      resultado.className = 'aviso aviso--error';
      resultado.textContent = 'Revisa los campos marcados en rojo.';
      (okCorreo ? password : correo).focus();
    }
  });

  actualizarRequisitos();
})();