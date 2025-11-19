const crypto = require("crypto");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const extRegex = /\.(png|jpg|jpeg|svg|webp|gif)$/;
const isImageFile = (file) => extRegex.test(file);
const isRelative = (url) => !/^https?:/.test(url);
const isProduction = process.env.ELEVENTY_RUN_MODE === "build";

module.exports = async function transformParser(content) {
  const outputPath = this.page.outputPath;
  const inputPath = this.page.inputPath;

  if (!outputPath || !outputPath.endsWith(".html")) return content;
  if (!inputPath.endsWith(".md")) return content;
  if (!content.includes("<img")) return content;

  const templateDir = path.dirname(path.resolve(inputPath));
  const outputDir = path.dirname(path.resolve(outputPath));

  const $ = cheerio.load(content);
  const elements = $("img").toArray();

  await Promise.all(
    elements.map(async (img) => {
      try {
        const src = img.attribs.src;
        if (!src || !isRelative(src) || !isImageFile(src)) return;
        const paths = await buildPaths(templateDir, outputDir, src);
        // Check if source file exists before processing
        if (!fs.existsSync(paths.sourcePath)) {
          console.warn(`[Assets] Image not found: ${paths.sourcePath} (referenced in ${inputPath})`);
          return;
        }

        $(img).attr("src", paths.newSrc);

        try {
          fs.mkdirSync(paths.destDir, { recursive: true });
          await fs.promises.copyFile(paths.sourcePath, paths.destPath);
        } catch (copyError) {
          console.warn(`[Assets] Failed to copy image ${paths.sourcePath} to ${paths.destPath}:`, copyError.message);
        }
      } catch (error) {
        console.warn(`[Assets] Error processing image in ${inputPath}:`, error.message);
      }
    })
  );

  return $.html();
};

async function buildPaths(templateDir, outputDir, src) {
  const assetPath = path.join(templateDir, src);
  const assetDir = path.dirname(assetPath);
  const assetSubdir = path.relative(templateDir, assetDir);
  const assetBasename = path.basename(assetPath);
  const ext = path.extname(assetBasename);

  let destDir = path.join(outputDir, assetSubdir);
  let destPath = path.join(destDir, assetBasename);
  let relativeDestPath = path.join("./", assetSubdir, assetBasename);

  if (isProduction) {
    try {
      const hash = await hashFile(assetPath);
      destDir = outputDir;
      destPath = path.join(destDir, hash + ext);
      relativeDestPath = `./${hash + ext}`;
    } catch (error) {
      // If hashing fails, fall back to non-hashed path
      console.warn(`[Assets] Failed to hash file ${assetPath}, using original name:`, error.message);
    }
  }

  return {
    newSrc: relativeDestPath,
    sourceDir: assetDir,
    sourcePath: assetPath,
    destDir: destDir,
    destPath,
  };
}

function hashFile(filename) {
  return new Promise((resolve, reject) => {
    // Check if file exists before attempting to read
    if (!fs.existsSync(filename)) {
      return reject(new Error(`File not found: ${filename}`));
    }

    let shasum = crypto.createHash("sha1");
    try {
      let s = fs.ReadStream(filename);
      s.on("error", function (error) {
        return reject(error);
      });
      s.on("data", function (data) {
        shasum.update(data);
      });
      s.on("end", function () {
        const hash = shasum.digest("hex");
        return resolve(hash);
      });
    } catch (error) {
      return reject(error);
    }
  });
}
