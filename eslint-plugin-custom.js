import fs from "node:fs";
import path from "node:path";

const checkImportPath = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure relative import paths point to real files on disk",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingFile: "Relative import '{{ importSource }}' does not match a file on disk.",
      wrongExtension:
        "Relative import '{{ importSource }}' does not match a file on disk. Use '{{ resolvedSource }}' instead.",
      ambiguousMatch:
        "Relative import '{{ importSource }}' does not match a file on disk, and multiple files share the same basename.",
    },
  },
  create(context) {
    const { filename } = context;

    function checkSource(node) {
      const importSource = node.source.value;

      if (typeof importSource !== "string" || !isRelativeImport(importSource)) {
        return;
      }

      if (fileExists(path.resolve(path.dirname(filename), importSource))) {
        return;
      }

      const matchingFiles = findMatchingFiles(filename, importSource);

      if (matchingFiles.length === 1) {
        const resolvedSource = toImportSource(filename, matchingFiles[0]);
        context.report({
          node: node.source,
          messageId: "wrongExtension",
          data: { importSource, resolvedSource },
          fix(fixer) {
            return fixer.replaceText(node.source, JSON.stringify(resolvedSource));
          },
        });
      } else if (matchingFiles.length > 1) {
        context.report({
          node: node.source,
          messageId: "ambiguousMatch",
          data: { importSource },
        });
      } else {
        context.report({
          node: node.source,
          messageId: "missingFile",
          data: { importSource },
        });
      }
    }

    return {
      ImportDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      ExportNamedDeclaration(node) {
        if (node.source) checkSource(node);
      },
    };
  },
};

function isRelativeImport(source) {
  return source.startsWith("./") || source.startsWith("../");
}

function fileExists(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

function findMatchingFiles(importerFilename, importSource) {
  const importerDir = path.dirname(importerFilename);
  const absoluteImportPath = path.resolve(importerDir, importSource);
  const targetDir = path.dirname(absoluteImportPath);
  const targetBaseName = path.basename(absoluteImportPath, path.extname(absoluteImportPath));
  return fs
    .readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.basename(entry.name, path.extname(entry.name)) === targetBaseName)
    .map((entry) => path.join(targetDir, entry.name));
}

function toImportSource(importerFilename, targetFilename) {
  const importerDir = path.dirname(importerFilename);
  let relativePath = path.relative(importerDir, targetFilename);
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}

const noTryFinally = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow try/finally — the React Compiler (oxc-transform-react) silently skips memoizing an entire " +
        "component or hook that contains one, with no diagnostic.",
    },
    schema: [],
    messages: {
      noFinally:
        "try/finally causes the React Compiler to silently skip this component/hook. " +
        "Reset state explicitly on both the success and catch paths instead of using finally.",
    },
  },
  create(context) {
    return {
      TryStatement(node) {
        if (node.finalizer) {
          context.report({ node, messageId: "noFinally" });
        }
      },
    };
  },
};

export default {
  rules: {
    "check-import-path": checkImportPath,
    "no-try-finally": noTryFinally,
  },
};
