import { readFile } from "fs/promises";
import { join } from "path";

export const compiledHtml = async (templateName: string, injectables: any) => {
  const templatePath = join(__dirname, `/templates/${templateName}.html`);
  let htmlFile = await readFile(templatePath, "utf-8");

  Object.keys(injectables).forEach((key) => {
    const placeholder = `{{${key}}}`;
    htmlFile = htmlFile.replace(new RegExp(placeholder, "g"), injectables[key]);
  });
  return htmlFile;
};
