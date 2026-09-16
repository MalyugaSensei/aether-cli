import type { SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";

export function addNamedImportIfMissing(
  sf: SourceFile,
  moduleSpecifier: string,
  namedImports: string[],
): void {
  const existing = sf.getImportDeclaration(
    (d) => d.getModuleSpecifierValue() === moduleSpecifier,
  );

  if (!existing) {
    sf.addImportDeclaration({
      moduleSpecifier,
      namedImports: namedImports.map((name) => ({ name })),
    });
    return;
  }

  for (const name of namedImports) {
    const has = existing.getNamedImports().some((ni) => ni.getName() === name);
    if (!has) {
      existing.addNamedImport(name);
    }
  }
}

function findVariableArrayLiteral(
  sf: SourceFile,
  variableName: string,
): import("ts-morph").ArrayLiteralExpression | undefined {
  for (const decl of sf.getVariableDeclarations()) {
    if (decl.getName() !== variableName) continue;
    const init = decl.getInitializer();
    if (!init || !init.isKind(SyntaxKind.ArrayLiteralExpression)) continue;
    return init.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  }
  return undefined;
}

function spreadContainsIdentifier(
  element: import("ts-morph").Expression,
  identifier: string,
): boolean {
  if (element.isKind(SyntaxKind.SpreadElement)) {
    const expr = element.asKindOrThrow(SyntaxKind.SpreadElement).getExpression();
    if (expr.isKind(SyntaxKind.Identifier) && expr.getText() === identifier) {
      return true;
    }
  }
  return false;
}

function arrayContainsIdentifier(
  arr: import("ts-morph").ArrayLiteralExpression,
  identifier: string,
): boolean {
  return arr.getElements().some((el) => {
    if (el.isKind(SyntaxKind.Identifier) && el.getText() === identifier) {
      return true;
    }
    return spreadContainsIdentifier(el, identifier);
  });
}

/** Append identifier to `const <arrayName> = [...]` if not already present. */
export function appendToArrayLiteralIfMissing(
  sf: SourceFile,
  arrayVariableName: string,
  elementIdentifier: string,
  asSpread = false,
): void {
  const arr = findVariableArrayLiteral(sf, arrayVariableName);
  if (!arr) {
    throw new Error(
      `Could not find array variable "${arrayVariableName}" in ${sf.getFilePath()}`,
    );
  }
  if (arrayContainsIdentifier(arr, elementIdentifier)) {
    return;
  }
  if (asSpread) {
    arr.addElement(`...${elementIdentifier}`);
  } else {
    arr.addElement(elementIdentifier);
  }
}
