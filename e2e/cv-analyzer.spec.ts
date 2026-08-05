import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const VALID_CV_PATH = path.join(__dirname, "fixtures", "valid_cv.pdf");
const INVALID_FILE_PATH = path.join(__dirname, "fixtures", "invalid_file.txt");
const DOWNLOADS_DIR = path.join(__dirname, "..", "e2e-downloads");

test.beforeAll(() => {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
});

/** Sube un archivo al input oculto del FileUploader y espera a que se procese. */
async function uploadFile(page: import("@playwright/test").Page, filePath: string) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

test.describe("Flujo 1: Subir CV en PDF válido", () => {
  test("muestra el rediseño completo con los datos extraídos", async ({ page }) => {
    await page.goto("/");
    await uploadFile(page, VALID_CV_PATH);

    await expect(page.getByText("Procesando...")).toBeVisible();
    // La extracción real llama a la API de Claude; puede tardar varios segundos.
    await expect(page.getByText("Procesando...")).not.toBeVisible({ timeout: 60_000 });

    await expect(
      page.getByRole("button", { name: "Descargar como PDF" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ana Garcia|Ana García/i })).toBeVisible();
    await expect(page.getByText("Acme Corp")).toBeVisible();
    await expect(page.getByText("JavaScript", { exact: true })).toBeVisible();

    await page.screenshot({ path: "e2e-downloads/flujo1-perfil-rediseñado.png", fullPage: true });
  });
});

test.describe("Flujo 2: Subir archivo inválido", () => {
  test("muestra un mensaje de error claro y no muestra el perfil", async ({ page }) => {
    await page.goto("/");
    await uploadFile(page, INVALID_FILE_PATH);

    await expect(
      page.getByText("Solo se aceptan archivos PDF (.pdf) o DOCX (.docx).")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Descargar como PDF" })
    ).not.toBeVisible();

    await page.screenshot({ path: "e2e-downloads/flujo2-error-archivo-invalido.png" });
  });
});

test.describe("Flujo 3: Descargar como PDF", () => {
  test('click en "Descargar como PDF" abre el diálogo de impresión', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled: boolean }).__printCalled = true;
      };
    });

    await page.goto("/");
    await uploadFile(page, VALID_CV_PATH);
    await expect(page.getByText("Procesando...")).not.toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: "Descargar como PDF" }).click();

    const printCalled = await page.evaluate(
      () => (window as unknown as { __printCalled: boolean }).__printCalled
    );
    expect(printCalled).toBe(true);
  });
});

test.describe("Flujo 4: Descargar como imagen", () => {
  test('click en "Descargar como imagen" genera un archivo PNG', async ({ page }) => {
    await page.goto("/");
    await uploadFile(page, VALID_CV_PATH);
    await expect(page.getByText("Procesando...")).not.toBeVisible({ timeout: 60_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: "Descargar como imagen" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/);

    const savedPath = path.join(DOWNLOADS_DIR, download.suggestedFilename());
    await download.saveAs(savedPath);

    const stats = fs.statSync(savedPath);
    expect(stats.size).toBeGreaterThan(0);

    const header = fs.readFileSync(savedPath).subarray(0, 8);
    expect(header.toString("hex")).toBe("89504e470d0a1a0a"); // firma PNG
  });
});

test.describe("Flujo 5: Editar información", () => {
  test("modificar un campo y guardar refleja el cambio en el rediseño", async ({ page }) => {
    await page.goto("/");
    await uploadFile(page, VALID_CV_PATH);
    await expect(page.getByText("Procesando...")).not.toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: "Editar información" }).click();
    const modal = page.getByRole("dialog", { name: "Editar información" });
    await expect(modal).toBeVisible();

    // El input de "Nombre" no tiene <label htmlFor> asociado (solo un <span>
    // visual junto al ConfidenceBadge), así que se localiza por posición: es
    // el primer input de texto dentro de la sección "Información básica".
    const nameInput = modal.locator('input[type="text"]').first();
    await nameInput.fill("Ana Garcia Lopez EDITADO");

    await modal.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(modal).not.toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Ana Garcia Lopez EDITADO" })
    ).toBeVisible();

    await page.screenshot({ path: "e2e-downloads/flujo5-perfil-editado.png", fullPage: true });
  });
});
