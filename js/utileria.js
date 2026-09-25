
(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var lib = factory();
    root.Utileria = lib;
    Object.keys(lib).forEach(function (nombre) {
      if (typeof lib[nombre] === 'function' && typeof root[nombre] === 'undefined') {
        root[nombre] = lib[nombre];
      }
    });
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function aTexto(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
  }

  function aFecha(entrada) {
    if (entrada instanceof Date) {
      return isNaN(entrada.getTime()) ? null : new Date(entrada.getFullYear(), entrada.getMonth(), entrada.getDate());
    }

    if (typeof entrada === 'number') {
      var d = new Date(entrada);
      return isNaN(d.getTime()) ? null : d;
    }

    var texto = aTexto(entrada);
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!partes) return null;

    var anio = Number(partes[1]);
    var mes = Number(partes[2]) - 1;
    var dia = Number(partes[3]);
    var fecha = new Date(anio, mes, dia);

    // Rechaza fechas imposibles como 2024-02-31
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
      return null;
    }
    return fecha;
  }

  //FUNCIONES OBLIGATORIAS 

  function validarCorreo(correo) {
    var texto = aTexto(correo);
    if (texto.length === 0 || texto.length > 254) return false;
    var patron = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
    if (!patron.test(texto)) return false;
    // Sin puntos al inicio/fin de la parte local ni puntos dobles
    var local = texto.split('@')[0];
    return !(local.charAt(0) === '.' || local.charAt(local.length - 1) === '.' || texto.indexOf('..') !== -1);
  }

  function soloLetras(texto) {
    var valor = aTexto(texto);
    if (valor.length === 0) return false;
    return /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+( [A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/.test(valor);
  }

  function validarLongitud(numero, maxLongitud) {
    var valor = aTexto(numero);
    var max = Number(maxLongitud);
    if (!Number.isInteger(max) || max < 1) return false;
    if (!/^\d+$/.test(valor)) return false;
    return valor.length <= max;
  }

  function calcularEdad(fechaNacimiento) {
    var nacimiento = aFecha(fechaNacimiento);
    if (!nacimiento) return NaN;

    var hoy = new Date();
    if (nacimiento > hoy) return NaN;

    var edad = hoy.getFullYear() - nacimiento.getFullYear();
    var mesDif = hoy.getMonth() - nacimiento.getMonth();
    if (mesDif < 0 || (mesDif === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  function esMayorDeEdad(fechaNacimiento) {
    var edad = calcularEdad(fechaNacimiento);
    return !isNaN(edad) && edad >= 18;
  }

  function validarPassword(password) {
    var valor = password === null || password === undefined ? '' : String(password);
    return valor.length >= 8 &&
      /[A-ZÁÉÍÓÚÜÑ]/.test(valor) &&
      /[a-záéíóúüñ]/.test(valor) &&
      /\d/.test(valor) &&
      /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(valor);
  }

  //SECCIÓN LIBRE

  /**
   * Revisa que una contraseña NO contenga datos personales del usuario:
   * nombre, apellidos, la parte del correo antes de la @ o su fecha de
   * nacimiento (año, día+mes o mes+día). Detecta también los datos
   * "disfrazados" con acentos, mayúsculas o sustituciones típicas como
   * 4→a, 3→e, 1→i, 0→o, 5→s, 7→t, @→a, $→s.
   *
   * Problema que resuelve: muchas contraseñas "seguras" (con mayúscula,
   * número y símbolo) son fáciles de adivinar porque usan el nombre o
   * el año de nacimiento de la persona, como "Ana#2005" o "L0p3z!99".
   * validarPasswordPersonal('4n4L0p3z#1', { nombre: 'Ana', apellidos: 'López' }) // false
   * validarPasswordPersonal('Nube#Roja27', { nombre: 'Ana', apellidos: 'López' }) // true
   */
  function validarPasswordPersonal(password, datos) {
    var valor = password === null || password === undefined ? '' : String(password);
    if (valor.length === 0) return false;
    datos = datos || {};

    function limpiar(texto) {
      return aTexto(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    var sustituciones = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };
    var sinDisfraz = limpiar(valor).replace(/[4@31!05$7]/g, function (c) { return sustituciones[c]; });

    var ignorar = ['del', 'las', 'los', 'van', 'von'];
    var usuarioCorreo = limpiar(datos.correo).split('@')[0];
    var palabras = [datos.nombre, datos.apellidos].map(limpiar).join(' ').split(/\s+/)
      .concat(usuarioCorreo.split(/[^a-z]+/))
      .filter(function (p) { return p.length >= 3 && ignorar.indexOf(p) === -1; });

    for (var i = 0; i < palabras.length; i++) {
      if (sinDisfraz.indexOf(palabras[i]) !== -1) return false;
    }

    var fecha = datos.fechaNacimiento ? aFecha(datos.fechaNacimiento) : null;
    if (fecha) {
      var dd = String(fecha.getDate()).padStart(2, '0');
      var mm = String(fecha.getMonth() + 1).padStart(2, '0');
      var patrones = [String(fecha.getFullYear()), dd + mm, mm + dd];
      for (var j = 0; j < patrones.length; j++) {
        if (valor.indexOf(patrones[j]) !== -1) return false;
      }
    }

    return true;
  }

  /**
   * Da formato de nombre propio: quita espacios de sobra y pone
   * mayúscula inicial en cada palabra. Respeta partículas comunes
   * en nombres hispanos (de, del, la, y...).
   */
  function capitalizarNombre(texto) {
    var particulas = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'van', 'von'];
    return aTexto(texto)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (palabra, i) {
        if (i > 0 && particulas.indexOf(palabra) !== -1) return palabra;
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      })
      .join(' ');
  }

  return {
    // Obligatorias
    validarCorreo: validarCorreo,
    soloLetras: soloLetras,
    validarLongitud: validarLongitud,
    calcularEdad: calcularEdad,
    esMayorDeEdad: esMayorDeEdad,
    validarPassword: validarPassword,
    // Sección libre
    validarPasswordPersonal: validarPasswordPersonal,
    capitalizarNombre: capitalizarNombre
  };
});