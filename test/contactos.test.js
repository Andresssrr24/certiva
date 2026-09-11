const test = require("node:test");
const assert = require("node:assert/strict");
const { directorio, normalizar, comparar, fuentePorId } = require("../renderer/contactos-data");
test("compara números panameños sin confundir prefijos extranjeros ni extensiones", () => {
  for (const n of ["800-2252", "+507 800-2252", "00507 8002252", "(507) 800-2252"])
    assert.equal(comparar(n).estado, "coincide");
  assert.equal(comparar("+507 6949-0076").contacto.id, "andrea");
  for (const n of [
    "+1 507 8002252",
    "+44 8002252",
    "+507 2252",
    "+507 5078002252",
    "800225299",
    "8002252 ext 1",
    "",
    "abc8002252",
  ])
    assert.equal(normalizar(n), null);
  assert.equal(comparar("+507 6623-6365").estado, "no_encontrado");
});
test("cada contacto tiene fuentes primarias fechadas y las fuentes solo se resuelven por ID", () => {
  assert.match(directorio.consultadoEl, /^\d{4}-\d{2}-\d{2}$/);
  for (const c of directorio.contactos) {
    assert.ok(c.fuentes.length);
    for (const id of c.fuentes) {
      const url = new URL(fuentePorId(id).url);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "www.cajadeahorros.com.pa");
    }
  }
  for (const id of ["https://evil.example", "file:///etc/passwd", "__proto__", "seguridad/../evil"])
    assert.equal(fuentePorId(id), null);
});

test("el consejo generado no convierte teléfonos ficticios en contactos oficiales", () => {
  const { consejoSinTelefonosGenerados } = require("../renderer/contactos-data");
  assert.doesNotMatch(consejoSinTelefonosGenerados("Llame inmediatamente al 800-1234."), /800-1234/);
  assert.doesNotMatch(consejoSinTelefonosGenerados("Llame al +507 6623-6365."), /6623/);
  assert.equal(consejoSinTelefonosGenerados("No compartas tu código."), "No compartas tu código.");
});
