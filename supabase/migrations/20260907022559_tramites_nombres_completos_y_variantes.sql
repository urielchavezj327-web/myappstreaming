-- Reorganización de Trámites.
--
-- Tres cosas a la vez:
--   1. Nombres completos en lugar de abreviaturas: "CSF" pasa a "Constancia de
--      Situación Fiscal". Solo se conservan las siglas que se usan como nombre
--      propio (CURP, NSS, REPUVE, RNOA, SINDO, DS-160); el buscador las
--      encuentra igual por su nombre largo gracias a la tabla de sinónimos.
--   2. Un mismo documento deja de estar partido en varias fichas. Las seis
--      fichas de CSF, por ejemplo, se vuelven una sola y cada forma de
--      obtenerla queda como variante de la oferta.
--   3. La variante se guarda en `stock_items.notes`, una columna que estaba
--      vacía en las 1.707 filas. Sirve para agrupar dentro de la ficha y para
--      que "Mejor precio" compare cada variante con las de su tipo, no un
--      original de oficina contra un clon.
--
-- Es reversible: no se borra ninguna oferta, solo se reasignan de ficha.


-- Acta de Nacimiento
UPDATE services SET name = 'Acta de Nacimiento', sort_order = 1 WHERE slug = 'acta-nacimiento';

-- Acta de Matrimonio
UPDATE services SET name = 'Acta de Matrimonio', sort_order = 2 WHERE slug = 'acta-matrimonio';

-- Acta de Defunción
UPDATE services SET name = 'Acta de Defunción', sort_order = 3 WHERE slug = 'acta-defuncion';

-- Acta de Divorcio
UPDATE services SET name = 'Acta de Divorcio', sort_order = 4 WHERE slug = 'acta-divorcio';

-- Acta Clon
UPDATE stock_items SET notes = 'Normal' WHERE service_id = (SELECT id FROM services WHERE slug = 'acta-clon') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Verificable' WHERE service_id = (SELECT id FROM services WHERE slug = 'acta-verificable') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'acta-clon') WHERE service_id = (SELECT id FROM services WHERE slug = 'acta-verificable');
DELETE FROM services WHERE slug = 'acta-verificable';
UPDATE services SET name = 'Acta Clon', sort_order = 5 WHERE slug = 'acta-clon';

-- Constancia de Inexistencia
UPDATE services SET name = 'Constancia de Inexistencia', sort_order = 6 WHERE slug = 'inexistencia';

-- Constancia de Concubinato
UPDATE services SET name = 'Constancia de Concubinato', sort_order = 7 WHERE slug = 'concubinato';

-- CURP
UPDATE services SET name = 'CURP', sort_order = 8 WHERE slug = 'curp';

-- Recibo de Luz CFE
UPDATE services SET name = 'Recibo de Luz CFE', sort_order = 9 WHERE slug = 'recibo-cfe';

-- Carta de Recomendación
UPDATE services SET name = 'Carta de Recomendación', sort_order = 10 WHERE slug = 'carta-recomendacion';

-- Currículum
UPDATE services SET name = 'Currículum', sort_order = 11 WHERE slug = 'cv';

-- Certificado Religioso
UPDATE services SET name = 'Certificado Religioso', sort_order = 12 WHERE slug = 'cert-religioso';

-- Constancia de Situación Fiscal
UPDATE stock_items SET notes = 'Con CURP' WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Con RFC e IDCIF' WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-idcif') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-idcif');
DELETE FROM services WHERE slug = 'rfc-idcif';
UPDATE stock_items SET notes = 'Clon' WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-clon') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-clon');
DELETE FROM services WHERE slug = 'rfc-clon';
UPDATE stock_items SET notes = 'Verificable' WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-verificable') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-verificable');
DELETE FROM services WHERE slug = 'rfc-verificable';
UPDATE stock_items SET notes = 'Original de oficina' WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-oficina') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') WHERE service_id = (SELECT id FROM services WHERE slug = 'rfc-oficina');
DELETE FROM services WHERE slug = 'rfc-oficina';
UPDATE stock_items SET notes = 'Datos fiscales' WHERE service_id = (SELECT id FROM services WHERE slug = 'datos-fiscales') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'rfc-curp') WHERE service_id = (SELECT id FROM services WHERE slug = 'datos-fiscales');
DELETE FROM services WHERE slug = 'datos-fiscales';
UPDATE services SET name = 'Constancia de Situación Fiscal', sort_order = 13 WHERE slug = 'rfc-curp';

-- Cédula de Identificación Fiscal
UPDATE services SET name = 'Cédula de Identificación Fiscal', sort_order = 14 WHERE slug = 'cedula-fiscal';

-- Opinión de Cumplimiento
UPDATE services SET name = 'Opinión de Cumplimiento', sort_order = 15 WHERE slug = 'opinion-cumplimiento';

-- Localización de IDCIF
UPDATE services SET name = 'Localización de IDCIF', sort_order = 16 WHERE slug = 'localizar-idcif';

-- Cita en el SAT
UPDATE services SET name = 'Cita en el SAT', sort_order = 17 WHERE slug = 'cita-sat';

-- NSS
UPDATE stock_items SET notes = 'Normal' WHERE service_id = (SELECT id FROM services WHERE slug = 'nss') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Primera vez' WHERE service_id = (SELECT id FROM services WHERE slug = 'nss-primera-vez') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'nss') WHERE service_id = (SELECT id FROM services WHERE slug = 'nss-primera-vez');
DELETE FROM services WHERE slug = 'nss-primera-vez';
UPDATE services SET name = 'NSS', sort_order = 18 WHERE slug = 'nss';

-- Vigencia de Derechos
UPDATE services SET name = 'Vigencia de Derechos', sort_order = 19 WHERE slug = 'vigencia-derechos';

-- Constancia de No Derechohabiencia
UPDATE stock_items SET notes = 'IMSS' WHERE service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-imss') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'ISSSTE' WHERE service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-issste') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-imss') WHERE service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-issste');
DELETE FROM services WHERE slug = 'no-derechohabiente-issste';
UPDATE stock_items SET notes = 'ISSEMyM' WHERE service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-isssemym') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-imss') WHERE service_id = (SELECT id FROM services WHERE slug = 'no-derechohabiente-isssemym');
DELETE FROM services WHERE slug = 'no-derechohabiente-isssemym';
UPDATE services SET name = 'Constancia de No Derechohabiencia', sort_order = 20 WHERE slug = 'no-derechohabiente-imss';

-- Semanas Cotizadas
UPDATE services SET name = 'Semanas Cotizadas', sort_order = 21 WHERE slug = 'semanas-cotizadas';

-- Incapacidad del IMSS
UPDATE services SET name = 'Incapacidad del IMSS', sort_order = 22 WHERE slug = 'incapacidad-imss';

-- Receta Médica
UPDATE stock_items SET notes = 'IMSS' WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-imss') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Farmacias Similares' WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-simi') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'receta-imss') WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-simi');
DELETE FROM services WHERE slug = 'receta-simi';
UPDATE stock_items SET notes = 'Farmacias del Ahorro' WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-ahorro') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'receta-imss') WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-ahorro');
DELETE FROM services WHERE slug = 'receta-ahorro';
UPDATE stock_items SET notes = 'Particular' WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-particular') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'receta-imss') WHERE service_id = (SELECT id FROM services WHERE slug = 'receta-particular');
DELETE FROM services WHERE slug = 'receta-particular';
UPDATE services SET name = 'Receta Médica', sort_order = 23 WHERE slug = 'receta-imss';

-- Certificado Médico
UPDATE services SET name = 'Certificado Médico', sort_order = 24 WHERE slug = 'certificado-medico';

-- Certificado o Prueba de COVID
UPDATE services SET name = 'Certificado o Prueba de COVID', sort_order = 25 WHERE slug = 'certificado-covid';

-- Hoja de Urgencias
UPDATE services SET name = 'Hoja de Urgencias', sort_order = 26 WHERE slug = 'hoja-urgencias';

-- Antidoping
UPDATE services SET name = 'Antidoping', sort_order = 27 WHERE slug = 'antidoping';

-- Prueba de Embarazo
UPDATE services SET name = 'Prueba de Embarazo', sort_order = 28 WHERE slug = 'prueba-embarazo';

-- Prueba de VIH y Sífilis
UPDATE services SET name = 'Prueba de VIH y Sífilis', sort_order = 29 WHERE slug = 'vih-sifilis';

-- Afiliación al IMSS
UPDATE services SET name = 'Afiliación al IMSS', sort_order = 30 WHERE slug = 'afiliacion-imss';

-- Constancia de Discapacidad
UPDATE services SET name = 'Constancia de Discapacidad', sort_order = 31 WHERE slug = 'hoja-discapacidad';

-- Localización de AFORE
UPDATE services SET name = 'Localización de AFORE', sort_order = 32 WHERE slug = 'localizar-afore';

-- Análisis Clínicos
UPDATE services SET name = 'Análisis Clínicos', sort_order = 33 WHERE slug = 'analisis-clinicos';

-- Talón de Pago del ISSSTE
UPDATE services SET name = 'Talón de Pago del ISSSTE', sort_order = 34 WHERE slug = 'talon-issste';

-- SINDO
UPDATE services SET name = 'SINDO', sort_order = 35 WHERE slug = 'sindo';

-- Pantallas del IMSS
UPDATE services SET name = 'Pantallas del IMSS', sort_order = 36 WHERE slug = 'pantallas-imss';

-- Certificado de Estudios
UPDATE stock_items SET notes = 'Primaria' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Secundaria' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-secundaria') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-secundaria');
DELETE FROM services WHERE slug = 'cert-secundaria';
UPDATE stock_items SET notes = 'Preparatoria' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-preparatoria') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-preparatoria');
DELETE FROM services WHERE slug = 'cert-preparatoria';
UPDATE stock_items SET notes = 'Universidad' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-universidad') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-universidad');
DELETE FROM services WHERE slug = 'cert-universidad';
UPDATE stock_items SET notes = 'Normal' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-normal') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-normal');
DELETE FROM services WHERE slug = 'cert-normal';
UPDATE stock_items SET notes = 'INEA' WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-inea') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'cert-primaria') WHERE service_id = (SELECT id FROM services WHERE slug = 'cert-inea');
DELETE FROM services WHERE slug = 'cert-inea';
UPDATE services SET name = 'Certificado de Estudios', sort_order = 37 WHERE slug = 'cert-primaria';

-- Título Universitario
UPDATE services SET name = 'Título Universitario', sort_order = 38 WHERE slug = 'titulo';

-- Cédula Profesional
UPDATE services SET name = 'Cédula Profesional', sort_order = 39 WHERE slug = 'cedula-profesional';

-- Kardex Escolar
UPDATE services SET name = 'Kardex Escolar', sort_order = 40 WHERE slug = 'kardex';

-- Carta de No Antecedentes Penales
UPDATE stock_items SET notes = 'Estatal' WHERE service_id = (SELECT id FROM services WHERE slug = 'antecedentes-estatales') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Federal' WHERE service_id = (SELECT id FROM services WHERE slug = 'antecedentes-federales') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'antecedentes-estatales') WHERE service_id = (SELECT id FROM services WHERE slug = 'antecedentes-federales');
DELETE FROM services WHERE slug = 'antecedentes-federales';
UPDATE services SET name = 'Carta de No Antecedentes Penales', sort_order = 41 WHERE slug = 'antecedentes-estatales';

-- Certificado de No Adeudo
UPDATE services SET name = 'Certificado de No Adeudo', sort_order = 42 WHERE slug = 'no-deudor';

-- Certificado RNOA
UPDATE services SET name = 'Certificado RNOA', sort_order = 43 WHERE slug = 'rnoa';

-- Consulta REPUVE
UPDATE services SET name = 'Consulta REPUVE', sort_order = 44 WHERE slug = 'repuve';

-- Pago de Tenencia
UPDATE services SET name = 'Pago de Tenencia', sort_order = 45 WHERE slug = 'tenencia';

-- Permiso para Circular sin Placas
UPDATE services SET name = 'Permiso para Circular sin Placas', sort_order = 46 WHERE slug = 'permiso-circular';

-- Licencia de Conducir
UPDATE services SET name = 'Licencia de Conducir', sort_order = 47 WHERE slug = 'licencia';

-- Póliza de Seguro Qualitas
UPDATE services SET name = 'Póliza de Seguro Qualitas', sort_order = 48 WHERE slug = 'poliza-qualitas';

-- Refactura Vehicular
UPDATE services SET name = 'Refactura Vehicular', sort_order = 49 WHERE slug = 'refactura';

-- Estado de Cuenta Infonavit
UPDATE stock_items SET notes = 'Actual' WHERE service_id = (SELECT id FROM services WHERE slug = 'infonavit-estado') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET notes = 'Histórico' WHERE service_id = (SELECT id FROM services WHERE slug = 'infonavit-historico') AND (notes IS NULL OR notes = '');
UPDATE stock_items SET service_id = (SELECT id FROM services WHERE slug = 'infonavit-estado') WHERE service_id = (SELECT id FROM services WHERE slug = 'infonavit-historico');
DELETE FROM services WHERE slug = 'infonavit-historico';
UPDATE services SET name = 'Estado de Cuenta Infonavit', sort_order = 50 WHERE slug = 'infonavit-estado';

-- Desbloqueo de Cuenta Infonavit
UPDATE services SET name = 'Desbloqueo de Cuenta Infonavit', sort_order = 51 WHERE slug = 'infonavit-desbloqueo';

-- Reporte de Buró de Crédito
UPDATE services SET name = 'Reporte de Buró de Crédito', sort_order = 52 WHERE slug = 'buro-credito';

-- Cita en el INE
UPDATE services SET name = 'Cita en el INE', sort_order = 53 WHERE slug = 'cita-ine';

-- Cita para Pasaporte
UPDATE services SET name = 'Cita para Pasaporte', sort_order = 54 WHERE slug = 'cita-pasaporte';

-- Cita en Fonacot
UPDATE services SET name = 'Cita en Fonacot', sort_order = 55 WHERE slug = 'cita-fonacot';

-- Panel de Trámites
UPDATE services SET name = 'Panel de Trámites', sort_order = 56 WHERE slug = 'panel-tramites';

-- Formulario DS-160 para Visa
UPDATE services SET name = 'Formulario DS-160 para Visa', sort_order = 57 WHERE slug = 'ds160';

-- Recibo de Nómina
UPDATE services SET name = 'Recibo de Nómina', sort_order = 58 WHERE slug = 'nomina';

-- Documento de Confirmación
UPDATE services SET name = 'Documento de Confirmación', sort_order = 59 WHERE slug = 'documento-confirmacion';
