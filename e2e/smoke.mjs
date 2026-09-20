/**
 * Test de fumée — parcourt les flux principaux dans un vrai navigateur.
 * Lance `npm run dev` dans un autre terminal, puis `npm run e2e`.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ok = (...a) => console.log("  ✓", ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

try {
  console.log("Authentification");
  await page.goto(`${BASE}/`);
  await page.waitForURL("**/connexion");
  ok("visiteur anonyme redirigé vers /connexion");
  await page.fill('input[name="email"]', "demo@musclemap.app");
  await page.fill('input[name="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`);
  ok("connexion réussie");

  console.log("Carte musculaire");
  await page.locator('[aria-label="Pectoraux"] path').first().click();
  await page.waitForSelector("text=Voir pectoraux");
  ok("sélection d'un muscle");
  await page.click('button[role="tab"]:has-text("Dos")');
  await page.waitForSelector("text=VUE POSTÉRIEURE");
  await page.locator('[aria-label="Dorsaux"] path').first().click();
  await page.waitForSelector("text=Voir dorsaux");
  ok("bascule face / dos");

  console.log("Navigation");
  await page.click("text=Voir dorsaux");
  await page.waitForURL("**/muscle/dorsaux");
  await page.click("text=Grand dorsal");
  await page.waitForURL("**/muscle/dorsaux/GD");
  ok("groupe → faisceau");
  await page.click('a:has-text("Barre")');
  await page.waitForURL("**equip=Barre**");
  ok("filtre équipement");

  console.log("Séance");
  await page.locator('button[aria-label="Ajouter à ma séance"]').first().click();
  await page.waitForSelector('[role="status"]');
  ok("ajout à la séance + toast");
  await page.goto(`${BASE}/seance`);
  await page.waitForSelector('button[aria-label="Valider la série 1"]');
  await page.click('button[aria-label="Valider la série 1"]');
  await page.waitForSelector('[role="timer"]');
  ok("série validée → minuteur de repos lancé");
  await page.locator('input[aria-label="Poids série 2"]').fill("62.5");
  await page.waitForTimeout(1200);
  await page.reload();
  const weight = await page.locator('input[aria-label="Poids série 2"]').inputValue();
  if (weight !== "62.5") throw new Error(`poids non persisté : ${weight}`);
  ok("poids persisté en base");
  await page.click('button:has-text("Terminer")');
  await page.waitForURL("**/resume");
  ok("clôture → résumé");

  console.log("Reste de l'app");
  for (const [label, url] of [["progression", "/progression"], ["bibliothèque", "/biblio"], ["profil", "/profil"]]) {
    await page.goto(BASE + url);
    await page.waitForSelector("h1");
    ok(label);
  }

  if (errors.length) throw new Error("erreurs console :\n" + errors.join("\n"));
  console.log("\n✓ Tous les flux passent.");
} catch (e) {
  console.error("\n✗", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
