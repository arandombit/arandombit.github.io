module.exports = async (outputDir) => {
  try {
    const pagefind = await import("pagefind");
    const { index } = await pagefind.createIndex();

    await index.addDirectory({ path: outputDir });
    await index.writeFiles({
      outputPath: `${outputDir}/pagefind`,
    });
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Failed to create search index in ${outputDir}: ${error.message}`);
  }
};
